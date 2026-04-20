import { z } from 'zod';
import { SPEED_DIFFICULTIES, WORD_DIFFICULTIES, WUBBLE_DURATION_OPTIONS } from './wubble.config.js';

export const startWubbleSchema = z.object({
  wordDifficulty: z.enum(WORD_DIFFICULTIES),
  speedDifficulty: z.enum(SPEED_DIFFICULTIES),
  durationSeconds: z.number().int().refine((value) => WUBBLE_DURATION_OPTIONS.includes(value), {
    message: 'Duration must be one of the supported options'
  })
});

export const submitWubbleSchema = z.object({
  platformSessionId: z.string().uuid(),
  wubbleSessionId: z.string().uuid(),
  eventLog: z
    .array(
      z.object({
        type: z.literal('click'),
        spawnId: z.string().min(1),
        timestampMs: z.number().int()
      })
    )
    .max(2500)
});
