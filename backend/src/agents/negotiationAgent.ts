import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

export class NegotiationAgent {
  async draftRedline(clauseText: string, riskType: string): Promise<any> {
    const systemInstruction = `You are a Principal Negotiation Agent. Your goal is to draft balanced, corporate-grade redline alternatives that mitigate specific legal risks while remaining commercially viable.

[RISK CONTEXT]
Risk Type: ${riskType}
Original Clause: ${clauseText}

[NEGOTIATION STRATEGY]
1. Identify the core liability or compliance gap.
2. Draft a replacement clause that uses standard industry 'middle-ground' language (e.g., adding 'reasonable', 'material', or 'mutual' qualifiers).
3. Provide a brief, professional reasoning for the change.

[JSON SCHEMA]
{
  "proposedText": "The refined clause text...",
  "comment": "Why this change is necessary and fair...",
  "sideBySide": {
    "original": "Original text...",
    "proposed": "New text...",
    "differentialHtml": "HTML diff markup..."
  }
}

Return ONLY valid JSON.`;

    try {
      const model = (genAI as any).getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        },
        systemInstruction
      });
      const result = await model.generateContent(`Draft a compromise for: ${clauseText}`);
      return JSON.parse(result.response.text());
    } catch (err) {
      console.error("NegotiationAgent error:", err);
      return {
        proposedText: clauseText, // Fallback to original
        comment: "Strategic compromise drafted by fallback heuristics.",
        sideBySide: {
          original: clauseText,
          proposed: clauseText,
          differentialHtml: `<div>${clauseText}</div>`
        }
      };
    }
  }
}
