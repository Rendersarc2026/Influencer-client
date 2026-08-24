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

  const storageKey = user?.id ? `ihub_notifs_${user.id}` : 'ihub_notifs_guest';

  // Load initial notifications from local storage
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      return parseStoredNotifications(localStorage.getItem(storageKey));
    } catch {
      return [];
    }
  });

  // Keep local storage synced
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 100)));
    } catch {
      // Storage quota or disabled fallback
    }
  }, [notifications, storageKey, isAuthenticated]);

  // Track unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
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
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', data.chatId, 'messages'],
          (old) => {
            if (!old) return old;
            if (old.some((m) => m.id === data.lastMessage!.id)) return old;
            return [...old, data.lastMessage!];
          },
        );
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

        const chatPath =
          roleCode === 'BRAND'
            ? `/brand/chats?chatId=${data.chatId}`
            : roleCode === 'INFLUENCER'
              ? `/influencer/chats?chatId=${data.chatId}`
              : `/agency/chats?chatId=${data.chatId}`;

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
