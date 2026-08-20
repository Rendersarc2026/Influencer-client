import { z } from 'zod';
import { httpUrl, safeMultilineText } from './primitives';
import { ChatTypeEnum } from './enums';

export const MessageResponseSchema = z.object({
  id: z.string().uuid(),
  chatId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string(),
  attachmentUrl: z.string().nullable(),
  editedFromId: z.string().uuid().nullable(),
  readOn: z.date().nullable(),
  isActive: z.boolean(),
  createdOn: z.date(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const CreateChatRequestSchema = z.object({
  participantId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
});
export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;

export const SendMessageRequestSchema = z.object({
  body: safeMultilineText(4000),
  attachmentUrl: httpUrl.optional(),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const EditMessageRequestSchema = z.object({
  body: safeMultilineText(4000),
});
export type EditMessageRequest = z.infer<typeof EditMessageRequestSchema>;

export const ChatResponseSchema = z.object({
  id: z.string().uuid(),
  type: ChatTypeEnum,
  campaignId: z.string().uuid().nullable(),
  campaignName: z.string().nullable().optional(),
  agencyUserId: z.string().uuid(),
  agencyName: z.string().nullable().optional(),
  agencyAvatarUrl: z.string().nullable().optional(),
  brandUserId: z.string().uuid().nullable(),
  brandName: z.string().nullable().optional(),
  brandAvatarUrl: z.string().nullable().optional(),
  influencerId: z.string().uuid().nullable(),
  influencerName: z.string().nullable().optional(),
  influencerAvatarUrl: z.string().nullable().optional(),
  lastMessageOn: z.date().nullable(),
  lastMessageSenderId: z.string().uuid().nullable(),
  unreadCount: z.number().int().nonnegative().optional(),
  isActive: z.boolean(),
  createdOn: z.date(),
  messages: z.array(MessageResponseSchema).optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
