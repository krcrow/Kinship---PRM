
import { GoogleGenAI } from "@google/genai";

// Initialize the client. 
// Note: In a real production build, ensure process.env.API_KEY is defined.
// Using a safe check for process to avoid ReferenceError in browser-only environments.
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// 1. Context Summary: Summarizes ONLY the Context Input (Static long-term memory)
export const generateContextSummary = async (contextInput: string, name: string): Promise<string> => {
  if (!contextInput || contextInput.trim().length === 0) {
    return "";
  }

  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`• Values personal touches and thoughtful gestures\n• Key interest in brutalist architecture and jazz\n• Action: Follow up regarding the waterfront project staffing`);
      }, 1500);
    });
  }

  try {
    const prompt = `
      You are an expert Personal Relationship Manager assistant.
      Analyze the following context notes about a professional contact named ${name}.
      
      CRITICAL RULES:
      1. Use ONLY the information provided in the "Context Notes" below. Do NOT add, invent, or hallucinate any outside facts.
      2. If the notes are empty or meaningless, return an empty string.
      3. Output STRICTLY plain text. NO Markdown.
      4. Use simple bullet points (•) for each line.
      5. Do NOT repeat the person's name or role.
      6. Summarize their personality, interests, and key long-term facts based ONLY on the input.
      
      Context Notes:
      "${contextInput}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 } // Low temperature for factual accuracy
    });

    return response.text?.trim() || "Could not generate summary.";
  } catch (error) {
    console.error("Error generating context summary:", error);
    return "Error generating summary.";
  }
};

// 2. Overview Summary: Synthesizes Context Input + Latest Interaction (Recap preferred)
export const generateOverviewSummary = async (contextInput: string, latestInteractionNote: string, latestInteractionSummary: string | undefined, name: string): Promise<string> => {
  // Logic Refinement: Prioritize the 'Recap' (summary) for the prompt if available, 
  // to keep the overview high-level. Fallback to notes if summary is missing.
  const interactionData = (latestInteractionSummary && latestInteractionSummary.trim().length > 0) 
    ? latestInteractionSummary 
    : latestInteractionNote;

  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`• Currently focused on the Q4 roadmap discussed in the last call.\n• Long-term interest in sustainability projects remains relevant.\n• Action: Send the updated proposal by Friday.`);
      }, 1500);
    });
  }

  try {
    const prompt = `
      Create a "Master Connection Summary" for ${name}.
      
      Input Data:
      1. Long-term Context: "${contextInput}"
      2. Most Recent Interaction (Recap): "${interactionData}"

      CRITICAL RULES:
      1. Your goal is to SYNTHESIZE the long-term context with the latest updates.
      2. Use ONLY the Input Data provided. Do NOT invent facts or hallucinate details not present in the text.
      3. Output STRICTLY plain text. NO Markdown.
      4. Use simple bullet points (•).
      5. The FIRST bullet MUST capture the core status/sentiment of the Recent Interaction.
      6. Subsequent bullets should merge relevant long-term context that is still applicable.
      7. Keep it concise (3-4 bullets max).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating overview summary:", error);
    return "";
  }
};

// 3. Interaction Summary: Comprehensive 1-2 sentences
export const generateInteractionSummary = async (notes: string): Promise<string> => {
  if (!notes) return "";
  
  if (!ai) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Fallback simulation: Just take the first sentence or truncate. 
        // No meta text like "(Simulated)" allowed.
        const summary = notes.length > 80 ? notes.substring(0, 80) + "..." : notes;
        resolve(summary);
      }, 800);
    });
  }

  try {
    const prompt = `
      Summarize the following interaction notes into strictly ONE or TWO brief sentences.
      Capture the main outcome.
      Do NOT use bullet points. Plain text only.
      
      Notes: "${notes}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    return notes.substring(0, 80) + "...";
  }
};
