import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const router = Router();
const orchestrator = new AgentOrchestrator();
const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const { mode, detailLevel, instructions, formFields, templateId, sourceText, playbookText } = req.body;
    const result = await orchestrator.runDrafting({
      mode,
      detailLevel,
      instructions,
      formFields,
      templateId,
      sourceText,
      playbookText
    });
    res.json({ content: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
