import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post("/generate", authenticateToken, async (req: Request, res: Response) => {
  const { draftInput, instructions, detailLevel, jurisdiction } = req.body;
  try {
    const draft = await orchestrator.runDrafting({ draftInput, instructions, detailLevel, jurisdiction });
    res.json({ draft });
  } catch (err: any) {
    res.status(500).json({ error: "Drafting failed" });
  }
});

export default router;
