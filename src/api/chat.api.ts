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
// 1. Conversation List Query (real-time updates driven via Socket.io)
// -------------------------------------------------------------

export function useChats(options?: UseChatsOptions) {
  return useQuery<ChatResponse[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await apiClient.get<ChatResponse[]>('/chats');
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 30000,
  });
}

// -------------------------------------------------------------
// 2. Chat Messages Query (real-time updates driven via Socket.io)
// -------------------------------------------------------------

export function useChatMessages(chatId: string | undefined) {
  return useQuery<MessageResponse[]>({
    queryKey: ['chats', chatId, 'messages'],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await apiClient.get<MessageResponse[]>(`/chats/${chatId}/messages`);
      return response.data;
    },
    enabled: Boolean(chatId),
    staleTime: 30000,
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
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
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
    { tempId?: string }
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

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimisticMsg: MessageResponse = {
        id: tempId,
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
        (old = []) => [...old, optimisticMsg],
      );

      return { tempId };
    },
    onSuccess: (saved, _newMessage, context) => {
      if (!chatId) return;

      // Swap the placeholder for the persisted row. The `new_message` socket echo
      // may already have appended it, so drop the placeholder either way and only
      // append when the real id is not in the list yet - otherwise the bubble
      // shows twice until the next refetch prunes it.
      queryClient.setQueryData<MessageResponse[]>(['chats', chatId, 'messages'], (old = []) => {
        const withoutTemp = context?.tempId ? old.filter((m) => m.id !== context.tempId) : old;
        if (withoutTemp.some((m) => m.id === saved.id)) return withoutTemp;
        return [...withoutTemp, saved];
      });
    },
    onError: (_err, _newMessage, context) => {
      // Drop only the failed placeholder. Restoring a whole snapshot would also
      // erase any message the socket delivered while the request was in flight.
      if (chatId && context?.tempId) {
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', chatId, 'messages'],
          (old = []) => old.filter((m) => m.id !== context.tempId),
        );
      }
    },
    onSettled: () => {
      // `exact` keeps this off the ['chats', id, 'messages'] children - refetching
      // the thread here is what made the optimistic bubble flicker out.
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
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
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
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
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
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
    onSuccess: () => {
      // Only the conversation list needs refreshing - read receipts reach the
      // thread through the `messages_read` socket event.
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
    },
  });
}
