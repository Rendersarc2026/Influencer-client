import { z } from 'zod';
import { ApprovalActionEnum } from './enums';

export const ApprovalEventResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  actorId: z.string().uuid(),
  action: ApprovalActionEnum,
  comment: z.string().nullable(),
  fromStatus: z.string().nullable(),
  toStatus: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type ApprovalEventResponse = z.infer<typeof ApprovalEventResponseSchema>;
