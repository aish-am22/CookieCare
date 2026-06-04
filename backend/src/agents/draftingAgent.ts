import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey || "dummy" });

export class DraftingAgent {
  async draftDocument(inputs: any): Promise<string> {
    const { draftInput, instructions, detailLevel, jurisdiction } = inputs;
    const prompt = `You are an expert legal drafter at a top-tier global law firm.
Task: Draft a high-fidelity legal document.

[INPUT DETAILS]
Type/Context: ${draftInput}
Specific Instructions: ${instructions}
Output Depth: ${detailLevel} (Short, Standard, or Deep)
Target Jurisdiction: ${jurisdiction || 'International'}

[DRAFTING GUIDELINES]
1. Use professional, formal legal terminology.
2. Ensure the document is structured with clear, numbered Articles and Sections.
3. Include standard boilerplate provisions (Severability, Entire Agreement, Governing Law) unless otherwise specified.
4. Favor clear, unambiguous language over archaic legalese.

[FEW-SHOT EXAMPLE STRUCTURE]
# MUTUAL NON-DISCLOSURE AGREEMENT
ARTICLE 1: DEFINITIONS
1.1 "Confidential Information" means...
ARTICLE 2: OBLIGATIONS
2.1 The Receiving Party shall...

IMPORTANT: Return your response in clean, well-structured Markdown format. Use bold headers and logical bullet points. Start directly with the document title.`;

    try {
      const model = (genAI as any).getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.3, // Lower temperature for more stable drafting
        }
      });
      const response = await model.generateContent(prompt);
      return response.response.text() || "Drafting failed.";
    } catch (err) {
      console.error("DraftingAgent error:", err);
      throw err;
    }
  }
}