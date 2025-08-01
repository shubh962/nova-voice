import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

function getApiKey(): string {
  const key1 = process.env.GEMINI_API_KEY_1;
  const key2 = process.env.GEMINI_API_KEY_2;
  
  const keys = [key1, key2].filter((k): k is string => !!k);
  
  if (keys.length === 0) {
    // Let googleAI plugin handle the case where no key is provided (e.g. from default env var)
    return '';
  }
  
  // Return a random key
  return keys[Math.floor(Math.random() * keys.length)];
}


export const ai = genkit({
  plugins: [googleAI({
    apiKey: getApiKey(),
  })],
  model: 'googleai/gemini-2.0-flash',
});
