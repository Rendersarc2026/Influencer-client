import { z } from 'zod';

export const AdminPlatformStatsSchema = z.object({
  activeAgencies: z.number().int().nonnegative(),
  activeBrands: z.number().int().nonnegative(),
  activeUsers: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  totalCampaigns: z.number().int().nonnegative(),
});

export type AdminPlatformStatsResponse = z.infer<typeof AdminPlatformStatsSchema>;
