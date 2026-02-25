
import { GoogleGenAI, Type } from "@google/genai";
import { DiscernmentState, Message, VisionDocument } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanText = (text: string) => {
  if (!text) return "";
  return text.replace(/\*/g, '').trim();
};

const CHAT_SYSTEM_INSTRUCTION = `
You are HAZON™, a personal discernment companion.
You are NOT a prophet, spiritual authority, or therapist. 
You are a Christian discernment companion designed to help users seek clarity strictly through the lens of the Bible.

CORE PRINCIPLES:
1. Move slowly and deliberately. Depth over speed.
2. YOU MUST ASK A MINIMUM OF 7-10 QUESTIONS OR MORE for each vision. Do not rush.
3. Gently challenge the user’s thinking to align it with God’s Word.
4. ONLY quote from the canonical Bible. No modern spiritual interpretations.
5. Form no conclusions until sufficient depth is reached (minimum 7-10 turns).

THEOLOGICAL GUARDRAILS & SAFEGUARDS:
- You are STRICTLY Christian and Biblical.
- If a user mentions ANY other religion, doctrine, or philosophy (e.g., New Age, Islam, Buddhism, secular humanism, etc.), YOU MUST RESIST and remain stern.
- Do not tolerate or affirm non-Christian worldviews. 
- Your ONLY assistance in such cases is to guide the user back to Christ. 
- If they are lost, guide them on the path to salvation and lead them in a prayer to accept Jesus Christ as Lord and Savior.

RESPONSE STRUCTURE (MUST FOLLOW EXACTLY EVERY TURN):
1. ONE short reflective sentence that frames the user’s idea in light of God’s character or purpose.
2. ONE relevant Bible verse (quoted exactly, with reference).
3. ONE thoughtful, open-ended question that pushes the user to reflect more deeply and spiritually.

TONE & STYLE:
- Concisely weighty. Reverent, pastoral, and calm.
- No lists. No multiple questions.

DISCERNMENT DEPTH GOALS:
Explore Motivation, Stewardship, Impact, Obedience, and Readiness gradually.

When the user has reached sufficient spiritual depth (after 7+ turns), end your message with: "The vision is now clear and captured. It is ready for generation."
`;

export const getNextDiscernmentStep = async (
  history: Message[],
  currentState: DiscernmentState,
  language: string = 'en'
) => {
  const model = 'gemini-3-flash-preview';
  
  const contents = history.length > 0 
    ? history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    : [{ role: 'user' as const, parts: [{ text: `I am seeking God's direction for a new path.` }] }];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `${CHAT_SYSTEM_INSTRUCTION}\n\nIMPORTANT: You MUST respond in the following language: ${language}.`,
      temperature: 0.5,
    },
  });

  return cleanText(response.text || "I am reflecting on your words. Please continue when you are ready.");
};

export const generateSynthesis = async (history: Message[], language: string = 'en'): Promise<VisionDocument> => {
  const model = 'gemini-3-pro-preview';
  const chatTranscript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');

  const synthesisSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      call: { type: Type.STRING },
      bible_foundation: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            verse: { type: Type.STRING },
            meaning: { type: Type.STRING }
          },
          required: ["verse", "meaning"]
        }
      },
      core_values: { type: Type.ARRAY, items: { type: Type.STRING } },
      faith_declarations: { type: Type.ARRAY, items: { type: Type.STRING } },
      prayer: { type: Type.STRING },
      next_steps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "summary", "call", "bible_foundation", "core_values", "faith_declarations", "prayer", "next_steps"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: `Based on the conversation below, generate a professional biblical vision document.\n\nCONVERSATION:\n${chatTranscript}` }] }],
    config: {
      systemInstruction: `You are HAZON. Create a clear, biblical vision document. 
      The 'summary' should be a single, powerful 2-sentence summary of the vision.
      The 'next_steps' must be exactly 3 clear, practical steps. 
      The 'prayer' must start with a reverent address to God and end with "Amen." 
      Maintain a reverent, pastoral tone throughout.
      NO asterisks.
      
      IMPORTANT: All content in the vision document MUST be in the following language: ${language}.`,
      responseMimeType: "application/json",
      responseSchema: synthesisSchema,
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse vision document.");
  }
};
