import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import { z } from "zod";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

const RedlineSchema = z.object({
  proposedText: z.string(),
  comment: z.string(),
  sideBySide: z.object({
    original: z.string(),
    proposed: z.string(),
    differentialHtml: z.string()
  })
});

export class NegotiationAgent {
  async draftRedline(clauseText: string, riskType: string): Promise<z.infer<typeof RedlineSchema>> {
    const systemInstruction = `You are a Negotiation Agent. Draft a corporate redline alternative.

CRITICAL: You must return a valid JSON object matching this schema:
{
  "proposedText": "The improved legal language",
  "comment": "Strategic rationale for the change",
  "sideBySide": {
    "original": "The input clause",
    "proposed": "The improved language",
    "differentialHtml": "HTML string highlighting changes (e.g. using <del> and <ins>)"
  }
}`;

    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        config: {
          responseMimeType: "application/json",
          systemInstruction
        },
        contents: [{ parts: [{ text: `Clause: ${clauseText}\nRisk: ${riskType}` }] }]
      });
      const responseText = result.text;

      // Phase 3: Enforce strict structured output with Zod
      const parsed = JSON.parse(responseText);
      return RedlineSchema.parse(parsed);
    } catch (err) {
      console.warn("NegotiationAgent AI failed, returning fallback:", err);
      return {
        proposedText: "Alternative clause text focused on risk mitigation.",
        comment: "Balanced compromise for mutual protection.",
        sideBySide: {
          original: clauseText,
          proposed: "Alternative clause text focused on risk mitigation.",
          differentialHtml: `<div><del>${clauseText}</del> <ins>Alternative clause text focused on risk mitigation.</ins></div>`
        }
      };
    }
  }
}
