import React, { useState, useEffect, useRef, useMemo, ReactNode, useCallback } from 'react';
import { NotificationContext } from './notification-context-def';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { playNotificationSound } from '../utils/sound.utils';
import { parseStoredNotifications } from '../utils/notification.utils';
import { useChats } from '@api';
import { ChatResponse, ChatTypeCode } from '@contracts';
import {
  AppNotification,
  NotificationContextType,
  NotificationDeliveryOptions,
  NotificationDraft,
} from '@types';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  // Automatic Real-Time Monitoring: Incoming Messages (Only when logged in)
  // --------------------------------------------------------------------------
  const { data: chats = [] } = useChats({ enabled: Boolean(isAuthenticated) });

  // Map to track previous lastMessageOn timestamps to detect newly arrived messages
  const lastSeenChatTimestampsRef = useRef<Map<string, string | null>>(new Map());
  const initialChatLoadDoneRef = useRef(false);

  const getPartnerName = useCallback(
    (chat: ChatResponse) => {
      if (roleCode === 'AGENCY') {
        if (chat.type === ChatTypeCode.AGENCY_BRAND && chat.brandName) {
          return chat.brandName;
        }
        if (chat.type === ChatTypeCode.AGENCY_INFLUENCER && chat.influencerName) {
          return chat.influencerName;
        }
      } else if (roleCode === 'BRAND' || roleCode === 'INFLUENCER') {
        if (chat.agencyName) {
          return chat.agencyName;
        }
      }
      if (chat.type === ChatTypeCode.AGENCY_BRAND) {
        return roleCode === 'BRAND' ? 'Agency Account Manager' : 'Brand Partner';
      }
      if (chat.type === ChatTypeCode.AGENCY_INFLUENCER) {
        return roleCode === 'INFLUENCER' ? 'Agency Manager' : 'Creator';
      }
      return 'Direct Message';
    },
    [roleCode],
  );

  useEffect(() => {
    if (!isAuthenticated || chats.length === 0) return;

    if (!initialChatLoadDoneRef.current) {
      // First load: snapshot timestamps without firing toast alerts
      chats.forEach((chat) => {
        lastSeenChatTimestampsRef.current.set(
          chat.id,
          chat.lastMessageOn ? new Date(chat.lastMessageOn).toISOString() : null,
        );
      });
      initialChatLoadDoneRef.current = true;
      return;
    }

    // Subsequent updates: check for newer lastMessageOn
    chats.forEach((chat) => {
      const prevTimestamp = lastSeenChatTimestampsRef.current.get(chat.id);
      const currentTimestamp = chat.lastMessageOn
        ? new Date(chat.lastMessageOn).toISOString()
        : null;

      if (currentTimestamp && currentTimestamp !== prevTimestamp) {
        lastSeenChatTimestampsRef.current.set(chat.id, currentTimestamp);

        // The timestamp also moves when *we* post. Both participants poll the
        // same chat list, so without this the sender is told about their own
        // message — under the other party's name, since that is who the thread
        // is named after.
        if (chat.lastMessageSenderId && chat.lastMessageSenderId === user?.id) {
          return;
        }

        // Check if user is currently looking at this active chat thread via window.location safely
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const isCurrentChatPage =
          currentPath.includes('/chats') && currentSearch.includes(`chatId=${chat.id}`);

        const partner = getPartnerName(chat);
        const chatPath =
          roleCode === 'BRAND'
            ? `/brand/chats?chatId=${chat.id}`
            : roleCode === 'INFLUENCER'
              ? `/influencer/chats?chatId=${chat.id}`
              : `/agency/chats?chatId=${chat.id}`;

        addNotification(
          {
            type: 'MESSAGE',
            title: `New message from ${partner}`,
            message: `New message received in ${partner}'s conversation thread.`,
            link: chatPath,
            metadata: {
              chatId: chat.id,
              senderName: partner,
            },
          },
          {
            showToastAlert: !isCurrentChatPage,
            playSound: !isCurrentChatPage,
          },
        );
      }
    });
  }, [chats, isAuthenticated, roleCode, user?.id, getPartnerName, addNotification]);

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
