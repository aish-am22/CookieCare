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

function splitIntoClauseAwareChunks(text: string, maxChars = 1500): string[] {
  if (!text) return [];
  const clauseRegex = /\n\s*(?:ARTICLE|SECTION|CLAUSE)\s+[\d\.]+|^\s*(?:ARTICLE|SECTION|CLAUSE)\s+[\d\.]+|\n\s*[\d]+\.\s+[A-Z\s]{3,}/i;
  const sections = text.split(clauseRegex);
  const chunks: string[] = [];
  let currentChunk = "";
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    if (currentChunk.length + trimmed.length <= maxChars) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (trimmed.length > maxChars) {
        const subParagraphs = trimmed.split(/\n\s*\n/);
        let subChunk = "";
        for (const para of subParagraphs) {
          if (subChunk.length + para.length <= maxChars) {
            subChunk += (subChunk ? "\n\n" : "") + para;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = para;
          }
        }
        if (subChunk) currentChunk = subChunk;
        else currentChunk = "";
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

    const { rows } = await client.query(`
      WITH vector_results AS (
        SELECT id, content, (embedding <=> $1::vector) AS distance
        FROM legal_document_chunks
        WHERE user_id = $2 AND embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT $3
      ),
      keyword_results AS (
        SELECT id, content, 0 AS distance
        FROM legal_document_chunks
        WHERE user_id = $2 AND content ILIKE ANY($4)
        LIMIT $3
      )
      SELECT content FROM (
        SELECT * FROM vector_results
        UNION ALL
        SELECT * FROM keyword_results
      ) combined
      GROUP BY content, distance
      ORDER BY distance ASC
      LIMIT $3;
    `, [vectorString, userId, limit, sanitizedQuery.split(/\s+/).map(k => `%${k}%`)]);

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
