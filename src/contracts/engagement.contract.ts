import { z } from 'zod';

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
  engagementRate: z.number(), // e.g. 3.42 for 3.42%
  source: z.string(),
  fetchedAt: z.string().or(z.date()),
  isActive: z.boolean(),
  createdOn: z.string().or(z.date()),
  updatedOn: z.string().or(z.date()),
});

export type InfluencerEngagementResponse = z.infer<typeof InfluencerEngagementResponseSchema>;
