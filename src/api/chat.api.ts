import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './axios.client';
import {
  ChatResponse,
  CreateChatRequest,
  EditMessageRequest,
  MessageResponse,
  SendMessageRequest,
} from '@contracts';
import { UseChatsOptions } from '@types';

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

export interface UseInfiniteChatsOptions {
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function useInfiniteChats(options?: UseInfiniteChatsOptions) {
  const limit = options?.limit ?? 20;
  const search = options?.search;

  return useInfiniteQuery<ChatResponse[], Error>({
    queryKey: ['chats', 'infinite', search || ''],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set('page', String(pageParam));
      params.set('limit', String(limit));
      if (search && search.trim()) {
        params.set('search', search.trim());
      }
      const response = await apiClient.get<ChatResponse[]>(`/chats?${params.toString()}`);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < limit) {
        return undefined; // No more pages to load
      }
      return allPages.length + 1;
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
      queryClient.invalidateQueries({ queryKey: ['chats', 'infinite'] });
    },
  });
}

// -------------------------------------------------------------
// 4. Send Message (with optimistic append and rollback)
// -------------------------------------------------------------

export async function sendMessageApi(
  chatId: string,
  data: SendMessageRequest,
): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>(`/chats/${chatId}/messages`, data);
  return response.data;
}

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
      return sendMessageApi(chatId, data);
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
      // Refresh both full chats list and infinite chats list without touching active messages cache
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['chats', 'infinite'] });
    },
  });
}

// -------------------------------------------------------------
// 5. Edit Message (PATCH /messages/:id)
// -------------------------------------------------------------

/**
 * The server stores an edit as a new row that supersedes the original, so the
 * response carries a different id and points back at the one it replaced. The
 * cache swaps the old row for it in place - the edit keeps the original
 * `createdOn`, so the thread order does not move.
 */
export function useEditMessage(chatId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<MessageResponse, Error, { messageId: string } & EditMessageRequest>({
    mutationFn: async ({ messageId, body }) => {
      const response = await apiClient.patch<MessageResponse>(`/messages/${messageId}`, { body });
      return response.data;
    },
    onSuccess: (edited, { messageId }) => {
      if (!chatId) return;
      queryClient.setQueryData<MessageResponse[]>(['chats', chatId, 'messages'], (old = []) => {
        // The socket echo may have applied the swap already.
        if (old.some((m) => m.id === edited.id)) return old;
        return old.map((m) => (m.id === messageId ? edited : m));
      });
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['chats', 'infinite'] });
    },
  });
}

// -------------------------------------------------------------
// 6. Delete Message (DELETE /messages/:id)
// -------------------------------------------------------------

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
      // Refresh both full chats list and infinite chats list
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['chats', 'infinite'] });
    },
  });
}
