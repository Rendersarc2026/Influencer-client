import { z } from 'zod';
import { httpUrl, safeText } from './primitives';

export const UploadFolderEnum = z.enum(['avatars', 'chat', 'campaigns', 'media', 'general']);
export type UploadFolder = z.infer<typeof UploadFolderEnum>;

export const UploadResponseSchema = z.object({
  url: httpUrl,
  key: safeText(512),
  bucket: safeText(128),
  mimeType: safeText(128),
  size: z.number().int().nonnegative(),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const UploadAvatarResponseSchema = z.object({
  message: z.string(),
  avatarUrl: httpUrl,
  key: safeText(512).optional(),
});
export type UploadAvatarResponse = z.infer<typeof UploadAvatarResponseSchema>;
