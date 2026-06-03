import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { jobQueue } from "../services/jobQueue.js";

const router = Router();

router.get("/stream", authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const clientId = jobQueue.addClient(userId, res);

  req.on("close", () => {
    jobQueue.removeClient(clientId);
  });
});

router.get("/", authenticateToken, (req: Request, res: Response) => {
  const jobs = jobQueue.getUserJobs(req.user!.id);
  res.json(jobs);
});

router.get("/:id", authenticateToken, (req: Request, res: Response) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job || job.userId !== req.user!.id) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

export default router;
