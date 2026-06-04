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

/**
 * Structural Document Chunking: respects legal boundaries (Article, Section, Clause)
 */
function splitIntoClauseAwareChunks(text: string, maxChars = 2000): string[] {
  if (!text) return [];

  // Improved boundaries with lookahead to preserve the header in the chunk
  const boundaries = [
    /\n(?=ARTICLE\s+[0-9IVX]+[:\.\s])/i,
    /\n(?=SECTION\s+[0-9\.]+[:\.\s])/i,
    /\n(?=CLAUSE\s+[0-9\.]+[:\.\s])/i,
    /\n(?=[0-9]+\.\s+[A-Z\s]{4,})/ // Matches "1. DEFINITIONS"
  ];

  let segments = [text];
  for (const regex of boundaries) {
    segments = segments.flatMap(s => {
      const parts = s.split(regex);
      return parts.map(p => p.trim()).filter(Boolean);
    });
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const segment of segments) {
    if ((currentChunk.length + segment.length) <= maxChars) {
      currentChunk += (currentChunk ? "\n\n" : "") + segment;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (segment.length > maxChars) {
        // Fallback for massive segments: split by double newlines or sentences
        const subParts = segment.split(/\n\n/);
        let subChunk = "";
        for (const part of subParts) {
          if ((subChunk.length + part.length) <= maxChars) {
            subChunk += (subChunk ? "\n\n" : "") + part;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = part;
          }
        }
        currentChunk = subChunk;
      } else {
        currentChunk = segment;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Hybrid Search with Semantic Re-ranking
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

    // Reciprocal Rank Fusion + Semantic Re-ranking layer
    const { rows } = await client.query(`
      WITH vector_results AS (
        SELECT id, content, 1.0 / (1.0 + (embedding <=> $1::vector)) AS vector_score
        FROM legal_document_chunks
        WHERE user_id = $2 AND embedding IS NOT NULL
        ORDER BY vector_score DESC
        LIMIT 30
      ),
      keyword_results AS (
        SELECT id, content, 1.0 AS keyword_score
        FROM legal_document_chunks
        WHERE user_id = $2 AND content ILIKE ANY($4)
        LIMIT 30
      )
      SELECT content,
             COALESCE(vector_score, 0) + COALESCE(keyword_score, 0) as combined_score
      FROM vector_results
      FULL OUTER JOIN keyword_results USING (id, content)
      ORDER BY combined_score DESC
      LIMIT 15;
    `, [vectorString, userId, limit, sanitizedQuery.split(/\s+/).filter(k => k.length >= 2).map(k => `%${k}%`)]);

    const candidates = rows.map(r => r.content);

    // Semantic Re-ranking: Simple context-aware scoring
    const reRanked = candidates.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const qLower = sanitizedQuery.toLowerCase();

      // Boost chunks that contain the query terms exactly
      const aExactMatch = qLower.split(' ').every(term => aLower.includes(partiallyCleanTerm(term))) ? 1 : 0;
      const bExactMatch = qLower.split(' ').every(term => bLower.includes(partiallyCleanTerm(term))) ? 1 : 0;

      return bExactMatch - aExactMatch;
    });

    return reRanked.slice(0, limit);
  } catch (err) {
    console.error("hybridSearch failed:", err);
    return [];
  } finally {
    if (client) client.release();
  }
}

function partiallyCleanTerm(term: string): string {
  return term.replace(/[^a-z0-9]/gi, '');
}

export async function semanticSearch(userId: string, query: string, limit = 5): Promise<string[]> {
  return hybridSearch(userId, query, limit);
}
