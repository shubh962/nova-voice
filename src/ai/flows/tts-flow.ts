
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
    // Fallback to an empty string for the default key if env vars are not set.
    const keys = [
        process.env.GEMINI_API_KEY_1 || '', 
        process.env.GEMINI_API_KEY_2 || ''
    ];

    for (const key of keys) {
      try {
        // Dynamically select the model with the specific API key for this attempt.
        // If the key is an empty string, googleAI() will use the default from process.env.GEMINI_API_KEY
        const model = googleAI('gemini-2.5-flash-preview-tts', { apiKey: key || undefined });
        
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
        
        // If successful, return the audio and exit the loop.
        return {
          audio: 'data:audio/wav;base64,' + wavData,
        };
      } catch (error: any) {
        // Check for quota-related errors to decide whether to try the next key.
        if (error.message && (error.message.includes('429') || error.message.includes('QuotaFailure') || error.message.includes('resource has been exhausted'))) {
          console.log(`API key failed with quota error. Trying next key.`);
          // Continue to the next iteration of the loop to try the next key.
          continue;
        }
        // For any other error, throw it immediately.
        throw error;
      }
    }
    
    // If the loop completes without a successful return, all keys have failed.
    throw new Error('ALL_KEYS_EXHAUSTED: All API keys have failed with quota errors.');
  }
);
