import { z } from 'zod';
import { email } from './primitives';
import { UserResponseSchema } from './user.contract';
import { RoleCodeEnum } from './roles.contract';

export const RequestOtpRequestSchema = z.object({
  email,
});
export type RequestOtpRequest = z.infer<typeof RequestOtpRequestSchema>;

export const RequestOtpResponseSchema = z.object({
  message: z.string(),
});
export type RequestOtpResponse = z.infer<typeof RequestOtpResponseSchema>;

export const VerifyOtpRequestSchema = z.object({
  email,
  code: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit code'),
});
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;

export const VerifyOtpResponseSchema = z.object({
  message: z.string(),
  user: UserResponseSchema,
});
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

export const CurrentUserResponseSchema = z.object({
  user: UserResponseSchema,
  roleCode: RoleCodeEnum,
  profileComplete: z.boolean(),
  termsAccepted: z.boolean(),
});
export type CurrentUserResponse = z.infer<typeof CurrentUserResponseSchema>;
