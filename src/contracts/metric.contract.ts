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

/**
 * Query for the batch campaign report endpoint: `?ids=uuid,uuid,uuid`.
 *
 * The dashboard needs aggregates for every campaign on the page at once. Asking
 * for them one request at a time turned a single screen into N round trips, so
 * the ids arrive together and the report is computed in one pass. The cap keeps
 * a caller from asking for an unbounded aggregate scan.
 */
export const CampaignReportBatchQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((raw) =>
      raw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().uuid()).min(1).max(100)),
});
export type CampaignReportBatchQuery = z.infer<typeof CampaignReportBatchQuerySchema>;

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
