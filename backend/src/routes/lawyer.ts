import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const router = Router();
const orchestrator = new AgentOrchestrator();
const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

router.post("/ask", authenticateToken, async (req, res) => {
  try {
    const { prompt, documentIds } = req.body;
    const result = await orchestrator.askLawyer(prompt, req.user!.id, documentIds);
    res.json({ advice: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
