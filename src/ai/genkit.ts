import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By default, the plugin will look for the GEMINI_API_KEY environment variable.
// We will manage multiple keys within the flow itself.
export const ai = genkit({
  plugins: [googleAI()],
});
