import { pool } from "../config/database.js";
import { chunkAndIndexDocument } from "../RAG/ragService.js";
import { AgentOrchestrator } from "../agents/legalAgent.js";
import { ScannerService } from "./scannerService.js";
import pdf from "pdf-parse-fork";
import mammoth from "mammoth";
import crypto from "crypto";
import { encryptData } from "../utils/crypto.js";
import { Queue, Worker, Job as BullJob } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export const jobQueueName = "cookiecare-jobs";
export const jobQueue = new Queue(jobQueueName, { connection: redisConnection });

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

class BackgroundJobRegistry {
  private clients: Set<SseClient> = new Set();
  public orchestrator = new AgentOrchestrator();
  public scanner = new ScannerService();

  public broadcast(userId: string, job: any): void {
    const payloadStr = JSON.stringify({ event: "job_update", job });
    for (const client of this.clients) {
      if (client.userId === userId) {
        client.send(`data: ${payloadStr}\n\n`);
      }
    }
  }

  public addClient(userId: string, res: any): string {
    const id = "client_" + crypto.randomUUID();
    res.write(`data: ${JSON.stringify({ event: "ping", timestamp: new Date().toISOString() })}\n\n`);

    const client: SseClient = {
      id,
      userId,
      send: (data: string) => {
        try {
          res.write(data);
        } catch (err) {
          console.warn("[JobRegistry SSE] Failed to push data for client:", id);
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

  public async getJob(id: string): Promise<Job | null> {
    const bullJob = await BullJob.fromId(jobQueue, id);
    if (!bullJob) return null;
    return this.transformBullJob(bullJob);
  }

  public async getUserJobs(userId: string): Promise<Job[]> {
    const jobs = await jobQueue.getJobs(["active", "waiting", "completed", "failed", "delayed"]);
    return (await Promise.all(jobs.map(j => this.transformBullJob(j))))
      .filter(j => j.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async transformBullJob(bullJob: BullJob): Promise<Job> {
    const state = await bullJob.getState();
    return {
      id: bullJob.id!,
      userId: bullJob.data.userId,
      type: bullJob.data.type,
      status: state as JobStatus,
      progress: bullJob.progress as number,
      message: bullJob.data.message || "",
      payload: bullJob.data.payload,
      result: bullJob.returnvalue,
      error: bullJob.failedReason,
      createdAt: new Date(bullJob.timestamp).toISOString(),
      completedAt: bullJob.finishedOn ? new Date(bullJob.finishedOn).toISOString() : undefined,
    };
  }
}

export const jobRegistry = new BackgroundJobRegistry();

const worker = new Worker(jobQueueName, async (job: BullJob) => {
  const { type, userId, payload } = job.data;

  await job.updateProgress(5);
  job.data.message = "Acquiring secure execution container...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  try {
    switch (type) {
      case "file_processing":
        return await executeFileProcessing(job);
      case "document_analysis":
        return await executeDocumentAnalysis(job);
      case "privacy_scanning":
        return await executePrivacyScanning(job);
      case "vulnerability_scanning":
        return await executeVulnerabilityScanning(job);
      default:
        throw new Error(`Unhandled job type: ${type}`);
    }
  } catch (err: any) {
    console.error(`[Worker] Job ${job.id} failed:`, err);
    throw err;
  }
}, { connection: redisConnection, concurrency: 3 });

worker.on("completed", async (job) => {
  jobRegistry.broadcast(job.data.userId, await jobRegistry.transformBullJob(job));
});

worker.on("failed", async (job, err) => {
  if (job) {
    jobRegistry.broadcast(job.data.userId, await jobRegistry.transformBullJob(job));
  }
});

async function executeFileProcessing(job: BullJob): Promise<any> {
  const { userId, payload } = job.data;
  const { fileId, fileBufferBase64, mimeType } = payload;

  await job.updateProgress(15);
  job.data.message = "Extracting text from document...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  const buffer = Buffer.from(fileBufferBase64, "base64");
  let content = "";

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

  content = content.replace(/\0/g, "");
  const encryptedContent = encryptData(content);

  await job.updateProgress(50);
  job.data.message = "Updating database and indexing for search...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  const result = await pool.query(
    `UPDATE files SET content = $1, is_encrypted = $2 WHERE id = $3`,
    [encryptedContent, true, fileId]
  );

  if (result.rowCount === 0) throw new Error(`File record ${fileId} not found.`);

  await chunkAndIndexDocument(fileId, content, userId);

  await job.updateProgress(100);
  job.data.message = "File processing complete.";
  return { fileId };
}

async function executeDocumentAnalysis(job: BullJob): Promise<any> {
  const { userId, payload } = job.data;
  const { documentId, content } = payload;
  await job.updateProgress(30);
  job.data.message = "AI agents performing legal audit...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  const result = await jobRegistry.orchestrator.runAnalysis(documentId, content, userId);
  await job.updateProgress(100);
  job.data.message = "Analysis complete.";
  return result;
}

async function executePrivacyScanning(job: BullJob): Promise<any> {
  const { userId, payload } = job.data;
  await job.updateProgress(20);
  job.data.message = "Scanning website for privacy compliance...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  const result = await jobRegistry.scanner.scanCookie(payload.url, userId, payload.scanDepth);
  await job.updateProgress(100);
  job.data.message = "Privacy scan complete.";
  return result;
}

async function executeVulnerabilityScanning(job: BullJob): Promise<any> {
  const { userId, payload } = job.data;
  await job.updateProgress(20);
  job.data.message = "Performing vulnerability assessment...";
  jobRegistry.broadcast(userId, await jobRegistry.transformBullJob(job));

  const result = await jobRegistry.scanner.scanVulnerability(payload.url, userId);
  await job.updateProgress(100);
  job.data.message = "Vulnerability scan complete.";
  return result;
}
