import { z } from 'zod';

export const TermsResponseSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  content: z.string(),
  publishedOn: z.date(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type TermsResponse = z.infer<typeof TermsResponseSchema>;

export const AcceptTermsSchema = z.object({
  termsId: z.string().uuid(),
});
export type AcceptTermsRequest = z.infer<typeof AcceptTermsSchema>;
