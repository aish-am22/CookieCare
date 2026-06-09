import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

export class AskLawyerAgent {
  async resolveQuery(contextChunks: any[], query: string): Promise<string> {
    const context = contextChunks.map(c => `[SOURCE: ${c.title}] (ID: ${c.file_id})\n${c.content}`).join("\n\n---\n\n");
    const prompt = `You are a brilliant AI Lawyer.
Answer the user's question precisely using the provided document context.
If the context contains relevant information, cite the source title.

[CONTEXT]
${context}

[QUERY]
${query}

IMPORTANT: Return your response in clean, well-structured Markdown format. Use headers, bullet points, and bold text for readability.`;

    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: prompt }] }]
      });
      return result.text || "I cannot answer this query right now.";
    } catch (err) {
      console.error("AskLawyerAgent error:", err);
      throw err;
    }
  }
}
