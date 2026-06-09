import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { addJobToQueue } from "../services/jobQueue.js";
import { withTransaction } from "../utils/dbUtils.js";
import { buildPdfBuffer, buildDocxBuffer } from "../services/exportService.js";
import { encryptData, decryptData } from "../utils/crypto.js";
import crypto from "crypto";
import * as diff from "diff";
import { fileTypeFromBuffer } from "file-type";

export const getDocuments = async (req: Request, res: Response) => {
  const userEmail = req.user!.email.toLowerCase();
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const docs = await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM files WHERE creator_id = current_setting('app.current_user_id', true) OR shared_with::jsonb @> $1::jsonb OR shared_with::jsonb @> $2::jsonb ORDER BY created_at DESC",
        [JSON.stringify([userEmail]), JSON.stringify([{ email: userEmail }])]
      );
      return rows;
    }).catch(e => {
      console.error("Failed to fetch documents from DB:", e);
      throw new Error("DB_FETCH_FAILED");
    });

    const formattedDocs = docs.map((r: any) => ({
      ...r,
      content: r.is_encrypted ? decryptData(r.content) : r.content,
      isEncrypted: r.is_encrypted,
      signatures: r.signatures || [],
      redlines: r.redlines || [],
      sharedWith: r.shared_with || [],
      auditLogs: r.audit_logs || [],
    }));
    return res.json(formattedDocs);
  } catch (err: any) {
    const message = err.message === "DB_FETCH_FAILED" ? "Security enclave database unreachable." : "Internal error fetching document repository.";
    res.status(500).json({ error: message });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const rows = await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query("SELECT * FROM files WHERE id = $1", [req.params.id]);
      return rows;
    });

    if (rows.length > 0) {
      const r = rows[0];

      const doc = {
        ...r,
        content: r.is_encrypted ? decryptData(r.content) : r.content,
        versions: (r.versions || []).map((v: any) => ({
          ...v,
          content: decryptData(v.content),
        })),
        signatures: r.signatures || [],
        redlines: r.redlines || [],
        sharedWith: r.shared_with || [],
        auditLogs: r.audit_logs || [],
      };
      return res.json(doc);
    }
    res.status(404).json({ error: "Document not found." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createDocument = async (req: Request, res: Response) => {
  const { title, type, content } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const email = req.user!.email;

  const id = "doc_" + crypto.randomUUID();
  const encryptedContent = encryptData(content || "");

  try {
    await withTransaction(userId, userRole, async (client) => {
      await client.query(
        `INSERT INTO files (id, title, type, content, creator_id, creator_email, is_encrypted, versions, shared_with, audit_logs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, title, type, encryptedContent, userId, email, true, JSON.stringify([]), JSON.stringify([]), JSON.stringify([])]
      );
    });
    res.status(201).json({ id, title, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded. Verify multipart/form-data boundary." });

  // Security Layer: Basic file integrity and MIME checks
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/msword'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: "Unsupported file type. Only PDF, DOCX, and TXT are permitted for legal indexing." });
  }

  if (file.size > 25 * 1024 * 1024) { // 25MB limit
    return res.status(400).json({ error: "File size exceeds 25MB security threshold." });
  }

  // Phase 3 Hardening: Magic Byte Verification (Deep File Inspection)
  const type = await fileTypeFromBuffer(file.buffer);
  const detectedMime = type?.mime || file.mimetype;

  if (!allowedMimeTypes.includes(detectedMime)) {
    return res.status(400).json({ error: "File signature mismatch. Extension does not match content magic bytes." });
  }

  const { title, folder_id } = req.body;
  const fileId = "doc_" + crypto.randomUUID();
  const fileTitle = title || file.originalname;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    await withTransaction(userId, userRole, async (client) => {
      await client.query(
        `INSERT INTO files (id, title, type, content, creator_id, creator_email, mime_type, folder_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [fileId, fileTitle, "upload", "", req.user!.id, req.user!.email, file.mimetype, folder_id || null]
      );
    }).catch(e => {
      console.error("Database insert failed during upload:", e);
      throw new Error("DB_UPLOAD_FAILED");
    });

    const job = await addJobToQueue(req.user!.id, "file_processing", {
      fileId,
      fileTitle,
      fileBufferBase64: file.buffer.toString("base64"),
      mimeType: file.mimetype,
      folder_id: folder_id || null,
      creatorEmail: req.user!.email
    });

    res.status(202).json({ success: true, job_id: job.id, file_id: fileId });
  } catch (err: any) {
    console.error("Document upload route crash:", err);
    const message = err.message === "DB_UPLOAD_FAILED" ? "Failed to register upload in security log." : "Internal error during background job queueing.";
    res.status(500).json({ error: message });
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, folder_id } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    await withTransaction(userId, userRole, async (client) => {
      // 1. Get current document to archive version
      const { rows } = await client.query("SELECT * FROM files WHERE id = $1", [id]);
      if (rows.length === 0) throw new Error("Document not found");
      const doc = rows[0];

      const versions = doc.versions || [];
      const oldContent = doc.content;
      versions.push({
        id: crypto.randomUUID(),
        content: oldContent, // Already encrypted
        createdAt: new Date().toISOString(),
        author: req.user!.email
      });

      // 2. Update document
      const encryptedContent = content ? encryptData(content) : doc.content;
      await client.query(
        `UPDATE files SET title = COALESCE($1, title), content = $2, folder_id = COALESCE($3, folder_id), versions = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
        [title || null, encryptedContent, folder_id || null, JSON.stringify(versions), id]
      );

      // 3. Log action
      await client.query(`
        INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
        VALUES ($1, $2, $3)
      `, [userId, 'document_update', JSON.stringify({ documentId: id, title })]);
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message === "Document not found" ? 404 : 500).json({ error: err.message });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    await withTransaction(userId, userRole, async (client) => {
      // 1. Delete associated RAG chunks first
      await client.query("DELETE FROM legal_document_chunks WHERE file_id = $1", [id]);

      // 2. Delete file
      const { rowCount } = await client.query("DELETE FROM files WHERE id = $1", [id]);
      if (rowCount === 0) throw new Error("Document not found");

      // 3. Log action
      await client.query(`
        INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
        VALUES ($1, $2, $3)
      `, [userId, 'document_delete', JSON.stringify({ documentId: id })]);
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message === "Document not found" ? 404 : 500).json({ error: err.message });
  }
};

export const shareDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, permissions } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // Phase 3 Hardening: Input Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const allowedPermissions = ["view", "edit", "admin"];
  if (!permissions || !allowedPermissions.includes(permissions)) {
    return res.status(400).json({ error: "Invalid permissions. Must be view, edit, or admin." });
  }

  try {
    await withTransaction(userId, userRole, async (client) => {
      // Check if user to share with exists
      const { rows: userRows } = await client.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
      if (userRows.length === 0) throw new Error("USER_NOT_FOUND");

      const { rows } = await client.query("SELECT shared_with FROM files WHERE id = $1", [id]);
      if (rows.length === 0) throw new Error("Document not found");

      let sharedWith = rows[0].shared_with || [];
      // Ensure sharedWith is an array of objects
      if (sharedWith.length > 0 && typeof sharedWith[0] === 'string') {
        // Migration: convert old string array to object array
        sharedWith = sharedWith.map((e: string) => ({ email: e, permissions: "view" }));
      }

      const existingIndex = sharedWith.findIndex((s: any) => s.email === email.toLowerCase());
      if (existingIndex > -1) {
        sharedWith[existingIndex].permissions = permissions;
      } else {
        sharedWith.push({ email: email.toLowerCase(), permissions });
      }

      await client.query("UPDATE files SET shared_with = $1 WHERE id = $2", [JSON.stringify(sharedWith), id]);

      await client.query(`
        INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
        VALUES ($1, $2, $3)
      `, [userId, 'document_share', JSON.stringify({ documentId: id, sharedWith: email, permissions })]);
    });

    res.json({ success: true });
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") return res.status(404).json({ error: "User with this email not found." });
    res.status(err.message === "Document not found" ? 404 : 500).json({ error: err.message });
  }
};

export const signDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { signatureData } = req.body; // e.g. base64 signature or cryptographic hash
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query("SELECT signatures, content, is_encrypted FROM files WHERE id = $1", [id]);
      if (rows.length === 0) throw new Error("Document not found");

      const signatures = rows[0].signatures || [];
      const plaintext = rows[0].is_encrypted ? decryptData(rows[0].content) : rows[0].content;
      const contentHash = crypto.createHash('sha256').update(plaintext, 'utf8').digest('hex');

      const newSignature = {
        id: crypto.randomUUID(),
        userId,
        userEmail: req.user!.email,
        signedAt: new Date().toISOString(),
        contentHash, // Lock signature to current content state
        signatureData
      };

      signatures.push(newSignature);
      await client.query("UPDATE files SET signatures = $1 WHERE id = $2", [JSON.stringify(signatures), id]);

      await client.query(`
        INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
        VALUES ($1, $2, $3)
      `, [userId, 'document_sign', JSON.stringify({ documentId: id, signatureId: newSignature.id })]);
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(err.message === "Document not found" ? 404 : 500).json({ error: err.message });
  }
};

export const createRedline = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { originalText, proposedText, comment } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const newRedline = await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query("SELECT redlines FROM files WHERE id = $1", [id]);
      if (rows.length === 0) throw new Error("Document not found");
      const redlines = rows[0].redlines || [];
      const redline = { id: crypto.randomUUID(), originalText, proposedText, comment, proposedByEmail: req.user!.email, proposedAt: new Date().toISOString(), status: "pending" };
      redlines.push(redline);
      await client.query("UPDATE files SET redlines = $1 WHERE id = $2", [JSON.stringify(redlines), id]);
      return redline;
    });
    res.status(201).json(newRedline);
  } catch (err: any) {
    res.status(err.message === "Document not found" ? 404 : 500).json({ error: err.message });
  }
};

export const acceptRedline = async (req: Request, res: Response) => {
  const { id, redlineId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const rows = await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query("SELECT * FROM files WHERE id = $1", [id]);
      return rows;
    });

    if (rows.length === 0) return res.status(404).json({ error: "Document not found" });

    const doc = rows[0];
    const redlines = doc.redlines || [];
    const index = redlines.findIndex((r: any) => r.id === redlineId);
    if (index === -1) return res.status(404).json({ error: "Redline not found" });

    const currentContent = decryptData(doc.content);
    const proposal = redlines[index];

    // Use resilient patch-and-apply logic instead of simple .replace()
    // 1. Create a patch from the original vs proposed text
    const patch = diff.createPatch("content", proposal.originalText, proposal.proposedText);

    // 2. Apply the patch to the full document content
    const applied = diff.applyPatch(currentContent, patch);

    if (applied === false) {
      // Phase 2: Context-Aware Fuzzy Matching Fallback
      // Search for the original text while ignoring whitespace and case sensitivity
      const normalizedOriginal = proposal.originalText.replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedDoc = currentContent.replace(/\s+/g, ' ').toLowerCase();

      let finalContent = currentContent;
      if (normalizedDoc.includes(normalizedOriginal)) {
        // Attempt to find the real start/end indexes in the original unnormalized content
        // This is a simple heuristic: if the normalized version matches, we try to find the best string match
        // and replace it. For a production-grade fuzzy match, we'd use Levenshtein distance.
        const occurrences = getAllIndexesOfNormalizedMatch(currentContent, proposal.originalText);
        if (occurrences.length === 1) {
          finalContent = currentContent.substring(0, occurrences[0].start) + proposal.proposedText + currentContent.substring(occurrences[0].end);
        } else {
          // Direct fallback if heuristic is ambiguous
          const fallbackReplaced = currentContent.replace(proposal.originalText, proposal.proposedText);
          if (fallbackReplaced === currentContent && currentContent.indexOf(proposal.originalText) === -1) {
            return res.status(400).json({ error: "Could not apply redline. Document structure has changed significantly." });
          }
          finalContent = fallbackReplaced;
        }
      } else {
        return res.status(400).json({ error: "Could not apply redline. Clause not found in current document state." });
      }

      redlines[index].status = "accepted";
      await withTransaction(req.user!.id, req.user!.role, async (client) => {
        await client.query("UPDATE files SET content = $1, redlines = $2 WHERE id = $3", [encryptData(finalContent), JSON.stringify(redlines), id]);
        await client.query(`
          INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
          VALUES ($1, $2, $3)
        `, [req.user!.id, 'redline_accept', JSON.stringify({ documentId: id, redlineId })]);
      });
    } else {
      redlines[index].status = "accepted";
      await withTransaction(req.user!.id, req.user!.role, async (client) => {
        await client.query("UPDATE files SET content = $1, redlines = $2 WHERE id = $3", [encryptData(applied), JSON.stringify(redlines), id]);
        await client.query(`
          INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
          VALUES ($1, $2, $3)
        `, [req.user!.id, 'redline_accept', JSON.stringify({ documentId: id, redlineId })]);
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Failed to accept redline:", err);
    res.status(500).json({ error: err.message });
  }
};

export const rejectRedline = async (req: Request, res: Response) => {
  const { id, redlineId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    const rows = await withTransaction(userId, userRole, async (client) => {
      const { rows } = await client.query("SELECT redlines FROM files WHERE id = $1", [id]);
      return rows;
    });

    if (rows.length === 0) return res.status(404).json({ error: "Document not found" });
    const redlines = rows[0].redlines || [];
    const index = redlines.findIndex((r: any) => r.id === redlineId);
    if (index === -1) return res.status(404).json({ error: "Redline not found" });
    redlines[index].status = "rejected";
    await withTransaction(req.user!.id, req.user!.role, async (client) => {
      await client.query("UPDATE files SET redlines = $1 WHERE id = $2", [JSON.stringify(redlines), id]);

      await client.query(`
        INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
        VALUES ($1, $2, $3)
      `, [req.user!.id, 'redline_reject', JSON.stringify({ documentId: id, redlineId })]);
    });

    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
};

/**
 * Helper for fuzzy matching: finds original string boundaries by normalized comparison
 */
function getAllIndexesOfNormalizedMatch(source: string, target: string) {
  const results = [];
  const targetNorm = target.replace(/\s+/g, ' ').trim().toLowerCase();

  // Slide a window across the source (expensive but accurate for small legal docs)
  for (let i = 0; i < source.length; i++) {
    for (let j = i + target.length * 0.8; j < i + target.length * 1.2; j++) {
      const sub = source.substring(i, j);
      if (sub.replace(/\s+/g, ' ').trim().toLowerCase() === targetNorm) {
        results.push({ start: i, end: j });
        i = j; // Skip ahead
        break;
      }
    }
  }
  return results;
}

export const exportDocument = async (req: Request, res: Response) => {
  const { title, format, contentType, content, documentId } = req.body;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  try {
    // Audit document export
    if (documentId) {
      await withTransaction(userId, userRole, async (client) => {
        await client.query(`
          INSERT INTO compliance_audit_logs (user_id, action_type, metadata)
          VALUES ($1, $2, $3)
        `, [userId, 'document_export', JSON.stringify({ documentId, format, title })]);
      });
    }

    let buffer: Buffer;
    let mimeType: string;
    let filename: string;

    if (format === "pdf") {
      buffer = await buildPdfBuffer(title, contentType, content);
      mimeType = "application/pdf";
      filename = `${title}.pdf`;
    } else {
      buffer = await buildDocxBuffer(title, contentType, content);
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      filename = `${title}.docx`;
    }

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
