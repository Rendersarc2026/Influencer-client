import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import { useTheme } from '@mui/material/styles';
import { useNotifications } from '@hooks';
import {
  AppNotification,
  NotificationCenterProps,
  NotificationFilter,
  NotificationType,
} from '@types';

export type { NotificationCenterProps };

const getNotificationIcon = (type: NotificationType): React.ReactElement => {
  if (type === 'MESSAGE') {
    return <ChatBubbleOutlineRoundedIcon sx={{ fontSize: '18px' }} />;
  }
  if (type === 'RATE_APPROVED' || type === 'BRAND_APPROVED' || type === 'PAYMENT_APPROVED') {
    return <CheckCircleOutlineRoundedIcon sx={{ fontSize: '18px' }} />;
  }
  if (
    type === 'RATE_REVISION_REQUESTED' ||
    type === 'BRAND_REJECTED' ||
    type === 'BRAND_CORRECTION_REQUESTED' ||
    type === 'PAYMENT_REJECTED'
  ) {
    return <ErrorOutlineRoundedIcon sx={{ fontSize: '18px' }} />;
  }
  if (type === 'CAMPAIGN_STATUS_CHANGED') {
    return <CampaignRoundedIcon sx={{ fontSize: '18px' }} />;
  }
  return <AssignmentRoundedIcon sx={{ fontSize: '18px' }} />;
};

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  anchorEl,
  open,
  onClose,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'messages') {
      return notifications.filter((n) => n.type === 'MESSAGE');
    }
    if (activeTab === 'stages') {
      return notifications.filter((n) => n.type !== 'MESSAGE');
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.link && item.link.startsWith('/') && !item.link.startsWith('//')) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            maxWidth: 400,
            maxHeight: 520,
            borderRadius: `${theme.customRadii.card}px`,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16)',
            border: `1px solid ${theme.palette.tokens.divider}`,
            backgroundColor: theme.palette.tokens.surface,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            mt: 1.5,
          },
        },
      }}
    >
      {/* 1. Header */}
      <Box
        sx={{
          p: 2,
          pb: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Box
              sx={{
                px: 1,
                py: 0.2,
                borderRadius: `${theme.customRadii.pill}px`,
                backgroundColor: theme.palette.tokens.accentBg,
                color: theme.palette.tokens.accentText,
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {unreadCount} new
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {unreadCount > 0 && (
            <Button
              size="small"
              variant="text"
              startIcon={<DoneAllRoundedIcon sx={{ fontSize: '14px' }} />}
              onClick={markAllAsRead}
              sx={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: theme.palette.tokens.accentText,
                height: 28,
                px: 1,
              }}
            >
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <IconButton
              size="small"
              onClick={clearAll}
              title="Clear all"
              sx={{
                width: 28,
                height: 28,
                color: theme.palette.tokens.textSecondary,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.tokens.fieldBg,
                  color: theme.palette.tokens.negative,
                },
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: '16px' }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* 2. Filter Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_event: React.SyntheticEvent, value: NotificationFilter) =>
          setActiveTab(value)
        }
        variant="fullWidth"
        sx={{
          minHeight: 40,
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.fieldBg,
          '& .MuiTab-root': {
            minHeight: 40,
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'none',
            color: theme.palette.tokens.textSecondary,
            '&.Mui-selected': {
              color: theme.palette.tokens.accentText,
              fontWeight: 700,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.tokens.accent,
            height: 2.5,
          },
        }}
      >
        <Tab value="all" label="All" />
        <Tab value="messages" label="Messages" />
        <Tab value="stages" label="Stages & Updates" />
      </Tabs>

      {/* 3. Notification List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
        }}
      >
        {filteredNotifications.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: `${theme.customRadii.pill}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                color: theme.palette.tokens.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.5,
              }}
            >
              <NotificationsOffOutlinedIcon sx={{ fontSize: '22px' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              No notifications
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, maxWidth: 240 }}
            >
              You&apos;re all caught up! When you receive messages or stage updates, they&apos;ll
              appear here.
            </Typography>
          </Box>
        ) : (
          filteredNotifications.map((item) => {
            const isMessage = item.type === 'MESSAGE';
            const isApproval =
              item.type === 'RATE_APPROVED' ||
              item.type === 'BRAND_APPROVED' ||
              item.type === 'PAYMENT_APPROVED';
            const isCorrection =
              item.type === 'RATE_REVISION_REQUESTED' ||
              item.type === 'BRAND_REJECTED' ||
              item.type === 'BRAND_CORRECTION_REQUESTED';

            const iconBg = isMessage
              ? theme.palette.tokens.accentBg
              : isApproval
                ? theme.palette.tokens.positiveBg
                : isCorrection
                  ? theme.palette.tokens.negativeBg
                  : theme.palette.tokens.purpleBg;

            const iconColor = isMessage
              ? theme.palette.tokens.accentText
              : isApproval
                ? theme.palette.tokens.positiveText
                : isCorrection
                  ? theme.palette.tokens.negativeText
                  : theme.palette.tokens.purpleText;

            return (
              <Box
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                sx={{
                  p: 1.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: item.read
                    ? 'transparent'
                    : theme.palette.tokens.fieldBg,
                  border: `1px solid ${item.read ? 'transparent' : theme.palette.tokens.divider}`,
                  cursor: item.link ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: theme.palette.tokens.tableHover,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: iconBg,
                    color: iconColor,
                    flexShrink: 0,
                  }}
                >
                  {getNotificationIcon(item.type)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 0.25,
                    }}
                  >
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: item.read ? 600 : 750,
                        color: theme.palette.tokens.textPrimary,
                        fontSize: '13px',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '10.5px',
                        color: theme.palette.tokens.textSecondary,
                        flexShrink: 0,
                        ml: 1,
                      }}
                    >
                      {formatTimeAgo(item.createdOn)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.tokens.textSecondary,
                      fontSize: '11.5px',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.message}
                  </Typography>
                </Box>

                {!item.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: `${theme.customRadii.pill}px`,
                      backgroundColor: theme.palette.tokens.accent,
                      flexShrink: 0,
                      mt: 1,
                    }}
                  />
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* 4. Footer */}
      {notifications.length > 0 && (
        <>
          <Divider sx={{ borderColor: theme.palette.tokens.divider }} />
          <Box
            sx={{
              p: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.tokens.surface,
            }}
          >
            <Button
              size="small"
              variant="text"
              onClick={() => {
                navigate('/agency/chats');
                onClose();
              }}
              sx={{
                fontSize: '12px',
                fontWeight: 700,
                color: theme.palette.tokens.textSecondary,
                '&:hover': { color: theme.palette.tokens.textPrimary },
              }}
            >
              Open Direct Messages
            </Button>
          </Box>
        </>
      )}
    </Popover>
  );
};
