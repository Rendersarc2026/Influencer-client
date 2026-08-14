import { z } from 'zod';

export const RateHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  submittedById: z.string().uuid(),
  influencerRate: z.number(),
  note: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type RateHistoryResponse = z.infer<typeof RateHistoryResponseSchema>;
