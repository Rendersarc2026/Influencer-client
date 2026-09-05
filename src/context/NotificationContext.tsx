import React, { useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationContext } from './notification-context-def';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { playNotificationSound } from '../utils/sound.utils';
import { parseStoredNotifications } from '../utils/notification.utils';
import { connectSocket, disconnectSocket, getSocket } from '@api';
import { MessageResponse } from '@contracts';
import {
  AppNotification,
  NotificationContextType,
  NotificationDeliveryOptions,
  NotificationDraft,
} from '@types';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { user, roleCode, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Notifications belong to the signed-in user, and on a cold load that user is
  // not known yet: `/auth/me` is still in flight for the first few renders.
  const storageKey = user?.id ? `ihub_notifs_${user.id}` : null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Load (and re-load) straight from render rather than in an effect.
  //
  // Seeding `useState` from storage read the key that was current on the *first*
  // render, which is nobody's — `user` is still null there — so the list started
  // empty and the sync effect below then wrote that empty list over the real
  // one the moment the user resolved. Every reload silently erased the history,
  // which is why the bell sat at zero next to a conversation list showing
  // unread threads. Adjusting state during render keeps the load and the key it
  // was loaded for in the same commit, so the writer below can never run
  // against a list belonging to a different key.
  if (storageKey !== loadedKey) {
    setLoadedKey(storageKey);
    setNotifications(() => {
      if (!storageKey) return [];
      try {
        return parseStoredNotifications(localStorage.getItem(storageKey));
      } catch {
        return [];
      }
    });
  }

  // Keep local storage synced, but only once the list in hand is the one that
  // was loaded for this key.
  useEffect(() => {
    if (!storageKey || storageKey !== loadedKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 100)));
    } catch {
      // Storage quota or disabled fallback
    }
  }, [notifications, storageKey, loadedKey]);

  // Track unread count.
  //
  // Messages only, matching what the notification panel lists. Counting stage
  // and approval events too left the bell showing a number the panel had
  // nothing to show for.
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && n.type === 'MESSAGE').length,
    [notifications],
  );

  const addNotification = useCallback(
    (
      draft: NotificationDraft,
      options: NotificationDeliveryOptions = { showToastAlert: true, playSound: true },
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newNotification: AppNotification = {
        ...draft,
        id,
        createdOn: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 99)]);

      if (options.playSound !== false) {
        playNotificationSound();
      }

      if (options.showToastAlert !== false) {
        showToast(
          `${newNotification.title}: ${newNotification.message}`,
          newNotification.type.includes('REJECT')
            ? 'error'
            : newNotification.type.includes('APPROV')
              ? 'success'
              : 'info',
        );
      }
    },
    [showToast],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // --------------------------------------------------------------------------
  // Socket.io Real-Time Event Monitoring (Real-Time Notifications & Message Alerts)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    const handleChatUpdated = (data: {
      chatId: string;
      lastMessage?: MessageResponse;
      senderId?: string;
    }) => {
      // Refresh the conversation list only.
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
      queryClient.invalidateQueries({ queryKey: ['chats', 'infinite'] });

      if (data?.chatId && data.lastMessage) {
        // Write the message straight into the thread cache so an already-open
        // thread updates without waiting on a refetch, then mark the thread
        // stale without refetching it - the gap fill happens if and when the
        // user actually opens that thread.
        queryClient.setQueryData<MessageResponse[]>(['chats', data.chatId, 'messages'], (old) => {
          if (!old) return old;
          if (old.some((m) => m.id === data.lastMessage!.id)) return old;
          return [...old, data.lastMessage!];
        });
        queryClient.invalidateQueries({
          queryKey: ['chats', data.chatId, 'messages'],
          refetchType: 'none',
        });
      }

      // If message is from someone else, fire real-time in-app notification
      if (data?.senderId && data.senderId !== user?.id) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const isCurrentChatPage =
          currentPath.includes('/chats') && currentSearch.includes(`chatId=${data.chatId}`);

        const encodedChatId = encodeURIComponent(data.chatId);
        const chatPath =
          roleCode === 'BRAND'
            ? `/brand/chats?chatId=${encodedChatId}`
            : roleCode === 'INFLUENCER'
              ? `/influencer/chats?chatId=${encodedChatId}`
              : `/agency/chats?chatId=${encodedChatId}`;

        addNotification(
          {
            type: 'MESSAGE',
            title: 'New Message',
            message: data.lastMessage?.body
              ? data.lastMessage.body.length > 60
                ? `${data.lastMessage.body.slice(0, 60)}...`
                : data.lastMessage.body
              : 'New message received in conversation thread.',
            link: chatPath,
            metadata: {
              chatId: data.chatId,
              senderId: data.senderId,
            },
          },
          {
            showToastAlert: !isCurrentChatPage,
            playSound: true,
          },
        );
      }
    };

    const handleDirectNotification = (draft: NotificationDraft) => {
      if (draft) {
        addNotification(draft);
      }
    };

    socket.on('chat_updated', handleChatUpdated);
    socket.on('notification', handleDirectNotification);

    return () => {
      const s = getSocket();
      s.off('chat_updated', handleChatUpdated);
      s.off('notification', handleDirectNotification);
    };
  }, [isAuthenticated, user?.id, roleCode, addNotification, queryClient]);

  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      addNotification,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
