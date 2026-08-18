import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  ChatResponse,
  CreateChatRequest,
  MessageResponse,
  SendMessageRequest,
  EditMessageRequest,
} from '@contracts';
import { UseChatsOptions } from '@types';

// Hook to detect window focus state for dynamic polling intervals
export function useWindowFocus(): boolean {
  const [isFocused, setIsFocused] = useState(
    typeof document !== 'undefined' ? document.hasFocus() : true,
  );

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isFocused;
}

// -------------------------------------------------------------
// 1. Conversation List Query (polls every 1.5s when focused for instant incoming detection)
// -------------------------------------------------------------

export function useChats(options?: UseChatsOptions) {
  const isFocused = useWindowFocus();

  return useQuery<ChatResponse[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await apiClient.get<ChatResponse[]>('/chats');
      return response.data;
    },
    refetchInterval: isFocused ? 1500 : 4000,
    enabled: options?.enabled ?? true,
  });
}

// -------------------------------------------------------------
// 2. Chat Messages Query (polls 1s when focused, 3s when blurred)
// -------------------------------------------------------------

export function useChatMessages(chatId: string | undefined) {
  const isFocused = useWindowFocus();

  return useQuery<MessageResponse[]>({
    queryKey: ['chats', chatId, 'messages'],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await apiClient.get<MessageResponse[]>(`/chats/${chatId}/messages`);
      return response.data;
    },
    enabled: Boolean(chatId),
    refetchInterval: isFocused ? 1000 : 3000,
  });
}

// -------------------------------------------------------------
// 3. Create or Find Chat
// -------------------------------------------------------------

export function useCreateOrFindChat() {
  const queryClient = useQueryClient();
  return useMutation<ChatResponse, Error, CreateChatRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ChatResponse>('/chats', data);
      return response.data;
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData<ChatResponse[]>(['chats'], (old = []) => {
        const exists = old.some((c) => c.id === newChat.id);
        if (exists) return old.map((c) => (c.id === newChat.id ? newChat : c));
        return [newChat, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// -------------------------------------------------------------
// 4. Send Message (with optimistic append and rollback)
// -------------------------------------------------------------

export function useSendMessage(chatId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();

  return useMutation<
    MessageResponse,
    Error,
    SendMessageRequest,
    { previousMessages?: MessageResponse[] }
  >({
    mutationFn: async (data) => {
      if (!chatId) throw new Error('No active conversation selected.');
      const response = await apiClient.post<MessageResponse>(`/chats/${chatId}/messages`, data);
      return response.data;
    },
    onMutate: async (newMessage) => {
      if (!chatId) return {};

      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['chats', chatId, 'messages'] });

      // Snapshot previous messages for rollback
      const previousMessages = queryClient.getQueryData<MessageResponse[]>([
        'chats',
        chatId,
        'messages',
      ]);

      // Optimistically append new message
      if (previousMessages) {
        const optimisticMsg: MessageResponse = {
          id: `temp-${Date.now()}`,
          chatId,
          senderId: currentUserId || 'current-user',
          body: newMessage.body,
          attachmentUrl: newMessage.attachmentUrl || null,
          editedFromId: null,
          readOn: null,
          isActive: true,
          createdOn: new Date(),
        };

        queryClient.setQueryData<MessageResponse[]>(
          ['chats', chatId, 'messages'],
          [...previousMessages, optimisticMsg],
        );
      }

      return { previousMessages };
    },
    onError: (_err, _newMessage, context) => {
      // Rollback to previous state on error
      if (chatId && context?.previousMessages) {
        queryClient.setQueryData(['chats', chatId, 'messages'], context.previousMessages);
      }
    },
    onSettled: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['chats', chatId, 'messages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// -------------------------------------------------------------
// 5. Edit Message (PATCH /messages/:id)
// -------------------------------------------------------------

export function useEditMessage(chatId?: string) {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, { messageId: string; data: EditMessageRequest }>({
    mutationFn: async ({ messageId, data }) => {
      const response = await apiClient.patch<MessageResponse>(`/messages/${messageId}`, data);
      return response.data;
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['chats', chatId, 'messages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// -------------------------------------------------------------
// 6. Delete Message (DELETE /messages/:id)
// -------------------------------------------------------------

export function useDeleteMessage(chatId?: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (messageId) => {
      await apiClient.delete(`/messages/${messageId}`);
    },
    onSuccess: () => {
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ['chats', chatId, 'messages'] });
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

// -------------------------------------------------------------
// 7. Mark Chat as Read (POST /chats/:id/read)
// -------------------------------------------------------------

export function useMarkChatAsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (chatId) => {
      await apiClient.post(`/chats/${chatId}/read`);
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chats', chatId, 'messages'] });
    },
  });
}
