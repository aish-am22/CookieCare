import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post("/remediate", authenticateToken, async (req: Request, res: Response) => {
  const { clauseText, riskType } = req.body;
  try {
    const result = await orchestrator.remediate(clauseText, riskType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Remediation failed" });
  }
});

router.post("/interact", authenticateToken, async (req: Request, res: Response) => {
  const { folderIds, prompt, documentMode, answerStyle, history } = req.body;
  const userId = req.user!.id;

  try {
    const result = await orchestrator.interactAnalyze(
      folderIds,
      prompt,
      userId,
      documentMode,
      answerStyle,
      history
    );
    res.json(result);
  } catch (err: any) {
    console.error("Interact analyze error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
