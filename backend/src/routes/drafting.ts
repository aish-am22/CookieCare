import { Router, Request, Response } from "express";
import { DraftingAgent } from "../agents/draftingAgent.js";
import { authenticateToken } from "../middleware/auth.js";
import { pool } from "../config/database.js";

const router = Router();
const draftingAgent = new DraftingAgent();

router.post("/process-uploaded-template", authenticateToken, async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const userId = req.user!.id;
  try {
    const fileId = "tmpl_" + Math.random().toString(36).substr(2, 9);
    await pool.query(
      `INSERT INTO files (id, title, type, content, creator_id, creator_email, is_template)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [fileId, title || "Template", "template", content || "", userId, req.user!.email, true]
    );
    res.status(201).json({ success: true, file_id: fileId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/generate-stream", authenticateToken, async (req: Request, res: Response) => {
  try {
    const draft = await draftingAgent.draftDocument(req.body);
    res.json({ draft });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
