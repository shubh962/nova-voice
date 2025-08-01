
'use server';
/**
 * @fileOverview A text-to-speech flow using Genkit.
 *
 * - speak - A function that handles the text to speech conversion.
 * - SpeakInput - The input type for the speak function.
 * - SpeakOutput - The return type for the speak function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

export const SpeakInputSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
  lang: z.string().optional(),
});
export type SpeakInput = z.infer<typeof SpeakInputSchema>;

export const SpeakOutputSchema = z.object({
  audio: z.string().describe("The generated audio as a base64-encoded data URI."),
});
export type SpeakOutput = z.infer<typeof SpeakOutputSchema>;

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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
            // Hindi voices: Algenib, Achernar
            // English (India) voices: Shaula, Gemma
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.lang === 'hi-IN' ? 'Algenib' : 'Shaula' },
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
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
