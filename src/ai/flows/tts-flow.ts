
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
      // by not providing an API key at all.
      keys.push(''); 
    }
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const model = key 
            ? googleAI('gemini-2.5-flash-preview-tts', { apiKey: key })
            : 'googleai/gemini-2.5-flash-preview-tts';
        
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
        if (error.message && (error.message.includes('429 Too Many Requests') || error.message.includes('QuotaFailure'))) {
          console.log(`API key ending with ...${key ? key.slice(-4) : 'DEFAULT'} failed with quota error. Trying next key.`);
          if (i === keys.length - 1) {
            // This was the last key, re-throw the error
            throw new Error('ALL_KEYS_EXHAUSTED');
          }
          // This key is exhausted, try the next one
          continue;
        }
        // For other errors, re-throw them
        throw error;
      }
    }
    
    // This should not be reached if there's at least one key (even empty for default)
    // but as a fallback.
    throw new Error('No API keys were available to process the request.');
  }
);
