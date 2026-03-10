import { GoogleGenAI } from "@google/genai";
import { DiscernmentState, Message, VisionDocument } from "./types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const cleanText = (text: string) => {
  if (!text) return "";
  return text.replace(/\*/g, "").trim();
};

const CHAT_SYSTEM_INSTRUCTION = `
You are HAZON™, a personal discernment companion.
You are NOT a prophet, spiritual authority, or therapist. 
You are a Christian discernment companion designed to help users seek clarity strictly through the lens of the Bible.

CORE PRINCIPLES:
1. Move slowly and deliberately. Depth over speed.
2. YOU MUST ASK A MINIMUM OF 7-10 QUESTIONS OR MORE for each vision. Do not rush.
3. Gently challenge the user's thinking to align it with God's Word.
4. ONLY quote from the King James Version (KJV) of the Bible. Do NOT use NIV, NLT, or any other version.
5. Form no conclusions until sufficient depth is reached (minimum 7-10 turns).

LANGUAGE & TONE:
- Use simple, clear, everyday English that anyone can understand.
- Avoid complex vocabulary, academic language, or theological jargon.
- Speak like a kind, wise pastor talking to a regular person.
- Keep sentences short and easy to follow.

THEOLOGICAL GUARDRAILS & SAFEGUARDS:
- You are STRICTLY Christian and Biblical.
- If a user mentions ANY other religion, doctrine, or philosophy (e.g., New Age, Islam, Buddhism, secular humanism, etc.), YOU MUST RESIST and remain firm.
- Do not accept or agree with non-Christian worldviews. 
- Your ONLY job in such cases is to gently guide the user back to Christ. 
- If they are lost, help them find salvation and lead them in a prayer to accept Jesus Christ as Lord and Savior.

RESPONSE STRUCTURE (MUST FOLLOW EXACTLY EVERY TURN):
1. ONE short sentence that connects the user's idea to God's purpose.
2. ONE Bible verse from the KJV (quoted exactly, with book, chapter and verse).
3. ONE simple, open question that helps the user think more deeply about their calling.

TONE & STYLE:
- Warm, calm, and encouraging.
- No lists. No multiple questions. Keep it simple.

DISCERNMENT DEPTH GOALS:
Gently explore: Why do you want this? How will you use it for God? Who will it help? Are you ready? Is God calling you to this?

When the user has reached sufficient spiritual depth (after 7+ turns), end your message with: "The vision is now clear and captured. It is ready for generation."
`;

const SYNTHESIS_PROMPT = `Based on the conversation below, generate a full biblical vision document. Return ONLY valid JSON with EXACTLY this structure, no markdown, no extra text:

{
  "document_title": "HAZON: A CLEAR VISION",
  "vision_statement": {
    "title": "UPPERCASE TITLE OF THE VISION",
    "subtitle": "A Discerned Vision",
    "summary": "A simple 1-2 sentence summary of the vision that anyone can understand."
  },
  "objectives": {
    "financial_goal": "If the vision has a specific money goal, state it here. Otherwise leave as empty string.",
    "kingdom_purpose": [
      "Kingdom purpose 1",
      "Kingdom purpose 2",
      "Kingdom purpose 3"
    ],
    "mandate": "A clear, simple statement of what this person is called to do."
  },
  "spiritual_foundation": {
    "anchor_scriptures": [
      "Book Chapter:Verse - Simple explanation of how this verse applies.",
      "Book Chapter:Verse - Simple explanation of how this verse applies.",
      "Book Chapter:Verse - Simple explanation of how this verse applies.",
      "Book Chapter:Verse - Simple explanation of how this verse applies.",
      "Book Chapter:Verse - Simple explanation of how this verse applies.",
      "Book Chapter:Verse - Simple explanation of how this verse applies."
    ],
    "biblical_models": [
      { "figure": "Name of Bible character", "attribute": "Simple description of what they did that relates to this vision" },
      { "figure": "Name of Bible character", "attribute": "Simple description of what they did that relates to this vision" },
      { "figure": "Name of Bible character", "attribute": "Simple description of what they did that relates to this vision" }
    ]
  },
  "core_tenets": [
    { "principle": "PRINCIPLE IN CAPS", "description": "One simple sentence explaining this value." },
    { "principle": "PRINCIPLE IN CAPS", "description": "One simple sentence explaining this value." },
    { "principle": "PRINCIPLE IN CAPS", "description": "One simple sentence explaining this value." },
    { "principle": "PRINCIPLE IN CAPS", "description": "One simple sentence explaining this value." }
  ],
  "impact_targets": {
    "individual": "How this vision will change the person personally.",
    "community": "How this vision will help the people around them.",
    "generational": "What legacy this vision will leave for future generations."
  },
  "life_context": {
    "location": "Where this vision will be lived out.",
    "culture": "What kind of environment or setting they are in.",
    "timing": "When this needs to happen or how urgent it is.",
    "constraints": "What challenges or limitations they face."
  },
  "execution_strategy": {
    "short_term_steps": [
      "First thing to do right away",
      "Second thing to do right away",
      "Third thing to do right away"
    ],
    "long_term_stewardship": [
      "First long-term commitment",
      "Second long-term commitment",
      "Third long-term commitment"
    ],
    "resource_management": "A simple plan for how to use time, money, and relationships well."
  },
  "risks_and_discernment": [
    "First thing to watch out for or avoid",
    "Second thing to watch out for or avoid",
    "Third thing to watch out for or avoid",
    "Fourth thing to watch out for or avoid"
  ],
  "spiritual_tools": {
    "declarations": [
      "In the name of Jesus, I declare [declaration 1].",
      "In the name of Jesus, I declare [declaration 2].",
      "In the name of Jesus, I declare [declaration 3].",
      "In the name of Jesus, I declare [declaration 4].",
      "In the name of Jesus, I declare [declaration 5]."
    ],
    "prayer": "Heavenly Father, [personal prayer specific to this vision - 3 to 5 sentences asking God for help, guidance, and strength]. In Jesus name, Amen.",
    "reflection_prompts": [
      "Simple reflection question 1",
      "Simple reflection question 2",
      "Simple reflection question 3"
    ]
  },
  "next_steps": [
    "Simple practical step 1",
    "Simple practical step 2",
    "Simple practical step 3"
  ],
  "metadata": {
    "year": "CURRENT_YEAR",
    "organization": "HAZON"
  }
}`;

