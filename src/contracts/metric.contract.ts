import { z } from 'zod';
import { count, httpUrl, httpUrls, safeText } from './primitives';

/**
 * The per-post engagement breakdown behind a post-evaluation record.
 *
 * An assignment is delivered as several posts and each one performs
 * differently, so likes, comments, shares and saves are captured per post. The
 * parent metric carries the sums, which is what every report and roll-up reads.
 */
export const MetricPostSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().nonnegative(),
  postUrl: z.string(),
  likes: z.number().int().nonnegative().nullable(),
  comments: z.number().int().nonnegative().nullable(),
  shares: z.number().int().nonnegative().nullable(),
  saves: z.number().int().nonnegative().nullable(),
});
export type MetricPost = z.infer<typeof MetricPostSchema>;

export const MetricResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  reach: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative().nullable(),
  engagements: z.number().int().nonnegative(),
  erPercent: z.number().nonnegative(),
  watchTime: z.string().nullable().optional(),
  totalViews: z.number().int().nonnegative().nullable().optional(),
  likes: z.number().int().nonnegative().nullable().optional(),
  comments: z.number().int().nonnegative().nullable().optional(),
  shares: z.number().int().nonnegative().nullable().optional(),
  saves: z.number().int().nonnegative().nullable().optional(),
  skipRate: z.number().nonnegative().nullable().optional(),
  liveLink: z.string().nullable().optional(),
  posts: z.array(MetricPostSchema).optional(),
  postEvalCpv: z.number().nonnegative().nullable().optional(),
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

/** Maximum published posts one post-evaluation record may cover. */
export const MAX_METRIC_POSTS = 10;

/** One published post's engagement numbers, as entered by the agency. */
export const RecordMetricPostSchema = z.object({
  postUrl: httpUrl,
  likes: count.optional(),
  comments: count.optional(),
  shares: count.optional(),
  saves: count.optional(),
});
export type RecordMetricPost = z.infer<typeof RecordMetricPostSchema>;

/**
 * `engagements` and the four engagement components are derived server side from
 * `posts` whenever posts are supplied, so a caller cannot submit a summary that
 * disagrees with the breakdown it came from. They stay accepted for callers that
 * record a single flat total with no per-post breakdown.
 */
export const RecordMetricRequestSchema = z
  .object({
    reach: count.optional(),
    impressions: count.optional(),
    engagements: count.optional(),
    watchTime: safeText(100).optional(),
    totalViews: count.optional(),
    likes: count.optional(),
    comments: count.optional(),
    shares: count.optional(),
    saves: count.optional(),
    skipRate: z.number().min(0).max(100).optional(),
    liveLink: httpUrls.optional(),
    posts: z.array(RecordMetricPostSchema).max(MAX_METRIC_POSTS).optional(),
    recordedFor: z.coerce.date(),
  })
  .refine(
    (d) =>
      (d.posts && d.posts.length > 0) ||
      d.engagements !== undefined ||
      d.reach !== undefined ||
      d.totalViews !== undefined ||
      d.impressions !== undefined,
    {
      message: 'Record at least one post, or an overall metric count',
      path: ['posts'],
    },
  )
  .refine(
    (d) =>
      d.reach === undefined ||
      d.reach === 0 ||
      d.engagements === undefined ||
      d.engagements <= d.reach,
    {
      message: 'Engagements cannot exceed reach',
      path: ['engagements'],
    },
  )
  .refine(
    (d) =>
      d.reach === undefined ||
      d.reach === 0 ||
      metricPostEngagements(d.posts) <= d.reach,
    {
      message: 'Engagements across all posts cannot exceed reach',
      path: ['posts'],
    },
  );
export type RecordMetricRequest = z.infer<typeof RecordMetricRequestSchema>;

/** Sums one post's likes, comments, shares and saves into its engagement count. */
export function metricPostEngagement(post: {
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  saves?: number | null;
}): number {
  return (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0) + (post.saves ?? 0);
}

/** Total engagements across every recorded post. */
export function metricPostEngagements(
  posts:
    | Array<{
        likes?: number | null;
        comments?: number | null;
        shares?: number | null;
        saves?: number | null;
      }>
    | undefined,
): number {
  return (posts ?? []).reduce((sum, post) => sum + metricPostEngagement(post), 0);
}
