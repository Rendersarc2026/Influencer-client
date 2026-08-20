import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';

import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { StartChatDialog } from '@molecules';
import { EmptyState } from '@atoms';
import {
  useChats,
  useChatMessages,
  useSendMessage,
  useEditMessage,
  useMarkChatAsRead,
  useCreateOrFindChat,
  useAgencyInfluencers,
  useAgencyBrands,
  useAgencyUsers,
  uploadChatAttachment,
  getSocket,
  joinChat,
  leaveChat,
  sendTyping,
  sendStopTyping,
} from '@api';

import {
  ChatResponse,
  ChatTypeCode,
  ChatTypeName,
  MessageResponse,
  InfluencerResponse,
  BrandResponse,
  UserResponse,
} from '@contracts';
import { useAuth, useToast, useNotifications } from '@hooks';
import { safeUrl, safeImageUrl } from '@utils';

const isImageAttachmentUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.svg') ||
    clean.includes('/storage/v1/object/public/') ||
    clean.includes('/chat/') ||
    clean.includes('/uploads/')
  );
};

/**
 * Body stored on an attachment-only message. The server requires a non-empty
 * body, so the send path fills this in; the bubble hides it again so an image
 * posted on its own renders as just the image.
 */
const IMAGE_ATTACHMENT_PLACEHOLDER = '📷 [Image attachment]';

const visibleMessageBody = (body?: string | null): string =>
  !body || body.trim() === IMAGE_ATTACHMENT_PLACEHOLDER ? '' : body;

/** Authors may edit their own text for this long after sending. Mirrors the server rule. */
const MESSAGE_EDIT_WINDOW_MS = 5 * 60 * 1000;

const isWithinEditWindow = (createdOn: Date | string, now: number): boolean =>
  now - new Date(createdOn).getTime() <= MESSAGE_EDIT_WINDOW_MS;

