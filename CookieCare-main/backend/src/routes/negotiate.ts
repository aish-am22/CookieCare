import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";

const router = Router();
const orchestrator = new AgentOrchestrator();

router.post("/run", authenticateToken, async (req, res) => {
  try {
    const { documentContent, playbooks, instructions } = req.body;
    const result = await orchestrator.runNegotiation(documentContent, playbooks, instructions);
    res.json({ redlines: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