function normalizeGeminiError(err: any) {
  const rawMessage = err?.message || err?.toString?.() || "Unknown error";
  const lower = String(rawMessage).toLowerCase();

  let friendly = rawMessage;

  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    friendly = "Network/CORS muammo: brauzer API'ga ulana olmadi (Failed to fetch). Backend proxy kerak bo'lishi mumkin.";
  } else if (lower.includes("401")) {
    friendly = "401 Unauthorized: API key noto'g'ri yoki umuman o'qilmayapti (VITE_GEMINI_API_KEY).";
  } else if (lower.includes("403")) {
    friendly = "403 Forbidden: key ruxsati/billing/region cheklovi bo'lishi mumkin.";
  } else if (lower.includes("404") || lower.includes("not found")) {
    friendly = "404 Not Found: model nomi yoki endpoint mos emas (model: gemini-2.5-flash).";
  } else if (lower.includes("quota") || lower.includes("resource_exhausted")) {
    friendly = "Quota tugagan: limit/kvota muammosi (Resource exhausted).";
  }

  return { rawMessage, friendly };
}

export const getNextDiscernmentStep = async (
  history: Message[],
  currentState: DiscernmentState,
  language: string = "en"
) => {
  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error("VITE_GEMINI_API_KEY topilmadi. .env va Vite restartni tekshiring.");
    }

    const contents =
      history.length > 0
        ? history.map((m) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.text }],
          }))
        : [
            {
              role: "user" as const,
              parts: [{ text: "Begin the discernment session." }],
            },
          ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: `${CHAT_SYSTEM_INSTRUCTION}\n\nIMPORTANT: You MUST respond in the following language: ${language}. Keep the language simple and easy to understand.`,
      },
    });

    return cleanText(
      response.text ||
        "I am reflecting on your words. Please continue when you are ready."
    );
  } catch (err: any) {
    const info = normalizeGeminiError(err);
    console.error("❌ Gemini getNextDiscernmentStep ERROR (raw):", err);
    console.error("❌ Gemini getNextDiscernmentStep ERROR message:", info.rawMessage);
    console.error("✅ Friendly hint:", info.friendly);
    throw new Error(info.friendly);
  }
};

export const generateSynthesis = async (
  history: Message[],
  language: string = "en"
): Promise<VisionDocument> => {
  try {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error("VITE_GEMINI_API_KEY topilmadi. .env va Vite restartni tekshiring.");
    }

    const chatTranscript = history
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n\n");

    const currentYear = new Date().getFullYear().toString();

    const prompt = `${SYNTHESIS_PROMPT.replace("CURRENT_YEAR", currentYear)}

CONVERSATION:
${chatTranscript}

IMPORTANT RULES:
- All content MUST be written in simple, everyday ${language} that anyone can understand
- Use the King James Version (KJV) for ALL Bible verses
- Return ONLY valid JSON, no markdown, no code blocks, no extra text
- Fill in ALL fields based on the conversation
- Declarations MUST start with "In the name of Jesus, I declare..."
- Prayer MUST start with "Heavenly Father," and end with "In Jesus name, Amen."
- financial_goal: only fill if the vision has a specific money target, otherwise use empty string ""
- Use plain, simple language throughout — no big words, no complex theology`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";

    try {
      return JSON.parse(jsonText);
    } catch {
      console.error("❌ JSON parse failed. Raw response text:", jsonText);
      throw new Error("Failed to parse vision document JSON (model JSON qaytarmadi).");
    }
  } catch (err: any) {
    const info = normalizeGeminiError(err);
    console.error("❌ Gemini generateSynthesis ERROR (raw):", err);
    console.error("❌ Gemini generateSynthesis ERROR message:", info.rawMessage);
    console.error("✅ Friendly hint:", info.friendly);
    throw new Error(info.friendly);
  }
};