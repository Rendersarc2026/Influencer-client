import { z } from 'zod';
import { safeText } from './primitives';

/**
 * Request schema for the standalone ER Calculator.
 * Accepts an Instagram handle (with or without @/URL) and returns engagement metrics.
 */
export const CalculateERRequestSchema = z.object({
  instagramHandle: safeText(200),
  /** Skip the stored 24h copy and read Instagram live. */
  forceRefresh: z.boolean().optional(),
});
export type CalculateERRequest = z.infer<typeof CalculateERRequestSchema>;

export const AnalyzedPostSchema = z.object({
  shortcode: z.string().nullable(),
  permalink: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  caption: z.string().nullable(),
  mediaKind: z.enum(['REEL', 'VIDEO', 'CAROUSEL', 'IMAGE']),
  takenAt: z.string(),
  likes: z.number(),
  comments: z.number(),
  views: z.number().nullable(),
  /** This single post's (likes + comments) / followers * 100. */
  engagementRate: z.number(),
});
export type AnalyzedPost = z.infer<typeof AnalyzedPostSchema>;

export const ERProfileSchema = z.object({
  fullName: z.string().nullable(),
  profilePicUrl: z.string().nullable(),
  biography: z.string().nullable(),
  isVerified: z.boolean(),
  isPrivate: z.boolean(),
  totalPosts: z.number().nullable(),
});
export type ERProfile = z.infer<typeof ERProfileSchema>;

export const CalculateERResponseSchema = z.object({
  instagramHandle: z.string(),
  followersCount: z.number().nullable(),
  followingCount: z.number().nullable(),
  postsCount: z.number().nullable(),
  avgLikes: z.number().nullable(),
  avgComments: z.number().nullable(),
  avgViews: z.number().nullable(),
  engagementRate: z.number(),
  /**
   * The creator hides like counts, so engagementRate is comments-only and
   * understates reality. Not comparable with other creators' rates.
   */
  likesHidden: z.boolean(),
  source: z.string(),
  fetchedAt: z.string(),
  profile: ERProfileSchema.nullable(),
  /** The exact posts the averages were computed from, newest first. */
  posts: z.array(AnalyzedPostSchema),
});
export type CalculateERResponse = z.infer<typeof CalculateERResponseSchema>;

/**
 * Request schema for assigning calculated engagement rate & metrics to an influencer.
 */
export const AssignERToInfluencerRequestSchema = z.object({
  influencerId: z.string().uuid().optional(),
  engagementRate: z.number().min(0).max(1000),
  followersCount: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  followingCount: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  postsCount: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  avgLikes: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  avgComments: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  avgViews: z.number().int().nonnegative().max(2_147_483_647).nullable().optional(),
  instagramHandle: safeText(200).nullable().optional(),
  commercialFee: z.number().finite().nonnegative().max(9_999_999_999).nullable().optional(),
  campaignMapperId: z.string().uuid().nullable().optional(),
  source: safeText(50).optional(),
  rawResponse: z.unknown().optional(),
});
export type AssignERToInfluencerRequest = z.infer<typeof AssignERToInfluencerRequestSchema>;

export const InfluencerEngagementResponseSchema = z.object({
  id: z.string().uuid(),
  influencerId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  instagramHandle: z.string().nullable().optional(),
  followersCount: z.number().nullable().optional(),
  followingCount: z.number().nullable().optional(),
  postsCount: z.number().nullable().optional(),
  avgLikes: z.number().nullable().optional(),
  avgComments: z.number().nullable().optional(),
  avgViews: z.number().nullable().optional(),
  engagementRate: z.number(),
  source: z.string(),
  rawResponse: z.unknown().optional(),
  fetchedAt: z.date().or(z.string()),
  isActive: z.boolean(),
  createdOn: z.date().or(z.string()),
  updatedOn: z.date().or(z.string()).optional(),
});
export type InfluencerEngagementResponse = z.infer<typeof InfluencerEngagementResponseSchema>;

export const AssignERResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  engagement: InfluencerEngagementResponseSchema,
  influencer: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      followers: z.number().nullable().optional(),
      instagram: z.string().nullable().optional(),
      avgCommercialMin: z.number().nullable().optional(),
      avgCommercialMax: z.number().nullable().optional(),
    })
    .optional(),
  mapper: z
    .object({
      id: z.string().uuid(),
      preEvalEr: z.number().nullable().optional(),
      committedViews: z.number().nullable().optional(),
    })
    .optional(),
});
export type AssignERResponse = z.infer<typeof AssignERResponseSchema>;

