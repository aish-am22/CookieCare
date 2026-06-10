import { pool } from "../config/database.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
import { withRetry } from "../utils/retry.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await withRetry(() => model.embedContent({
    content: { role: "user", parts: [{ text: text.replace(/\0/g, '') }] }
  })) as any;
  const vector = result.embedding?.values || result.embeddings?.[0]?.values;
  if (!vector) throw new Error("Failed to generate embedding.");
  return vector;
}

export async function chunkAndIndexDocument(fileId: string, content: string, userId: string) {
  const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 10);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].replace(/\0/g, '');
      const embedding = await embedText(chunk);
      await client.query(
        "INSERT INTO legal_document_chunks (file_id, user_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4, $5)",
        [fileId, userId, i, chunk, `[${embedding.join(",")}]`]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function searchHybrid(query: string, userId: string, fileIds?: string[], folderIds?: string[]) {
  const embedding = await embedText(query);
  const vectorStr = `[${embedding.join(",")}]`;

  let filterSql = "";
  const params: any[] = [userId, vectorStr];
  let pIdx = 3;

  if (fileIds && fileIds.length > 0) {
    filterSql += ` AND file_id = ANY($${pIdx++})`;
    params.push(fileIds);
  }
  if (folderIds && folderIds.length > 0) {
    filterSql += ` AND file_id IN (SELECT id FROM files WHERE folder_id = ANY($${pIdx++}))`;
    params.push(folderIds);
  }

  const { rows } = await pool.query(`
    SELECT content, file_id, (SELECT title FROM files WHERE id = file_id) as title
    FROM legal_document_chunks
    WHERE user_id = $1
    ${filterSql}
    ORDER BY embedding <=> $2
    LIMIT 5
  `, params);

  return rows;
}
