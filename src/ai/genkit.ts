import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By default, the plugin will look for the GEMINI_API_KEY environment variable.
// We will manage multiple keys within the flow itself.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKeys: [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
      ].filter((k): k is string => !!k),
    }),
  ],
});
