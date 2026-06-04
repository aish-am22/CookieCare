import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

export class NegotiationAgent {
  async draftRedline(clauseText: string, riskType: string): Promise<any> {
    const systemInstruction = `You are a Negotiation Agent. Draft a corporate redline alternative.
Return JSON: { "proposedText": "...", "comment": "...", "sideBySide": { "original": "...", "proposed": "...", "differentialHtml": "..." } }`;

    try {
      const model = (genAI as any).getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
        systemInstruction
      });
      const result = await model.generateContent(`Clause: ${clauseText}\nRisk: ${riskType}`);
      return JSON.parse(result.response.text());
    } catch (err) {
      return {
        proposedText: "Alternative clause text.",
        comment: "Balanced compromise.",
        sideBySide: {
          original: clauseText,
          proposed: "Alternative clause text.",
          differentialHtml: "<div>...</div>"
        }
      };
    }
  }
}
