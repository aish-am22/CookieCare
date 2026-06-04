import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { pool } from "../config/database.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

function sanitizeText(str: string): string {
  if (!str) return str;
  return str.replace(/\0/g, "");
}

export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await (genAI as any).getGenerativeModel({ model: "text-embedding-004" }).embedContent(text);

    if (result && (result as any).embedding?.values) {
      return (result as any).embedding.values;
    }

    if (result && (result as any).embeddings?.[0]?.values) {
      return (result as any).embeddings[0].values;
    }

    return null;
  } catch (err) {
    console.error("getEmbedding failed:", err);
    return null;
  }
}

export async function chunkAndIndexDocument(fileId: string, content: string, userId: string) {
  let client;
  try {
    client = await pool.connect();
    await client.query("DELETE FROM legal_document_chunks WHERE file_id = $1 AND user_id = $2;", [fileId, userId]);
    
    const cleanedContent = sanitizeText(content);
    const chunks = splitIntoClauseAwareChunks(cleanedContent);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk || chunk.trim().length === 0) continue;

      const vector = await getEmbedding(chunk);
      if (!vector || !Array.isArray(vector)) continue;

      const vectorString = `[${vector.join(",")}]`;

      await client.query(`
        INSERT INTO legal_document_chunks (file_id, user_id, chunk_index, content, embedding, metadata)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [fileId, userId, i, sanitizeText(chunk), vectorString, JSON.stringify({})]);
    }
  } catch (err) {
    console.error(`chunkAndIndexDocument failed for file ${fileId}:`, err);
  } finally {
    if (client) client.release();
  }
}

function splitIntoClauseAwareChunks(text: string, maxChars = 2000): string[] {
  if (!text) return [];

  // Improved regex to identify legal boundaries without losing the headers
  const clauseBoundaries = [
    /\n\s*(?=ARTICLE\s+[\d\.]+)/i,
    /\n\s*(?=SECTION\s+[\d\.]+)/i,
    /\n\s*(?=CLAUSE\s+[\d\.]+)/i,
    /\n\s*(?=\d+\.\s+[A-Z\s]{3,})/i
  ];

  let sections = [text];
  for (const regex of clauseBoundaries) {
    sections = sections.flatMap(s => s.split(regex));
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if ((currentChunk.length + trimmed.length) <= maxChars) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (trimmed.length > maxChars) {
        // Fallback: split by double newline if a single clause is too big
        const paragraphs = trimmed.split(/\n\s*\n/);
        let tempChunk = "";
        for (const para of paragraphs) {
          if ((tempChunk.length + para.length) <= maxChars) {
            tempChunk += (tempChunk ? "\n\n" : "") + para;
          } else {
            if (tempChunk) chunks.push(tempChunk);
            tempChunk = para;
          }
        }
        currentChunk = tempChunk;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Hybrid Search: Combines Vector Similarity with Keyword-based search.
 */
export async function hybridSearch(userId: string, query: string, limit = 5): Promise<string[]> {
  const sanitizedQuery = sanitizeText(query);
  const vector = await getEmbedding(sanitizedQuery);

  let client;
  try {
    client = await pool.connect();

    if (!vector) {
      const { rows } = await client.query(`
        SELECT content FROM legal_document_chunks
        WHERE user_id = $1 AND content ILIKE $2
        LIMIT $3;
      `, [userId, `%${sanitizedQuery}%`, limit]);
      return rows.map((r) => r.content);
    }

    const vectorString = `[${vector.join(",")}]`;

    // Reciprocal Rank Fusion (simplified) or Weighted combination
    const { rows } = await client.query(`
      WITH vector_results AS (
        SELECT id, content, 1.0 / (1.0 + (embedding <=> $1::vector)) AS score
        FROM legal_document_chunks
        WHERE user_id = $2 AND embedding IS NOT NULL
        ORDER BY score DESC
        LIMIT 20
      ),
      keyword_results AS (
        SELECT id, content, 1.0 AS score
        FROM legal_document_chunks
        WHERE user_id = $2 AND content ILIKE ANY($4)
        LIMIT 20
      )
      SELECT content FROM (
        SELECT id, content, score FROM vector_results
        UNION ALL
        SELECT id, content, score FROM keyword_results
      ) combined
      GROUP BY id, content
      ORDER BY SUM(score) DESC
      LIMIT $3;
    `, [vectorString, userId, limit, sanitizedQuery.split(/\s+/).filter(k => k.length >= 2).map(k => `%${k}%`)]);

    return rows.map((r) => r.content);
  } catch (err) {
    console.error("hybridSearch failed:", err);
    return [];
  } finally {
    if (client) client.release();
  }
}

export async function semanticSearch(userId: string, query: string, limit = 5): Promise<string[]> {
  return hybridSearch(userId, query, limit);
}
