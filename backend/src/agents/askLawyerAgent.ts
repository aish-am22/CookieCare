import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

export class AskLawyerAgent {
  async resolveQuery(contextChunks: string[], query: string): Promise<string> {
    const context = contextChunks.length > 0
      ? contextChunks.join("\n\n")
      : "No specific document context provided.";

    const prompt = `You are a Senior AI Attorney.
Task: Answer the user's legal research query using the provided context and your internal knowledge of global corporate law.

[RESEARCH CONTEXT]
${context}

[USER QUERY]
${query}

[ADVISORY GUIDELINES]
1. Use the IRAC (Issue, Rule, Application, Conclusion) framework if the query involves a specific legal problem.
2. Be precise, authoritative, and professional.
3. If the context does not contain the answer, explicitly state that and provide advice based on general legal principles, citing relevant standard statutes where possible.
4. Use Markdown for all formatting (Headers, bold text, bullet points).

[FEW-SHOT EXAMPLE]
### ISSUE
Whether a 20% pre-deposit is mandatory for a stay of demand...
### RULE
Section 220(6) of the Income Tax Act provides discretionary power...
...

IMPORTANT: Ensure the response is high-fidelity and directly addresses the query.`;

    try {
      const model = (genAI as any).getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.2, // Low temperature for high factual accuracy
        }
      });
      const result = await model.generateContent(prompt);
      return result.response.text() || "I cannot answer this query right now.";
    } catch (err) {
      console.error("AskLawyerAgent error:", err);
      throw err;
    }
  }
}
