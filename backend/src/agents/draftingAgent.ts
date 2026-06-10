import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

export class DraftingAgent {
  async generateDraft(prompt: string): Promise<string> {
    const fullPrompt = `You are an expert Legal Draftsman. Generate a professional legal document based on this instruction: ${prompt}

Return only the document content in Markdown format. Do not include any preamble or notes.`;

    try {
      const response = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
      });
      return response.response.text();
    } catch (err) {
      console.error("DraftingAgent error:", err);
      throw err;
    }
  }
}
