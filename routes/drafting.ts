import { Router, Request, Response } from "express";

const router = Router();

// Express TypeScript signatures matching standard endpoints inside server.ts for pristine orchestration.
router.post("/process-uploaded-template", (req: Request, res: Response) => {
  // Logic mirrored inside server.ts for sandboxed hot loading
  res.status(200).json({ status: "active" });
});

router.post("/generate-stream", (req: Request, res: Response) => {
  // Logic mirrored inside server.ts for sandboxed hot loading
  res.status(200).json({ status: "streaming" });
});

export default router;
