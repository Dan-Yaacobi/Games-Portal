import { z } from 'zod';
import { SPEED_DIFFICULTIES, WORD_DIFFICULTIES } from './wubble.config.js';

export const startWubbleSchema = z.object({
  wordDifficulty: z.enum(WORD_DIFFICULTIES),
  speedDifficulty: z.enum(SPEED_DIFFICULTIES)
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
