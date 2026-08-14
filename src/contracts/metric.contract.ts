import { z } from 'zod';
import { count } from './primitives';

export const MetricResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  reach: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative().nullable(),
  engagements: z.number().int().nonnegative(),
  erPercent: z.number().nonnegative(),
  recordedFor: z.date(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type MetricResponse = z.infer<typeof MetricResponseSchema>;

export const RecordMetricRequestSchema = z
  .object({
    reach: count.refine((v) => v > 0, 'Reach must be greater than 0'),
    impressions: count.optional(),
    engagements: count,
    recordedFor: z.coerce.date(),
  })
  .refine((d) => d.engagements <= d.reach, {
    message: 'Engagements cannot exceed reach',
    path: ['engagements'],
  });
export type RecordMetricRequest = z.infer<typeof RecordMetricRequestSchema>;