export const ChatOrganism: React.FC = () => {

  const theme = useTheme();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, roleCode, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { notifications, markAsRead } = useNotifications();

  const queryChatId = searchParams.get('chatId');
  const queryParticipantId = searchParams.get('participantId');
  const queryType = (searchParams.get('type') as 'INFLUENCER' | 'BRAND') || undefined;

  const isAgency = roleCode === 'AGENCY';
  const { data: chats = [], isLoading: chatsLoading } = useChats();
  const { data: influencersData } = useAgencyInfluencers(isAgency ? { limit: 100 } : undefined, {
    enabled: isAgency,
  });
  const { data: brandsData } = useAgencyBrands(isAgency ? { limit: 100 } : undefined, {
    enabled: isAgency,
  });
  const { data: usersData } = useAgencyUsers(isAgency ? { limit: 100 } : undefined, {
    enabled: isAgency,
  });

  const influencers: InfluencerResponse[] = useMemo(
    () => influencersData?.items || [],
    [influencersData],
  );
  const brands: BrandResponse[] = useMemo(
    () => brandsData?.items || [],
    [brandsData],
  );
  const users: UserResponse[] = useMemo(
    () => usersData?.items || [],
    [usersData],
  );

  const [selectedChatId, setSelectedChatId] = useState<string | null>(queryChatId || null);
  const [searchFilter, setSearchFilter] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [attachmentMeta, setAttachmentMeta] = useState<{ name: string; size: string } | null>(null);
  const [showAttachmentField, setShowAttachmentField] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline edit of an own message, plus the clock that retires the action once
  // the five-minute window closes on a bubble already on screen.
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());



  // New Chat Dialog state
  const [startChatOpen, setStartChatOpen] = useState(false);
  const [dialogParticipantId, setDialogParticipantId] = useState<string | undefined>(queryParticipantId || undefined);
  const [dialogType, setDialogType] = useState<'INFLUENCER' | 'BRAND'>(queryType || 'INFLUENCER');

  const createChatMutation = useCreateOrFindChat();

  const totalUnread = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [chats],
  );

  // Active chat & messages
  const activeChat = useMemo(() => {
    if (selectedChatId) {
      return chats.find((c) => c.id === selectedChatId) || null;
    }
    return chats.length > 0 && !isMobile ? chats[0] : null;
  }, [chats, selectedChatId, isMobile]);

  const effectiveChatId = selectedChatId || activeChat?.id;

  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(effectiveChatId);
  const sendMessageMutation = useSendMessage(effectiveChatId, user?.id);
  const editMessageMutation = useEditMessage(effectiveChatId);
  const markReadMutation = useMarkChatAsRead();
  // The mutation object is a fresh reference on every render; `mutate` is stable.
  // Depending on the object made the socket effect leave/rejoin the room and
  // re-bind every listener on each render.
  const markChatRead = markReadMutation.mutate;

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter out any soft-deleted messages for a clean chat feed
  const activeMessages = useMemo(
    () => messages.filter((m) => m.isActive !== false),
    [messages],
  );

  // The edit action has to disappear on its own once a bubble already on screen
  // ages out. The clock only runs while something is still editable, so an idle
  // thread costs no re-renders.
  const hasEditableOwnMessage = useMemo(
    () =>
      activeMessages.some(
        (m) => m.senderId === user?.id && isWithinEditWindow(m.createdOn, nowTick),
      ),
    [activeMessages, user?.id, nowTick],
  );

  useEffect(() => {
    if (!hasEditableOwnMessage) return;
    const timer = setInterval(() => setNowTick(Date.now()), 20000);
    return () => clearInterval(timer);
  }, [hasEditableOwnMessage]);

  // Switching threads abandons an open edit rather than carrying the draft over.
  useEffect(() => {
    setEditingMessageId(null);
    setEditingBody('');
  }, [effectiveChatId]);

  // -------------------------------------------------------------
  // Real-Time Socket.io Thread Sync (Messages, Read Receipts, Typing)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!effectiveChatId) return;

    joinChat(effectiveChatId);
    const socket = getSocket();

    const handleNewMessage = (msg: MessageResponse) => {
      if (msg.chatId === effectiveChatId) {
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', effectiveChatId, 'messages'],
          (old = []) => {
            if (old.some((m) => m.id === msg.id)) return old;

            // The server broadcasts to the whole room, sender included. When this
            // echo is our own message it must replace the optimistic placeholder
            // instead of appending, or the bubble renders twice.
            if (msg.senderId === user?.id) {
              const tempIndex = old.findIndex(
                (m) => m.id.startsWith('temp-') && m.body === msg.body,
              );
              if (tempIndex !== -1) {
                const next = [...old];
                next[tempIndex] = msg;
                return next;
              }
            }

            return [...old, msg];
          },
        );
        // Mark as read immediately if user is viewing this active incoming message
        if (msg.senderId !== user?.id) {
          markChatRead(effectiveChatId);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['chats'], exact: true });
    };

    const handleMessageEdited = (msg: MessageResponse) => {
      if (msg.chatId === effectiveChatId) {
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', effectiveChatId, 'messages'],
          (old = []) => {
            // An edit arrives as a new row that supersedes the one it points
            // back at, so the swap is keyed on `editedFromId`, not on the id.
            if (old.some((m) => m.id === msg.id)) {
              return old.map((m) => (m.id === msg.id ? msg : m));
            }
            const replacedId = msg.editedFromId;
            if (!replacedId || !old.some((m) => m.id === replacedId)) return old;
            return old.map((m) => (m.id === replacedId ? msg : m));
          },
        );
      }
    };

    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      if (data.chatId === effectiveChatId) {
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', effectiveChatId, 'messages'],
          (old = []) => old.filter((m) => m.id !== data.messageId),
        );
      }
    };

    const handleMessagesRead = (data: { chatId: string; readBy: string; readOn: string | Date }) => {
      if (data.chatId === effectiveChatId) {
        queryClient.setQueryData<MessageResponse[]>(
          ['chats', effectiveChatId, 'messages'],
          (old = []) =>
            old.map((m) =>
              m.senderId !== data.readBy && !m.readOn
                ? { ...m, readOn: new Date(data.readOn) }
                : m,
            ),
        );
      }
    };

    const handleUserTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === effectiveChatId && data.userId !== user?.id) {
        setPartnerTyping(true);
      }
    };

    const handleUserStopTyping = (data: { chatId: string; userId: string }) => {
      if (data.chatId === effectiveChatId && data.userId !== user?.id) {
        setPartnerTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      leaveChat(effectiveChatId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [effectiveChatId, user?.id, queryClient, markChatRead]);

  // Handle URL query parameter changes
  useEffect(() => {
    if (queryChatId) {
      setSelectedChatId(queryChatId);
    }
  }, [queryChatId]);

  useEffect(() => {
    if (queryParticipantId) {
      setDialogParticipantId(queryParticipantId);
      setDialogType(queryType || 'INFLUENCER');
      setStartChatOpen(true);
    }
  }, [queryParticipantId, queryType]);

  // Auto select first chat on desktop if none selected
  useEffect(() => {
    if (!selectedChatId && chats.length > 0 && !isMobile) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId, isMobile]);

  // Keep the open thread in the URL
  useEffect(() => {
    if (effectiveChatId === (queryChatId ?? undefined)) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (effectiveChatId) {
          next.set('chatId', effectiveChatId);
        } else {
          next.delete('chatId');
        }
        return next;
      },
      { replace: true },
    );
  }, [effectiveChatId, queryChatId, setSearchParams]);

  // Mark chat as read only when opening a thread that has unread messages.
  // The request invalidates ['chats'], so without the ref guard the refetched
  // unreadCount re-triggers this effect and the POST fires in a loop.
  const lastReadChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!effectiveChatId) return;
    if (!activeChat?.unreadCount || activeChat.unreadCount <= 0) return;
    if (lastReadChatIdRef.current === effectiveChatId) return;

    lastReadChatIdRef.current = effectiveChatId;
    markChatRead(effectiveChatId);
  }, [effectiveChatId, activeChat?.unreadCount, markChatRead]);

  // Allow a re-mark once the thread is reopened later
  useEffect(() => {
    return () => {
      lastReadChatIdRef.current = null;
    };
  }, [effectiveChatId]);

  // Clear unread notifications for the active thread
  const unreadThreadNotifIds = useMemo(
    () =>
      notifications
        .filter((n) => !n.read && n.metadata?.chatId === effectiveChatId)
        .map((n) => n.id),
    [notifications, effectiveChatId],
  );

  useEffect(() => {
    if (unreadThreadNotifIds.length > 0) {
      unreadThreadNotifIds.forEach((id) => markAsRead(id));
    }
  }, [unreadThreadNotifIds, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleStartChat = async (participantId: string) => {
    try {
      const newChat = await createChatMutation.mutateAsync({
        participantId,
      });
      setSelectedChatId(newChat.id);
      setStartChatOpen(false);
      setSearchParams({ chatId: newChat.id });
      showSuccess('Conversation started.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to start conversation.');
    }
  };

  const handleStartAgencyChat = async () => {
    try {
      const newChat = await createChatMutation.mutateAsync({});
      setSelectedChatId(newChat.id);
      setSearchParams({ chatId: newChat.id });
      showSuccess('Conversation started.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to start conversation.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (effectiveChatId) {
      sendTyping(effectiveChatId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(effectiveChatId);
      }, 2000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveChatId) return;

    // Strict validation: < 5MB
    const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

    if (file.size === 0) {
      showError('Selected file is empty.');
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_CHAT_IMAGE_SIZE) {
      showError('Image size exceeds 5MB limit. Please upload an image smaller than 5MB.');
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      return;
    }

    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowed.includes(file.type.toLowerCase())) {
      showError('Unsupported file type. Allowed image formats are JPEG, PNG, WEBP, GIF, and SVG.');
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingAttachment(true);
      const res = await uploadChatAttachment(effectiveChatId, file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setAttachmentMeta({ name: file.name, size: `${sizeMb} MB` });
      setAttachmentInput(res.url);
      setShowAttachmentField(true);
      showSuccess('Image uploaded and attached successfully.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to upload image.';
      showError(msg);
    } finally {
      setUploadingAttachment(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedBody = messageInput.trim();
    const trimmedAttachment = attachmentInput.trim();
    if (
      (!trimmedBody && !trimmedAttachment) ||
      !effectiveChatId ||
      sendMessageMutation.isPending ||
      uploadingAttachment
    ) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendStopTyping(effectiveChatId);

    const payload = {
      body: trimmedBody || (trimmedAttachment ? IMAGE_ATTACHMENT_PLACEHOLDER : ''),
      attachmentUrl: trimmedAttachment || undefined,
    };

    setMessageInput('');
    setAttachmentInput('');
    setAttachmentMeta(null);
    setShowAttachmentField(false);


    try {
      await sendMessageMutation.mutateAsync(payload);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to send message.',
      );
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // -------------------------------------------------------------
  // Inline Message Edit (own messages, five minutes after sending)
  // -------------------------------------------------------------

  const beginEditMessage = (msg: MessageResponse) => {
    setEditingMessageId(msg.id);
    setEditingBody(visibleMessageBody(msg.body));
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingBody('');
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || editMessageMutation.isPending) return;

    const original = activeMessages.find((m) => m.id === editingMessageId);
    const trimmed = editingBody.trim();

    if (!original) {
      cancelEditMessage();
      return;
    }
    if (!trimmed) {
      showError('A message cannot be left empty.');
      return;
    }
    if (trimmed === visibleMessageBody(original.body)) {
      cancelEditMessage();
      return;
    }
    // Re-checked against the wall clock rather than the ticking state, so a
    // form left open past the deadline cannot slip an edit through.
    if (!isWithinEditWindow(original.createdOn, Date.now())) {
      showError('Messages can only be edited within 5 minutes of sending.');
      cancelEditMessage();
      return;
    }

    try {
      await editMessageMutation.mutateAsync({ messageId: editingMessageId, body: trimmed });
      cancelEditMessage();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to edit message.',
      );
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditMessage();
    }
  };

  const getChatPartnerName = React.useCallback(
    (chat: ChatResponse) => {
      // 1. Direct from server payload if present
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

      // 2. Client-side lookup fallback across users, brands, and influencers
      if (chat.type === ChatTypeCode.AGENCY_BRAND) {
        if (chat.brandUserId) {
          const matchedUser = users.find((u) => u.id === chat.brandUserId);
          if (matchedUser?.brandName) return matchedUser.brandName;
          const matchedBrand = brands.find(
            (b) =>
              b.id === chat.brandUserId ||
              b.id === matchedUser?.brandId ||
              (matchedUser?.email && b.contactEmail === matchedUser.email),
          );
          if (matchedBrand) return matchedBrand.name;
        }
        return roleCode === 'BRAND' ? 'Fetch Agency' : 'Brand Partner';
      }

      if (chat.type === ChatTypeCode.AGENCY_INFLUENCER) {
        if (chat.influencerId) {
          const matchedUser = users.find((u) => u.id === chat.influencerId);
          if (matchedUser?.influencer?.name) return matchedUser.influencer.name;
          if (matchedUser?.profile?.fullName) return matchedUser.profile.fullName;
          const matchedInfluencer = influencers.find(
            (i) =>
              i.id === chat.influencerId ||
              i.id === matchedUser?.influencer?.id ||
              (matchedUser?.email && i.email === matchedUser.email),
          );
          if (matchedInfluencer) return matchedInfluencer.name;
        }
        return roleCode === 'INFLUENCER' ? 'Fetch Agency' : 'Creator';
      }

      return 'Direct Message';
    },
    [brands, influencers, users, roleCode],
  );

  const getChatPartnerAvatar = React.useCallback(
    (chat: ChatResponse) => {
      if (chat.type === ChatTypeCode.AGENCY_BRAND) {
        if (chat.brandUserId) {
          const matchedUser = users.find((u) => u.id === chat.brandUserId);
          if (matchedUser?.profile?.avatarUrl) return matchedUser.profile.avatarUrl;
          const matchedBrand = brands.find(
            (b) =>
              b.id === chat.brandUserId ||
              b.id === matchedUser?.brandId ||
              (matchedUser?.email && b.contactEmail === matchedUser.email),
          );
          if (matchedBrand?.logoUrl) return matchedBrand.logoUrl;
        }
      } else if (chat.type === ChatTypeCode.AGENCY_INFLUENCER) {
        if (chat.influencerId) {
          const matchedUser = users.find((u) => u.id === chat.influencerId);
          if (matchedUser?.profile?.avatarUrl) return matchedUser.profile.avatarUrl;
        }
      }
      return undefined;
    },
    [brands, users],
  );

  const formatMessageTime = (dateInput?: Date | string | null) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDateGroup = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNavItems = () => {
    if (roleCode === 'AGENCY') return navConfig.AGENCY;
    if (roleCode === 'BRAND') return navConfig.BRAND;
    return navConfig.INFLUENCER;
  };

  // Filtered conversation list
  const filteredChats = useMemo(() => {
    if (!searchFilter.trim()) return chats;
    const term = searchFilter.toLowerCase();
    return chats.filter((c) => {
      const partner = getChatPartnerName(c).toLowerCase();
      const typeLabel = ChatTypeName[c.type]?.toLowerCase() || '';
      return partner.includes(term) || typeLabel.includes(term);
    });
  }, [chats, searchFilter, getChatPartnerName]);

  return (
    <DashboardLayout
      title="Direct Messages"
      subtitle="Secure communications between agencies, brands, and influencers"
      navItems={getNavItems()}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'User',
        email: user?.email,
        roleCode: roleCode || 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        roleCode === 'AGENCY' ? (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon fontSize="small" />}
            onClick={() => {
              setDialogParticipantId(undefined);
              setStartChatOpen(true);
            }}
          >
            New Conversation
          </Button>
        ) : undefined
      }
    >
      <Card
        sx={{
          height: 'calc(100vh - 180px)',
          '@supports (height: 100dvh)': { height: 'calc(100dvh - 180px)' },
          // 560 is a comfortable desktop floor but taller than what a short
          // phone has left once the top bar and bottom nav take their cut,
          // which forced the whole page to scroll behind the nav.
          minHeight: { xs: 400, sm: 560 },
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* LEFT PANE: Conversations List */}
        {(!isMobile || !selectedChatId) && (
          <Box
            sx={{
              width: isMobile ? '100%' : 340,
              minWidth: isMobile ? '100%' : 340,
              borderRight: `1px solid ${theme.palette.tokens.divider}`,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.tokens.fieldBg,
            }}
          >
            {/* Header + Search */}
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexShrink: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: '17px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Conversations
                  </Typography>
                  {totalUnread > 0 ? (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: `${theme.customRadii.pill}px`,
                        backgroundColor: theme.palette.tokens.negative,
                        color: theme.palette.tokens.surface,
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        lineHeight: 1.4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        boxShadow: `0 2px 4px ${theme.palette.tokens.negative}4D`,
                      }}
                    >
                      {totalUnread > 99 ? '99+' : totalUnread} unread
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: `${theme.customRadii.pill}px`,
                        backgroundColor: theme.palette.tokens.accentBg,
                        color: theme.palette.tokens.accentText,
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        lineHeight: 1.4,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {chats.length}
                    </Box>
                  )}
                </Box>
                {roleCode === 'AGENCY' ? (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddRoundedIcon fontSize="small" />}
                    onClick={() => {
                      setDialogParticipantId(undefined);
                      setStartChatOpen(true);
                    }}
                    sx={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'none',
                      height: 32,
                      px: 1.5,
                      borderRadius: `${theme.customRadii.pill}px`,
                    }}
                  >
                    New
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      createChatMutation.isPending ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <ChatBubbleOutlineRoundedIcon fontSize="small" />
                      )
                    }
                    onClick={handleStartAgencyChat}
                    disabled={createChatMutation.isPending}
                    sx={{
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'none',
                      height: 32,
                      px: 1.5,
                      borderRadius: `${theme.customRadii.pill}px`,
                    }}
                  >
                    {createChatMutation.isPending ? 'Connecting...' : 'Message Agency'}
                  </Button>
                )}
              </Box>

              {/* Search conversations */}
              {chats.length > 0 && (
                <TextField
                  size="small"
                  placeholder="Filter conversations..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon
                          sx={{ fontSize: '18px', color: theme.palette.tokens.textSecondary }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: searchFilter ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchFilter('')}
                          sx={{
                            width: 20,
                            height: 20,
                            p: 0,
                            backgroundColor: 'transparent',
                            color: theme.palette.tokens.textSecondary,
                            '&:hover': { backgroundColor: 'transparent' },
                          }}
                        >
                          <CloseRoundedIcon sx={{ fontSize: '14px' }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.tokens.surface,
                      borderRadius: `${theme.customRadii.inner}px`,
                      height: 36,
                    },
                    '& input': {
                      fontSize: '13px',
                      py: 0.5,
                    },
                  }}
                />
              )}
            </Box>

            {/* Conversation Items List */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {chatsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : chats.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', my: 'auto' }}>
                  <EmptyState
                    icon={<ChatBubbleOutlineRoundedIcon />}
                    title="No conversations"
                    description="Start a direct thread with a brand or creator to collaborate."
                    action={
                      roleCode === 'AGENCY' ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddRoundedIcon fontSize="small" />}
                          onClick={() => {
                            setDialogParticipantId(undefined);
                            setStartChatOpen(true);
                          }}
                        >
                          Start a Chat
                        </Button>
                      ) : undefined
                    }
                  />
                </Box>
              ) : filteredChats.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    No conversations match &ldquo;{searchFilter}&rdquo;
                  </Typography>
                </Box>
              ) : (
                filteredChats.map((chat) => {
                  const isSelected = chat.id === effectiveChatId;
                  const partnerName = getChatPartnerName(chat);
                  const unreadCount = chat.unreadCount || 0;

                  return (
                    <Box
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: `${theme.customRadii.inner}px`,
                        backgroundColor: isSelected
                          ? theme.palette.tokens.surface
                          : 'transparent',
                        border: `1px solid ${isSelected ? theme.palette.tokens.accent : 'transparent'}`,
                        borderLeft: isSelected
                          ? `4px solid ${theme.palette.tokens.accent}`
                          : '4px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                        '&:hover': {
                          backgroundColor: theme.palette.tokens.surface,
                        },
                      }}
                    >
                      <Avatar
                        src={safeImageUrl(getChatPartnerAvatar(chat))}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: isSelected
                            ? theme.palette.tokens.rail
                            : theme.palette.tokens.divider,
                          color: isSelected
                            ? theme.palette.tints.butter
                            : theme.palette.tokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '15px',
                          flexShrink: 0,
                        }}
                      >
                        {partnerName[0]?.toUpperCase() || 'C'}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 0.25,
                          }}
                        >
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              fontWeight: unreadCount > 0 ? 800 : (isSelected ? 700 : 600),
                              color: theme.palette.tokens.textPrimary,
                            }}
                          >
                            {partnerName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: unreadCount > 0 ? theme.palette.tokens.negative : theme.palette.tokens.textSecondary,
                              fontSize: '11px',
                              fontWeight: unreadCount > 0 ? 700 : 500,
                              flexShrink: 0,
                              ml: 1,
                            }}
                          >
                            {formatMessageTime(chat.lastMessageOn)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0 }}>
                            <Box
                              sx={{
                                fontSize: '10px',
                                fontWeight: 700,
                                px: 0.75,
                                py: 0.15,
                                borderRadius: '4px',
                                backgroundColor: theme.palette.tokens.accentBg,
                                color: theme.palette.tokens.accentText,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                                flexShrink: 0,
                              }}
                            >
                              {roleCode === 'AGENCY'
                                ? chat.type === ChatTypeCode.AGENCY_INFLUENCER
                                   ? 'Creator'
                                  : 'Brand'
                                : 'Agency'}
                            </Box>

                            <Typography
                              variant="caption"
                              noWrap
                              sx={{
                                fontSize: '10px',
                                color: theme.palette.tokens.textSecondary,
                              }}
                            >
                              💬 Direct Thread
                            </Typography>
                          </Box>

                          {unreadCount > 0 && (
                            <Box
                              sx={{
                                minWidth: 20,
                                height: 20,
                                px: 0.65,
                                borderRadius: `${theme.customRadii.pill}px`,
                                backgroundColor: theme.palette.tokens.negative,
                                color: theme.palette.tokens.surface,
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                                flexShrink: 0,
                                boxShadow: `0 2px 4px ${theme.palette.tokens.negative}59`,
                              }}
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        )}

        {/* RIGHT PANE: Message Thread */}
        {(!isMobile || selectedChatId) && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: theme.palette.tokens.surface,
              minWidth: 0,
            }}
          >
            {activeChat ? (
              <>
                {/* Thread Header */}
                <Box
                  sx={{
                    px: 3,
                    py: 1.75,
                    borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: theme.palette.tokens.surface,
                    zIndex: 1,
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    {isMobile && (
                      <IconButton
                        size="small"
                        onClick={() => setSelectedChatId(null)}
                        sx={{
                          width: 32,
                          height: 32,
                          backgroundColor: theme.palette.tokens.fieldBg,
                          color: theme.palette.tokens.textPrimary,
                        }}
                      >
                        <ArrowBackRoundedIcon fontSize="small" />
                      </IconButton>
                    )}

                    <Avatar
                      src={safeImageUrl(getChatPartnerAvatar(activeChat))}
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: theme.palette.tokens.rail,
                        color: theme.palette.tints.butter,
                        fontWeight: 700,
                        fontSize: '15px',
                        flexShrink: 0,
                      }}
                    >
                      {getChatPartnerName(activeChat)[0]?.toUpperCase() || 'C'}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                          {getChatPartnerName(activeChat)}
                        </Typography>
                        <Box
                          sx={{
                            fontSize: '10px',
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.15,
                            borderRadius: '4px',
                            backgroundColor: theme.palette.tokens.accentBg,
                            color: theme.palette.tokens.accentText,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {roleCode === 'AGENCY'
                            ? activeChat.type === ChatTypeCode.AGENCY_INFLUENCER
                              ? 'Creator'
                              : 'Brand Client'
                            : 'Agency Account Manager'}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: partnerTyping ? theme.palette.tokens.accentText : theme.palette.tokens.textSecondary,
                          fontWeight: partnerTyping ? 700 : 500,
                          fontSize: '11px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {partnerTyping ? 'Typing a message...' : 'Direct 1-on-1 Conversation'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Header Right */}
                  <Box
                    sx={{
                      fontSize: '11px',
                      color: theme.palette.tokens.textSecondary,
                      display: { xs: 'none', sm: 'flex' },
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      borderRadius: `${theme.customRadii.pill}px`,
                      backgroundColor: theme.palette.tokens.fieldBg,
                      border: `1px solid ${theme.palette.tokens.divider}`,
                      flexShrink: 0,
                    }}
                  >
                    💬 Direct Thread
                  </Box>
                </Box>

                {/* Messages Container */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: theme.palette.tokens.surface,
                    // Declared once for the whole thread rather than per bubble.
                    // Each side rises from its own edge, so a message reads as
                    // coming from where its author sits.
                    '@keyframes messagePopInMine': {
                      from: { opacity: 0, transform: 'translate3d(8px, 10px, 0) scale(0.96)' },
                      to: { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
                    },
                    '@keyframes messagePopInTheirs': {
                      from: { opacity: 0, transform: 'translate3d(-8px, 10px, 0) scale(0.96)' },
                      to: { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
                    },
                  }}
                >
                  {messagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 'auto' }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : activeMessages.length === 0 ? (
                    <Box
                      sx={{
                        my: 'auto',
                        textAlign: 'center',
                        py: 6,
                        px: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: `${theme.customRadii.pill}px`,
                          backgroundColor: theme.palette.tokens.fieldBg,
                          color: theme.palette.tokens.accentText,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1,
                        }}
                      >
                        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: '26px' }} />
                      </Box>
                      <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                        Start of your conversation
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.tokens.textSecondary, maxWidth: 380 }}
                      >
                        Messages sent here are encrypted and delivered directly to {getChatPartnerName(activeChat)}.
                      </Typography>
                    </Box>
                  ) : (
                    activeMessages.map((msg, index) => {
                      const isMine = msg.senderId === user?.id || msg.id.startsWith('temp-');
                      const isEditing = editingMessageId === msg.id;
                      // A message I send renders twice: as the optimistic
                      // placeholder, then again under the id the server
                      // assigned, which remounts the bubble. The placeholder is
                      // the one the eye follows, so the row that replaces it
                      // arrives without replaying the entrance.
                      const isOwnServerEcho =
                        isMine &&
                        !msg.id.startsWith('temp-') &&
                        nowTick - new Date(msg.createdOn).getTime() < 15000;
                      const canEditMessage =
                        isMine &&
                        !msg.id.startsWith('temp-') &&
                        Boolean(visibleMessageBody(msg.body)) &&
                        isWithinEditWindow(msg.createdOn, nowTick);

                      // Date grouping
                      const currentDateGroup = formatMessageDateGroup(msg.createdOn);
                      const prevMessage = index > 0 ? activeMessages[index - 1] : null;
                      const prevDateGroup = prevMessage
                        ? formatMessageDateGroup(prevMessage.createdOn)
                        : null;
                      const showDateHeader = currentDateGroup !== prevDateGroup;

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateHeader && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                my: 2,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  px: 1.5,
                                  py: 0.4,
                                  borderRadius: `${theme.customRadii.pill}px`,
                                  backgroundColor: theme.palette.tokens.fieldBg,
                                  color: theme.palette.tokens.textSecondary,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  border: `1px solid ${theme.palette.tokens.divider}`,
                                }}
                              >
                                {currentDateGroup}
                              </Typography>
                            </Box>
                          )}

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              mb: 1.5,
                              '&:hover .message-edit-action': { opacity: 1 },
                            }}
                          >
                            {canEditMessage && !isEditing && (
                              <Tooltip title="Edit message" placement="left">
                                <IconButton
                                  className="message-edit-action"
                                  size="small"
                                  onClick={() => beginEditMessage(msg)}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    flexShrink: 0,
                                    color: theme.palette.tokens.textSecondary,
                                    // Always reachable on touch, where there is no hover.
                                    opacity: { xs: 1, md: 0 },
                                    transition: 'opacity 0.15s ease',
                                    '&:hover': {
                                      backgroundColor: theme.palette.tokens.fieldBg,
                                      color: theme.palette.tokens.accentText,
                                    },
                                  }}
                                >
                                  <EditRoundedIcon sx={{ fontSize: '15px' }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Box
                              sx={{
                                maxWidth: '72%',
                                minWidth: '80px',
                                px: 2,
                                py: 1.5,
                                // Runs once per bubble, on mount: a message that
                                // arrives pops in, and a re-render (a read
                                // receipt, the edit clock) does not replay it.
                                animation: isOwnServerEcho
                                  ? 'none'
                                  : `${
                                      isMine ? 'messagePopInMine' : 'messagePopInTheirs'
                                    } 0.22s cubic-bezier(0.22, 1, 0.36, 1)`,
                                transformOrigin: isMine ? 'bottom right' : 'bottom left',
                                '@media (prefers-reduced-motion: reduce)': {
                                  animation: 'none',
                                },
                                borderRadius: isMine
                                  ? `${theme.customRadii.inner}px ${theme.customRadii.inner}px 4px ${theme.customRadii.inner}px`
                                  : `${theme.customRadii.inner}px ${theme.customRadii.inner}px ${theme.customRadii.inner}px 4px`,
                                backgroundColor: isMine
                                  ? theme.palette.tokens.rail
                                  : theme.palette.tokens.fieldBg,
                                border: isMine
                                  ? 'none'
                                  : `1px solid ${theme.palette.tokens.divider}`,
                                color: isMine
                                  ? '#FFFFFF'
                                  : theme.palette.tokens.textPrimary,
                                wordBreak: 'break-word',
                                boxShadow: isMine
                                  ? '0 2px 6px rgba(0, 0, 0, 0.08)'
                                  : 'none',
                              }}
                            >
                              {/* Message text — omitted for attachment-only messages */}
                              {isEditing ? (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.75,
                                    minWidth: { xs: 180, sm: 260 },
                                  }}
                                >
                                  <TextField
                                    value={editingBody}
                                    onChange={(e) => setEditingBody(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    autoFocus
                                    multiline
                                    maxRows={6}
                                    size="small"
                                    fullWidth
                                    inputProps={{ maxLength: 4000 }}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '13.5px',
                                        lineHeight: 1.5,
                                        borderRadius: `${theme.customRadii.inner - 4}px`,
                                        backgroundColor: isMine
                                          ? 'rgba(255, 255, 255, 0.14)'
                                          : theme.palette.tokens.surface,
                                        color: isMine ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                                        '& fieldset': {
                                          borderColor: isMine
                                            ? 'rgba(255, 255, 255, 0.35)'
                                            : theme.palette.tokens.divider,
                                        },
                                        '&:hover fieldset': {
                                          borderColor: isMine
                                            ? 'rgba(255, 255, 255, 0.55)'
                                            : theme.palette.tokens.accent,
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: isMine
                                            ? 'rgba(255, 255, 255, 0.75)'
                                            : theme.palette.tokens.accent,
                                        },
                                      },
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'flex-end',
                                      gap: 0.75,
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      onClick={cancelEditMessage}
                                      sx={{
                                        minWidth: 0,
                                        px: 1.25,
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        color: isMine
                                          ? 'rgba(255, 255, 255, 0.8)'
                                          : theme.palette.tokens.textSecondary,
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disableElevation
                                      onClick={handleSaveEdit}
                                      disabled={editMessageMutation.isPending}
                                      startIcon={
                                        editMessageMutation.isPending ? (
                                          <CircularProgress size={12} color="inherit" />
                                        ) : (
                                          <CheckRoundedIcon sx={{ fontSize: '14px' }} />
                                        )
                                      }
                                      sx={{
                                        minWidth: 0,
                                        px: 1.5,
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: `${theme.customRadii.pill}px`,
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                visibleMessageBody(msg.body) && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontSize: '13.5px',
                                      lineHeight: 1.5,
                                      whiteSpace: 'pre-wrap',
                                      color: isMine ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                                    }}
                                  >
                                    {visibleMessageBody(msg.body)}
                                  </Typography>
                                )
                              )}

                              {/* Message attachment link or inline image if present */}
                              {safeUrl(msg.attachmentUrl) && (
                                isImageAttachmentUrl(msg.attachmentUrl) ? (
                                  <Box
                                    component="a"
                                    href={safeUrl(msg.attachmentUrl) as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                      mt: 1,
                                      display: 'block',
                                      borderRadius: `${theme.customRadii.inner - 4}px`,
                                      overflow: 'hidden',
                                      border: `1px solid ${
                                        isMine ? 'rgba(255, 255, 255, 0.2)' : theme.palette.tokens.divider
                                      }`,
                                      maxHeight: 240,
                                      maxWidth: 320,
                                      backgroundColor: isMine ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src={safeImageUrl(msg.attachmentUrl)}
                                      alt="Attachment"
                                      sx={{
                                        width: '100%',
                                        height: '100%',
                                        maxHeight: 240,
                                        objectFit: 'cover',
                                        display: 'block',
                                        transition: 'transform 0.2s ease',
                                        '&:hover': {
                                          transform: 'scale(1.02)',
                                        },
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Box
                                    component="a"
                                    href={safeUrl(msg.attachmentUrl) as string}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                      mt: 1,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      px: 1.25,
                                      py: 0.75,
                                      borderRadius: `${theme.customRadii.inner - 4}px`,
                                      backgroundColor: isMine
                                        ? 'rgba(255, 255, 255, 0.12)'
                                        : theme.palette.tokens.surface,
                                      border: `1px solid ${
                                        isMine ? 'rgba(255, 255, 255, 0.2)' : theme.palette.tokens.divider
                                      }`,
                                      color: isMine ? '#FFFFFF' : theme.palette.tokens.accentText,
                                      textDecoration: 'none',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        backgroundColor: isMine
                                          ? 'rgba(255, 255, 255, 0.22)'
                                          : theme.palette.tokens.fieldBg,
                                      },
                                    }}
                                  >
                                    <AttachFileRoundedIcon sx={{ fontSize: '14px' }} />
                                    <span>View Attachment</span>
                                    <OpenInNewRoundedIcon sx={{ fontSize: '12px', opacity: 0.8 }} />
                                  </Box>
                                )
                              )}


                              {/* Message Footer: Timestamp only (Clean & Minimal) */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: '10.5px',
                                    color: isMine
                                      ? 'rgba(255, 255, 255, 0.65)'
                                      : theme.palette.tokens.textSecondary,
                                    userSelect: 'none',
                                  }}
                                >
                                  {msg.editedFromId ? 'Edited • ' : ''}
                                  {formatMessageTime(msg.createdOn)}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Composer Form */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.tokens.divider}`,
                    backgroundColor: theme.palette.tokens.surface,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {/* Attachment Preview Banner if an attachment is selected/uploaded */}
                  {attachmentInput.trim() && (
                    <Box
                      sx={{
                        p: 1.25,
                        px: 1.75,
                        borderRadius: `${theme.customRadii.inner}px`,
                        backgroundColor: theme.palette.tokens.fieldBg,
                        border: `1px solid ${theme.palette.tokens.accent}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        {isImageAttachmentUrl(attachmentInput) ? (
                          <Box
                            component="img"
                            src={safeImageUrl(attachmentInput)}
                            alt="Attachment preview"
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: `1px solid ${theme.palette.tokens.divider}`,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <AttachFileRoundedIcon
                            fontSize="small"
                            sx={{ color: theme.palette.tokens.accentText, flexShrink: 0 }}
                          />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: theme.palette.tokens.textPrimary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: { xs: 200, sm: 380 },
                            }}
                          >
                            {attachmentMeta?.name ||
                              (isImageAttachmentUrl(attachmentInput)
                                ? 'Image attachment'
                                : attachmentInput)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.tokens.textSecondary,
                              fontSize: '11px',
                              display: 'block',
                            }}
                          >
                            {attachmentMeta?.size
                              ? `${attachmentMeta.size} • Ready to send (< 5MB)`
                              : 'Ready to send with message'}
                          </Typography>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={() => {
                          setAttachmentInput('');
                          setAttachmentMeta(null);
                          setShowAttachmentField(false);
                        }}
                        sx={{
                          width: 28,
                          height: 28,
                          p: 0,
                          backgroundColor: 'transparent',
                          color: theme.palette.tokens.textSecondary,
                          '&:hover': {
                            backgroundColor: theme.palette.tokens.divider,
                            color: theme.palette.tokens.negative,
                          },
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    </Box>
                  )}


                  {/* Manual URL attachment input bar if toggled and no image uploaded */}
                  {showAttachmentField && !attachmentInput.trim() && (
                    <Box
                      sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: `${theme.customRadii.inner}px`,
                        backgroundColor: theme.palette.tokens.fieldBg,
                        border: `1px solid ${theme.palette.tokens.divider}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <AttachFileRoundedIcon
                        fontSize="small"
                        sx={{ color: theme.palette.tokens.accentText }}
                      />
                      <TextField
                        size="small"
                        placeholder="Paste attachment URL (e.g. Google Drive link)..."
                        value={attachmentInput}
                        onChange={(e) => setAttachmentInput(e.target.value)}
                        variant="standard"
                        InputProps={{ disableUnderline: true }}
                        fullWidth
                        sx={{
                          '& input': {
                            fontSize: '13px',
                            py: 0.5,
                            color: theme.palette.tokens.textPrimary,
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => {
                          setShowAttachmentField(false);
                          setAttachmentInput('');
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          p: 0,
                          backgroundColor: 'transparent',
                          color: theme.palette.tokens.textSecondary,
                          '&:hover': { backgroundColor: theme.palette.tokens.divider },
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: '16px' }} />
                      </IconButton>
                    </Box>
                  )}

                  {/* Main Message Bar */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      p: 0.75,
                      pl: 1,
                      borderRadius: `${theme.customRadii.pill}px`,
                      backgroundColor: theme.palette.tokens.fieldBg,
                      border: `1px solid ${theme.palette.tokens.divider}`,
                    }}
                  >
                    {/* Hidden Native File Input for Direct Image Upload */}
                    <input
                      type="file"
                      ref={chatFileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />

                    {/* Direct Image Upload Button */}
                    <Tooltip title="Upload Image (< 5MB)">
                      <IconButton

                        size="small"
                        onClick={() => chatFileInputRef.current?.click()}
                        disabled={uploadingAttachment || sendMessageMutation.isPending}
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: uploadingAttachment
                            ? theme.palette.tokens.accentBg
                            : 'transparent',
                          color: uploadingAttachment
                            ? theme.palette.tokens.accentText
                            : theme.palette.tokens.textSecondary,
                          borderRadius: `${theme.customRadii.pill}px`,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.tokens.divider,
                            color: theme.palette.tokens.accentText,
                          },
                        }}
                      >
                        {uploadingAttachment ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <ImageRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    {/* Attach URL Button */}
                    <Tooltip title="Attach Link / URL">
                      <IconButton
                        size="small"
                        onClick={() => setShowAttachmentField(!showAttachmentField)}
                        sx={{
                          width: 36,
                          height: 36,
                          backgroundColor: showAttachmentField
                            ? theme.palette.tokens.accentBg
                            : 'transparent',
                          color: showAttachmentField
                            ? theme.palette.tokens.accentText
                            : theme.palette.tokens.textSecondary,
                          borderRadius: `${theme.customRadii.pill}px`,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.tokens.divider,
                          },
                        }}
                      >
                        <AttachFileRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <TextField
                      size="small"
                      placeholder={
                        uploadingAttachment
                          ? 'Uploading image to S3...'
                          : 'Type your message... (Press Enter to send)'
                      }
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      fullWidth
                      disabled={sendMessageMutation.isPending || uploadingAttachment}
                      sx={{
                        '& input': {
                          fontSize: '14px',
                          color: theme.palette.tokens.textPrimary,
                          py: 0.5,
                        },
                      }}
                    />

                    <IconButton
                      type="submit"
                      disabled={
                        (!messageInput.trim() && !attachmentInput.trim()) ||
                        sendMessageMutation.isPending ||
                        uploadingAttachment
                      }
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: `${theme.customRadii.pill}px`,
                        backgroundColor:
                          messageInput.trim() || attachmentInput.trim()
                            ? theme.palette.tokens.accent
                            : theme.palette.tokens.divider,
                        color:
                          messageInput.trim() || attachmentInput.trim()
                            ? '#FFFFFF'
                            : theme.palette.tokens.textSecondary,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor:
                            messageInput.trim() || attachmentInput.trim()
                              ? theme.palette.tokens.accentHover
                              : theme.palette.tokens.divider,
                        },
                        '&.Mui-disabled': {
                          backgroundColor: theme.palette.tokens.divider,
                          color: theme.palette.tokens.textSecondary,
                          opacity: 0.6,
                        },
                      }}
                    >
                      <SendRoundedIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Box>
                </Box>

              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  p: 3,
                }}
              >
                <EmptyState
                  icon={<ChatBubbleOutlineRoundedIcon />}
                  title="Select a conversation"
                  description="Choose a thread from the list on the left to view messages and collaborate."
                  action={
                    roleCode === 'AGENCY' ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddRoundedIcon fontSize="small" />}
                        onClick={() => {
                          setDialogParticipantId(undefined);
                          setStartChatOpen(true);
                        }}
                      >
                        New Conversation
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={
                          createChatMutation.isPending ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <ChatBubbleOutlineRoundedIcon fontSize="small" />
                          )
                        }
                        onClick={handleStartAgencyChat}
                        disabled={createChatMutation.isPending}
                      >
                        {createChatMutation.isPending ? 'Connecting...' : 'Message Agency'}
                      </Button>
                    )
                  }
                />
              </Box>
            )}
          </Box>
        )}
      </Card>

      {/* Start New Chat Dialog */}
      <StartChatDialog
        open={startChatOpen}
        loading={createChatMutation.isPending}
        preselectedType={dialogType}
        preselectedParticipantId={dialogParticipantId}
        onStartChat={handleStartChat}
        onClose={() => {
          setStartChatOpen(false);
          setSearchParams({});
        }}
      />
    </DashboardLayout>
  );
};
