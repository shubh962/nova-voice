'use server';
/**
 * @fileOverview A text-to-speech flow using Genkit.
 *
 * - speak - A function that handles the text to speech conversion.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { SpeakInput, SpeakOutput, SpeakInputSchema, SpeakOutputSchema } from './tts-schema';
import { toWav } from '@/lib/audio';

export async function speak(input: SpeakInput): Promise<SpeakOutput> {
  return ttsFlow(input);
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: SpeakInputSchema,
    outputSchema: SpeakOutputSchema,
  },
  async (input) => {
    // Ensure that only valid, non-empty keys are used.
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
    ].filter((key): key is string => !!key);

    if (keys.length === 0) {
      throw new Error("NO_API_KEYS: No Gemini API keys are configured.");
    }
    
    for (const key of keys) {
      try {
        const model = googleAI('gemini-2.5-flash-preview-tts', { apiKey: key });
        
        const { media } = await ai.generate({
          model: model,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: input.voice || 'Algenib' },
              },
            },
          },
          prompt: input.text,
        });

        if (!media) {
          throw new Error('no media returned');
        }

        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavData = await toWav(audioBuffer);
        
        return {
          audio: 'data:audio/wav;base64,' + wavData,
        };
      } catch (error: any) {
        if (error.message && (error.message.includes('429') || error.message.includes('QuotaFailure') || error.message.includes('resource has been exhausted'))) {
          console.log(`API key ending in ...${key.slice(-4)} failed with a quota error. Trying next key.`);
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('ALL_KEYS_EXHAUSTED: All API keys have failed with quota errors.');
  }
);
