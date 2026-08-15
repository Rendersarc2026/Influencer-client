import { z } from 'zod';
import { money, safeMultilineText } from './primitives';
import { PaymentStatusEnum } from './enums';

export const PaymentResponseSchema = z.object({
  id: z.string().uuid(),
  mapperId: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  status: PaymentStatusEnum,
  raisedOn: z.date().nullable(),
  approvedBy: z.string().uuid().nullable(),
  approvedOn: z.date().nullable(),
  note: z.string().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const RaisePaymentRequestSchema = z.object({
  amount: money.refine((v) => v > 0, 'Amount must be greater than 0'),
  note: safeMultilineText(2000).optional(),
});
export type RaisePaymentRequest = z.infer<typeof RaisePaymentRequestSchema>;

export const PaymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().max(100).optional(),
  status: z.string().optional(),
});
export type PaymentListQuery = z.infer<typeof PaymentListQuerySchema>;
