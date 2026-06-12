import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index.js";

const genAI = new GoogleGenerativeAI(config.geminiApiKey || "dummy");

export class NegotiationAgent {
  async negotiate(documentContent: string, playbooks: string[], instructions: string): Promise<string> {
    const playbookText = playbooks.join("\n\n---\n\n");
    const systemInstruction = `You are an expert Legal Counsel specializing in contract negotiation.
Your goal is to suggest redlines and improvements for the provided document based on the company's playbooks and specific user instructions.
Return the output in Markdown format with a summary of changes and the proposed redlines.`;

    const prompt = `[DOCUMENT CONTENT]
${documentContent}

[NEGOTIATION PLAYBOOKS]
${playbookText}

[USER INSTRUCTIONS]
${instructions}

Provide detailed negotiation advice and specific clause redlines.`;

    try {
      const result = await genAI.getGenerativeModel({ model: "gemini-2.0-flash" }).generateContent({
        generationConfig: {
           candidateCount: 1
        },
        systemInstruction,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      return result.response.text();
    } catch (err) {
      console.error("NegotiationAgent error:", err);
      throw err;
    }
  }

  async draftRedline(documentContent: string, playbooks: string[], instructions: string) {
      return await this.negotiate(documentContent, playbooks, instructions);
  }
}
