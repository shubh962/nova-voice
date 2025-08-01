/**
 * @fileOverview Schemas and types for the text-to-speech flow.
 *
 * - SpeakInput - The input type for the speak function.
 * - SpeakOutput - The return type for the speak function.
 * - SpeakInputSchema - The Zod schema for the input.
 * - SpeakOutputSchema - The Zod schema for the output.
 */
import { z } from 'zod';

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
