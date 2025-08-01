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
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
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
      // Catch and re-throw quota errors with a more user-friendly message.
      if (error.message && (error.message.includes('429') || error.message.includes('QuotaFailure') || error.message.includes('resource has been exhausted'))) {
        throw new Error('ALL_KEYS_EXHAUSTED: All API keys have failed with quota errors.');
      }
      // Re-throw other errors as is.
      throw error;
    }
  }
);
