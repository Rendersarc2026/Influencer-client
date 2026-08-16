import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { CommentDialog } from '@molecules';
import {
  useChats,
  useChatMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useMarkChatAsRead,
} from '@api';
import { ChatResponse, MessageResponse } from '@contracts';
import { useAuth, useToast } from '@hooks';
import { safeUrl } from '@utils';

export const ChatOrganism: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, roleCode, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: chats = [], isLoading: chatsLoading } = useChats();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [showAttachmentField, setShowAttachmentField] = useState(false);

  // Edit dialog state
  const [messageToEdit, setMessageToEdit] = useState<MessageResponse | null>(null);

  // Active chat & messages
  const activeChat =
    chats.find((c) => c.id === selectedChatId) || (chats.length > 0 && !isMobile ? chats[0] : null);
  const effectiveChatId = activeChat?.id;

  const { data: messages = [], isLoading: messagesLoading } = useChatMessages(effectiveChatId);
  const sendMessageMutation = useSendMessage(effectiveChatId, user?.id);
  const editMessageMutation = useEditMessage(effectiveChatId);
  const deleteMessageMutation = useDeleteMessage(effectiveChatId);
  const markReadMutation = useMarkChatAsRead();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto select first chat on desktop if none selected
  useEffect(() => {
    if (!selectedChatId && chats.length > 0 && !isMobile) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId, isMobile]);

  // Mark chat as read when viewing
  useEffect(() => {
    if (effectiveChatId) {
      markReadMutation.mutate(effectiveChatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !effectiveChatId) return;

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

  const handleEditConfirm = async (newBody: string) => {
    if (!messageToEdit) return;
    try {
      await editMessageMutation.mutateAsync({
        messageId: messageToEdit.id,
        data: { body: newBody },
      });
      showSuccess('Message edited.');
      setMessageToEdit(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to edit message.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
      showSuccess('Message deleted.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to delete message.');
    }
  };

  const getChatPartnerName = (chat: ChatResponse) => {
    if (roleCode === 'AGENCY') {
      if (chat.type === 'AGENCY_BRAND') return 'Brand Partner';
      return 'Creator Studio';
    }
    return 'Agency Partner';
  };

  const getNavItems = () => {
    if (roleCode === 'AGENCY') return navConfig.AGENCY;
    if (roleCode === 'BRAND') return navConfig.BRAND;
    return navConfig.INFLUENCER;
  };

  return (
    <DashboardLayout
      title="Direct Messages"
      subtitle="Secure communications between agencies, brands, and creators"
      navItems={getNavItems()}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'User',
        email: user?.email,
        roleCode: roleCode || 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Card
        sx={{
          height: 'calc(100vh - 180px)',
          minHeight: 520,
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
              width: isMobile ? '100%' : 320,
              minWidth: isMobile ? '100%' : 320,
              borderRight: `1px solid ${theme.palette.tokens.divider}`,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.tokens.fieldBg,
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.tokens.divider}` }}>
              <Typography variant="h3" sx={{ fontSize: '18px' }}>
                Conversations
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                {chats.length} active channel{chats.length === 1 ? '' : 's'}
              </Typography>
            </Box>

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
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    No conversations yet.
                  </Typography>
                </Box>
              ) : (
                chats.map((chat) => {
                  const isSelected = chat.id === effectiveChatId;
                  const partnerName = getChatPartnerName(chat);

                  return (
                    <Box
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      sx={{
                        p: 1.5,
                        borderRadius: `${theme.customRadii.inner}px`,
                        backgroundColor: isSelected ? theme.palette.tokens.surface : 'transparent',
                        border: `1px solid ${isSelected ? theme.palette.tokens.divider : 'transparent'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.tokens.surface,
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: isSelected
                            ? theme.palette.tokens.rail
                            : theme.palette.tokens.divider,
                          color: isSelected
                            ? theme.palette.tints.butter
                            : theme.palette.tokens.textPrimary,
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        {partnerName[0]}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                            {partnerName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.tokens.textSecondary, fontSize: '11px' }}
                          >
                            {chat.lastMessageOn
                              ? new Date(chat.lastMessageOn).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: theme.palette.tokens.textSecondary,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {chat.type.replace('_', ' · ')}
                        </Typography>
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
            }}
          >
            {activeChat ? (
              <>
                {/* Thread Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isMobile && (
                      <IconButton size="small" onClick={() => setSelectedChatId(null)}>
                        <ArrowBackRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: theme.palette.tokens.rail,
                        color: theme.palette.tints.butter,
                      }}
                    >
                      {getChatPartnerName(activeChat)[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {getChatPartnerName(activeChat)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.accent, fontWeight: 600 }}
                      >
                        {activeChat.type.replace('_', ' ')}
                      </Typography>
                    </Box>
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
                    gap: 2,
                  }}
                >
                  {messagesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.tokens.textSecondary }}
                      >
                        No messages in this conversation yet. Send a message to start communicating.
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id || msg.id.startsWith('temp-');
                      const isDeleted = !msg.isActive;
                      const isEdited = Boolean(msg.editedFromId);

                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMine ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '75%',
                              p: 2,
                              borderRadius: `${theme.customRadii.inner}px`,
                              backgroundColor: isDeleted
                                ? theme.palette.tokens.fieldBg
                                : isMine
                                  ? theme.palette.tokens.rail
                                  : theme.palette.tokens.fieldBg,
                              color: isDeleted
                                ? theme.palette.tokens.textSecondary
                                : isMine
                                  ? '#FFFFFF'
                                  : theme.palette.tokens.textPrimary,
                              position: 'relative',
                            }}
                          >
                            {isDeleted ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BlockRoundedIcon fontSize="small" sx={{ opacity: 0.6 }} />
                                <Typography
                                  variant="body2"
                                  sx={{ fontStyle: 'italic', opacity: 0.8 }}
                                >
                                  This message was deleted
                                </Typography>
                              </Box>
                            ) : (
                              <>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                  {msg.body}
                                </Typography>
                                {safeUrl(msg.attachmentUrl) && (
                                  <Box sx={{ mt: 1 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      href={safeUrl(msg.attachmentUrl) as string}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        color: isMine
                                          ? theme.palette.tints.butter
                                          : theme.palette.tokens.accent,
                                        borderColor: isMine
                                          ? theme.palette.tints.butter
                                          : theme.palette.tokens.accent,
                                      }}
                                    >
                                      View Attachment
                                    </Button>
                                  </Box>
                                )}
                              </>
                            )}

                            {/* Message Footer: Time + Edited marker + Actions */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 1,
                                mt: 0.5,
                                opacity: 0.8,
                              }}
                            >
                              {isEdited && !isDeleted && (
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '10px', fontStyle: 'italic' }}
                                >
                                  (edited)
                                </Typography>
                              )}
                              <Typography variant="caption" sx={{ fontSize: '10px' }}>
                                {new Date(msg.createdOn).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                              {isMine && !isDeleted && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setMessageToEdit(msg)}
                                    sx={{ p: '2px', color: 'inherit' }}
                                  >
                                    <EditRoundedIcon sx={{ fontSize: '12px' }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    sx={{ p: '2px', color: 'inherit' }}
                                  >
                                    <DeleteOutlineRoundedIcon sx={{ fontSize: '12px' }} />
                                  </IconButton>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
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
                    backgroundColor: theme.palette.tokens.fieldBg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  {showAttachmentField && (
                    <TextField
                      size="small"
                      label="Attachment Link (Optional URL)"
                      placeholder="https://drive.google.com/..."
                      value={attachmentInput}
                      onChange={(e) => setAttachmentInput(e.target.value)}
                      fullWidth
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => setShowAttachmentField(!showAttachmentField)}
                      color={showAttachmentField ? 'primary' : 'default'}
                    >
                      <AttachFileRoundedIcon fontSize="small" />
                    </IconButton>

                    <TextField
                      size="small"
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      fullWidth
                      disabled={sendMessageMutation.isPending}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      startIcon={<SendRoundedIcon fontSize="small" />}
                      sx={{ height: 40, px: 2.5 }}
                    >
                      Send
                    </Button>
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
                }}
              >
                <Typography variant="body1" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Select a conversation to start messaging.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Card>

      {/* Edit Message CommentDialog */}
      {messageToEdit && (
        <CommentDialog
          open={Boolean(messageToEdit)}
          title="Edit Message"
          subtitle="Update your message content. An edited tag will be appended."
          confirmText="Save Edit"
          initialValue={messageToEdit.body}
          loading={editMessageMutation.isPending}
          onConfirm={handleEditConfirm}
          onCancel={() => setMessageToEdit(null)}
        />
      )}
    </DashboardLayout>
  );
};
