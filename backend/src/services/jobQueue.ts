import { pool } from "../config/database.js";
import { chunkAndIndexDocument } from "../RAG/ragService.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";
import { ScannerService } from "./scannerService.js";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "a".repeat(32);
const ALGORITHM = "aes-256-gcm";

const encryptData = (text: string) => {
  if (!text) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `LEXGCM_${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export type JobType =
  | "file_processing"
  | "document_analysis"
  | "template_drafting"
  | "privacy_scanning"
  | "vulnerability_scanning";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message: string;
  payload: any;
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

type SseClient = {
  id: string;
  userId: string;
  send: (data: string) => void;
};

class BackgroundJobQueue {
  private jobs: Map<string, Job> = new Map();
  private clients: Set<SseClient> = new Set();
  private activeWorkers = 0;
  private maxConcurrency = 3;
  private queue: string[] = [];
  private orchestrator = new AgentOrchestrator();
  private scanner = new ScannerService();

  constructor() {
    setInterval(() => this.processNext(), 1000);
  }

  public enqueue(userId: string, type: JobType, payload: any): Job {
    const job: Job = {
      id: "job_" + Math.random().toString(36).substr(2, 9),
      userId,
      type,
      status: "queued",
      progress: 0,
      message: "Job enqueued. Waiting for active worker slot...",
      payload,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);
    this.queue.push(job.id);
    this.broadcast(job);
    return job;
  }

  public getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  public getUserJobs(userId: string): Job[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public updateJob(id: string, updates: Partial<Pick<Job, "status" | "progress" | "message" | "result" | "error" | "completedAt">>): void {
    const job = this.jobs.get(id);
    if (!job) return;

    Object.assign(job, updates);
    if (updates.status === "completed" || updates.status === "failed") {
      job.completedAt = new Date().toISOString();
    }

    this.broadcast(job);
  }

  private broadcast(job: Job): void {
    const payloadStr = JSON.stringify({ event: "job_update", job });
    for (const client of this.clients) {
      if (client.userId === job.userId) {
        client.send(`data: ${payloadStr}\n\n`);
      }
    }
  }

  public addClient(userId: string, res: any): string {
    const id = "client_" + Math.random().toString(36).substr(2, 9);
    res.write(`data: ${JSON.stringify({ event: "ping", timestamp: new Date().toISOString() })}\n\n`);

    const client: SseClient = {
      id,
      userId,
      send: (data: string) => {
        try {
          res.write(data);
        } catch (err) {
          console.warn("[JobQueue SSE] Failed to push data for client:", id);
        }
      },
    };

    this.clients.add(client);
    return id;
  }

  public removeClient(id: string): void {
    for (const client of this.clients) {
      if (client.id === id) {
        this.clients.delete(client);
        break;
      }
    }
  }

  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const jobId = this.queue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job) return;

    this.activeWorkers++;
    this.updateJob(job.id, {
      status: "processing",
      progress: 5,
      message: "Acquiring secure execution container...",
    });

    this.runWorker(job)
      .catch((err) => {
        console.error(`[BackgroundJobQueue] Fatal execution error on Job ${job.id}:`, err);
        this.updateJob(job.id, {
          status: "failed",
          progress: 100,
          message: "Execution halted: " + (err.message || String(err)),
          error: err.message || String(err),
        });
      })
      .finally(() => {
        this.activeWorkers--;
        this.processNext();
      });
  }

  private async runWorker(job: Job): Promise<void> {
    const { type } = job;
    switch (type) {
      case "file_processing":
        await this.executeFileProcessing(job);
        break;
      case "document_analysis":
        await this.executeDocumentAnalysis(job);
        break;
      case "privacy_scanning":
        await this.executePrivacyScanning(job);
        break;
      case "vulnerability_scanning":
        await this.executeVulnerabilityScanning(job);
        break;
      default:
        throw new Error(`Unhandled job executor target type: ${type}`);
    }
  }

  private async executeFileProcessing(job: Job): Promise<void> {
    const { id: jobId, payload, userId } = job;
    const { fileId, fileBufferBase64, mimeType, fileTitle, creatorEmail, folder_id } = payload;

    this.updateJob(jobId, { progress: 15, message: "Extracting text from document..." });
    const buffer = Buffer.from(fileBufferBase64, "base64");
    let content = "";

    try {
      if (mimeType === "application/pdf") {
        const data = await pdf(buffer);
        content = data.text;
      } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const data = await mammoth.extractRawText({ buffer });
        content = data.value;
      } else if (mimeType.startsWith("text/")) {
        content = buffer.toString("utf-8");
      } else {
        content = buffer.toString("utf-8").replace(/[^\x20-\x7E\r\n\t]/g, " ");
      }
    } catch (err) {
      console.error(`Extraction failed for ${fileId}:`, err);
      content = `[EXTRACTION_FAILED]`;
    }

    content = content.replace(/\0/g, "");
    const encryptedContent = encryptData(content);

    this.updateJob(jobId, { progress: 50, message: "Updating database and indexing for search..." });

    const result = await pool.query(
      `UPDATE files SET content = $1, is_encrypted = $2 WHERE id = $3`,
      [encryptedContent, true, fileId]
    );

    if (result.rowCount === 0) {
      throw new Error(`File record with ID ${fileId} not found.`);
    }

    await chunkAndIndexDocument(fileId, content, userId);

    this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "File processing complete.",
      result: { fileId }
    });
  }

  private async executeDocumentAnalysis(job: Job): Promise<void> {
    const { id: jobId, payload, userId } = job;
    const { documentId, content } = payload;
    this.updateJob(jobId, { progress: 30, message: "AI agents performing legal audit..." });
    const result = await this.orchestrator.runAnalysis(documentId, content, userId);
    this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Analysis complete.",
      result
    });
  }

  private async executePrivacyScanning(job: Job): Promise<void> {
    const { id: jobId, payload, userId } = job;
    this.updateJob(jobId, { progress: 20, message: "Scanning website for privacy compliance..." });
    const result = await this.scanner.scanCookie(payload.url, userId, payload.scanDepth);
    this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Privacy scan complete.",
      result
    });
  }

  private async executeVulnerabilityScanning(job: Job): Promise<void> {
    const { id: jobId, payload, userId } = job;
    this.updateJob(jobId, { progress: 20, message: "Performing vulnerability assessment..." });
    const result = await this.scanner.scanVulnerability(payload.url, userId);
    this.updateJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Vulnerability scan complete.",
      result
    });
  }
}

export const jobQueue = new BackgroundJobQueue();
