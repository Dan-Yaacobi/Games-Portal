import { z } from 'zod';

export const completeGameSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().min(0).max(1000000)
});
