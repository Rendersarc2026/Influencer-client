import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useTheme } from '@mui/material/styles';
import { UserMenu, NotificationCenter } from '@molecules';
import { useNotifications } from '@hooks';
import { BreadcrumbItem, TopBarProps, TopBarUser } from '@types';

export type { BreadcrumbItem, TopBarProps, TopBarUser };

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  breadcrumbs,
  onBack,
  backLabel = 'Back',
  user = { name: 'User', roleCode: 'AGENCY' },
  onSearchClick,
  onNotificationsClick,
  notificationCount,
  onProfileClick,
  onLogoutClick,
  rightAction,
  className,
}) => {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);

  const effectiveCount =
    notificationCount !== undefined ? notificationCount : unreadCount;

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
    if (onNotificationsClick) {
      onNotificationsClick();
    }
  };

  const handleCloseNotifications = () => {
    setNotificationAnchor(null);
  };

  return (
    <Box
      component="header"
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        padding: { xs: '12px 14px', sm: '16px 20px', md: '20px 24px 18px 24px' },
        borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        borderTopLeftRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        borderTopRightRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        gap: { xs: 1.25, sm: 1.5 },
      }}
    >
      {/* Left: back control, breadcrumb trail, title and subtitle */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
        {onBack && (
          <Tooltip title={backLabel}>
            <IconButton
              onClick={onBack}
              aria-label={backLabel}
              sx={{
                // Nudged down so the arrow optically centres on the title line
                // rather than on the whole block once crumbs are present.
                mt: breadcrumbs?.length ? '18px' : '0px',
                flexShrink: 0,
                border: `1px solid ${theme.palette.tokens.divider}`,
                p: { xs: 0.75, sm: 1 },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ minWidth: 0 }}>
          {Boolean(breadcrumbs?.length) && (
            <Breadcrumbs
              separator={<NavigateNextRoundedIcon sx={{ fontSize: 14 }} />}
              aria-label="breadcrumb"
              sx={{
                mb: '2px',
                '& .MuiBreadcrumbs-separator': { mx: 0.25 },
                color: theme.palette.tokens.textSecondary,
              }}
            >
              {breadcrumbs!.map((crumb, i) =>
                crumb.onClick ? (
                  <Link
                    key={`${crumb.label}-${i}`}
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={crumb.onClick}
                    sx={{
                      font: 'inherit',
                      fontSize: { xs: '12px', sm: '13px' },
                      fontWeight: 500,
                      color: theme.palette.tokens.textSecondary,
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.tokens.textPrimary },
                    }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <Typography
                    key={`${crumb.label}-${i}`}
                    variant="caption"
                    sx={{ fontSize: { xs: '12px', sm: '13px' }, fontWeight: 500 }}
                  >
                    {crumb.label}
                  </Typography>
                ),
              )}
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '12px', sm: '13px' },
                  fontWeight: 600,
                  color: theme.palette.tokens.textPrimary,
                }}
              >
                {title}
              </Typography>
            </Breadcrumbs>
          )}

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '18px', sm: '22px', md: '28px' },
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.tokens.textSecondary,
                mt: '2px',
                fontSize: { xs: '11px', sm: '13px' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Right controls: Search, Notifications, UserMenu, and Custom Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          flexShrink: 0,
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
        }}
      >
        {rightAction && (
          <Box sx={{ mr: { xs: 'auto', sm: 0 }, '& .MuiButton-root': { py: { xs: 0.6, sm: 0.8 }, px: { xs: 1.25, sm: 1.75 }, fontSize: { xs: '12px', sm: '13px' } } }}>
            {rightAction}
          </Box>
        )}

        {onSearchClick && (
          <Tooltip title="Search">
            <IconButton onClick={onSearchClick}>
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Notifications">
          <IconButton
            onClick={handleOpenNotifications}
            aria-label="Notifications"
            sx={{
              position: 'relative',
              backgroundColor: notificationAnchor ? theme.palette.tokens.accentBg : undefined,
              color: notificationAnchor ? theme.palette.tokens.accentText : undefined,
            }}
          >
            <Badge
              badgeContent={effectiveCount > 99 ? '99+' : effectiveCount}
              invisible={!effectiveCount || effectiveCount <= 0}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: theme.palette.tokens.negative,
                  color: theme.palette.tokens.surface,
                  fontSize: '10px',
                  fontWeight: 800,
                  height: 18,
                  minWidth: 18,
                  borderRadius: `${theme.customRadii.pill}px`,
                  px: 0.5,
                  boxShadow: '0 2px 6px rgba(224, 82, 82, 0.45)',
                  border: `2px solid ${theme.palette.tokens.surface}`,
                  animation: effectiveCount > 0 ? 'bubblePulse 2.5s infinite ease-in-out' : 'none',
                  '@keyframes bubblePulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.12)' },
                    '100%': { transform: 'scale(1)' },
                  },
                },
              }}
            >
              <NotificationsNoneRoundedIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <NotificationCenter
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleCloseNotifications}
        />

        <UserMenu user={user} onProfileClick={onProfileClick} onLogoutClick={onLogoutClick} />
      </Box>
    </Box>
  );
};
