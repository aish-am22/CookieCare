import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post("/remediate", authenticateToken, async (req, res) => {
  try {
    const { documentId, content } = req.body;
    const result = await orchestrator.remediate(documentId, content, req.user!.id, req.user!.role);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
