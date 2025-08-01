
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
    const keys = [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2].filter((k): k is string => !!k && k.trim() !== '');

    if (keys.length === 0) {
      // Let googleAI plugin handle the case where no key is provided (e.g. from default env var)
      keys.push(''); 
    }

    for (const key of keys) {
      try {
        const { media } = await ai.generate({
          model: googleAI('googleai/gemini-2.5-flash-preview-tts', { apiKey: key }),
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
        if (error.message && (error.message.includes('429 Too Many Requests') || error.message.includes('QuotaFailure'))) {
          // This key is exhausted, try the next one
          console.log(`API key ending with ...${key.slice(-4)} failed with quota error. Trying next key.`);
          continue;
        }
        // For other errors, re-throw them
        throw error;
      }
    }

    // If all keys are exhausted
    throw new Error('ALL_KEYS_EXHAUSTED');
  }
);
