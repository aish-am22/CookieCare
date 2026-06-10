import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { semanticSearch } from "../RAG/ragService.js";
import { pool } from "../config/database.js";
import { addJobToQueue } from "../services/jobQueue.js";

const router = Router();

async function getSystemSettings(key: string, client: any) {
  const { rows } = await client.query("SELECT value FROM system_settings WHERE key = $1", [key]);
  return rows.length > 0 ? rows[0].value : null;
}
const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");


router.post("/ask", authenticateToken, async (req: Request, res: Response) => {
  const {
    prompt,
    jurisdiction = [],
    outputFormat = "Brief Summary",
    documents = []
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No query provided." });
  }

  try {
    const job = await addJobToQueue(req.user!.id, "document_analysis", {
      type: "legal_ask",
      prompt,
      jurisdiction,
      outputFormat,
      documents
    });

    res.status(202).json({ success: true, job_id: job.id });
  } catch (err: any) {
    console.error("Lawyer ask queue error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
