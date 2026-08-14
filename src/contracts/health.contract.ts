import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().nonnegative(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
