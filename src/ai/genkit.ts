import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

// Pick a random working key
function pickGeminiKey() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("No Gemini API keys found in environment variables.");
  }

  // Rotate keys randomly
  return keys[Math.floor(Math.random() * keys.length)]!;
}

// Init Genkit with ONE selected key
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: pickGeminiKey(), // ⭐ NOT apiKeys: []
    }),
  ],
});
