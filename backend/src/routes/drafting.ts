import { Router, Request, Response } from "express";

const router = Router();

// Express routing and pipeline agent contracts
router.post("/process-uploaded-template", (req: Request, res: Response) => {
  res.status(200).json({ status: "active" });
});

router.post("/generate-stream", (req: Request, res: Response) => {
  res.status(200).json({ status: "streaming" });
});

export default router;
