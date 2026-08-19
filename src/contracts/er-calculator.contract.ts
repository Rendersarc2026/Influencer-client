import { z } from 'zod';
import { safeText } from './primitives';

/**
 * Request schema for the standalone ER Calculator.
 * Accepts an Instagram handle (with or without @/URL) and returns engagement metrics.
 */
export const CalculateERRequestSchema = z.object({
  instagramHandle: safeText(200),
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
  source: z.string(),
  fetchedAt: z.string(),
  profile: ERProfileSchema.nullable(),
  /** The exact posts the averages were computed from, newest first. */
  posts: z.array(AnalyzedPostSchema),
});
export type CalculateERResponse = z.infer<typeof CalculateERResponseSchema>;
