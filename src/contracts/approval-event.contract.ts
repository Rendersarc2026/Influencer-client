import { z } from 'zod';
import { ApprovalActionEnum } from './enums';

export const ApprovalEventResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  actorId: z.string().uuid(),
  action: ApprovalActionEnum,
  comment: z.string().nullable(),
  /** RATE_STATUS or BRAND_STATUS code, whichever category `action` concerns. */
  fromStatus: z.number().int().nullable(),
  toStatus: z.number().int().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type ApprovalEventResponse = z.infer<typeof ApprovalEventResponseSchema>;
