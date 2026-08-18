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
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
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
  useMarkChatAsRead,
  useCreateOrFindChat,
  useAgencyInfluencers,
  useAgencyBrands,
  useAgencyUsers,
} from '@api';
import {
  ChatResponse,
  ChatTypeCode,
  ChatTypeName,
  InfluencerResponse,
  BrandResponse,
  UserResponse,
} from '@contracts';
import { useAuth, useToast, useNotifications } from '@hooks';
import { safeUrl, safeImageUrl } from '@utils';

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

  const { data: chats = [], isLoading: chatsLoading } = useChats();
  const { data: influencersData } = useAgencyInfluencers(roleCode === 'AGENCY' ? { limit: 100 } : undefined);
  const { data: brandsData } = useAgencyBrands(roleCode === 'AGENCY' ? { limit: 100 } : undefined);
  const { data: usersData } = useAgencyUsers(roleCode === 'AGENCY' ? { limit: 100 } : undefined);

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
  const [showAttachmentField, setShowAttachmentField] = useState(false);

  // New Chat Dialog state
  const [startChatOpen, setStartChatOpen] = useState(false);
  const [dialogParticipantId, setDialogParticipantId] = useState<string | undefined>(queryParticipantId || undefined);
  const [dialogType, setDialogType] = useState<'INFLUENCER' | 'BRAND'>(queryType || 'INFLUENCER');

  const createChatMutation = useCreateOrFindChat();

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
  const markReadMutation = useMarkChatAsRead();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter out any soft-deleted messages for a clean chat feed
  const activeMessages = useMemo(
    () => messages.filter((m) => m.isActive !== false),
    [messages],
  );

  // Instant message feed sync when activeChat receives a new message
  const activeLastMessageOn = activeChat?.lastMessageOn;
  useEffect(() => {
    if (effectiveChatId && activeLastMessageOn) {
      queryClient.invalidateQueries({ queryKey: ['chats', effectiveChatId, 'messages'] });
    }
  }, [effectiveChatId, activeLastMessageOn, queryClient]);

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

  // Keep the open thread in the URL. The notification layer reads ?chatId= to
  // tell whether an arriving message belongs to the thread already on screen,
  // and stays silent if it does.
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

  // Mark chat as read when viewing or receiving new incoming messages on active thread
  useEffect(() => {
    if (effectiveChatId) {
      markReadMutation.mutate(effectiveChatId);
      notifications
        .filter((n) => !n.read && n.metadata?.chatId === effectiveChatId)
        .forEach((n) => markAsRead(n.id));
    }
  }, [effectiveChatId, activeMessages.length]);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !effectiveChatId || sendMessageMutation.isPending) return;

    const payload = {
      body: messageInput.trim(),
      attachmentUrl: attachmentInput.trim() || undefined,
    };

    setMessageInput('');
    setAttachmentInput('');
    setShowAttachmentField(false);

    try {
      await sendMessageMutation.mutateAsync(payload);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to send message.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h3" sx={{ fontSize: '17px', fontWeight: 700 }}>
                    Conversations
                  </Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: `${theme.customRadii.pill}px`,
                      backgroundColor: theme.palette.tokens.accentBg,
                      color: theme.palette.tokens.accentText,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {chats.length}
                  </Box>
                  {chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
                    <Box
                      sx={{
                        px: 0.9,
                        py: 0.25,
                        borderRadius: `${theme.customRadii.pill}px`,
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 99
                        ? '99+'
                        : chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}{' '}
                      unread
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
                              color: unreadCount > 0 ? '#EF4444' : theme.palette.tokens.textSecondary,
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
                                borderRadius: '10px',
                                backgroundColor: '#EF4444',
                                color: '#FFFFFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1,
                                flexShrink: 0,
                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.35)',
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
                          color: theme.palette.tokens.textSecondary,
                          fontWeight: 500,
                          fontSize: '11px',
                        }}
                      >
                        Direct 1-on-1 Conversation
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
                              justifyContent: isMine ? 'flex-end' : 'flex-start',
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                maxWidth: '72%',
                                minWidth: '80px',
                                px: 2,
                                py: 1.5,
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
                              {/* Message text */}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: '13.5px',
                                  lineHeight: 1.5,
                                  whiteSpace: 'pre-wrap',
                                  color: isMine ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                                }}
                              >
                                {msg.body}
                              </Typography>

                              {/* Message attachment link if present */}
                              {safeUrl(msg.attachmentUrl) && (
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
                  {/* Attachment input bar if toggled */}
                  {showAttachmentField && (
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
                      gap: 1,
                      p: 0.75,
                      pl: 1,
                      borderRadius: `${theme.customRadii.pill}px`,
                      backgroundColor: theme.palette.tokens.fieldBg,
                      border: `1px solid ${theme.palette.tokens.divider}`,
                    }}
                  >
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

                    <TextField
                      size="small"
                      placeholder="Type your message... (Press Enter to send)"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                      fullWidth
                      disabled={sendMessageMutation.isPending}
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
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: `${theme.customRadii.pill}px`,
                        backgroundColor: messageInput.trim()
                          ? theme.palette.tokens.accent
                          : theme.palette.tokens.divider,
                        color: messageInput.trim()
                          ? '#FFFFFF'
                          : theme.palette.tokens.textSecondary,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: messageInput.trim()
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
