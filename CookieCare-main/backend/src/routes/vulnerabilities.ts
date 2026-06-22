import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { addJobToQueue } from "../services/jobQueue.js";

const router = Router();

router.post("/scan-cookie", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { url, scanDepth } = req.body;
  
    const job = await addJobToQueue(req.user!.id, "privacy_scanning", { url, scanDepth });
    
    res.status(202).json({ success: true, job_id: job.id });
  } catch (error) {
    console.error("Cookie scan queueing failed:", error);
    res.status(500).json({ success: false, error: "Failed to queue cookie scan" });
  }
});

router.post("/scan-vulnerability", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
  
    const job = await addJobToQueue(req.user!.id, "vulnerability_scanning", { url });
    
    res.status(202).json({ success: true, job_id: job.id });
  } catch (error) {
    console.error("Vulnerability scan queueing failed:", error);
    res.status(500).json({ success: false, error: "Failed to queue vulnerability scan" });
  }
});

export default router;