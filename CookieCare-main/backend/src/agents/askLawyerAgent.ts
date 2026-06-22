import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

export class AskLawyerAgent {
  async getAdvice(prompt: string, context: string): Promise<string> {
    const fullPrompt = `You are a Senior Legal Counsel. Provide professional legal advice based on the following context.
If the information is not in the context, state that you are advising based on general legal principles but recommend consulting with specific jurisdictional counsel.

[CONTEXT]
${context}

[USER QUERY]
${prompt}

IMPORTANT: Return your response in clean Markdown format.`;

    try {
      const result = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
      });
      return result.response.text() || "I cannot answer this query right now.";
    } catch (err) {
      console.error("AskLawyerAgent error:", err);
      throw err;
    }
  }
}
