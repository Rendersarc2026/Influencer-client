import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
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
  onProfileClick,
  onLogoutClick,
  onMenuClick,
  rightAction,
  className,
}) => {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);

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
        flexWrap: 'nowrap',
        padding: { xs: '12px 14px', sm: '16px 20px', md: '20px 24px 18px 24px' },
        borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        borderTopLeftRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        borderTopRightRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        gap: { xs: 1, sm: 1.5 },
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Left: menu toggle (mobile), back control, breadcrumb trail, title and subtitle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {onMenuClick && (
          <Tooltip title="Menu">
            <IconButton
              onClick={onMenuClick}
              aria-label="Open menu"
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                flexShrink: 0,
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                p: 0,
                borderRadius: '10px',
                border: `1px solid ${theme.palette.tokens.divider}`,
                backgroundColor: theme.palette.tokens.fieldBg,
                color: theme.palette.tokens.textPrimary,
                '&:hover': {
                  backgroundColor: theme.palette.tokens.surface,
                },
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: { xs: 19, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        )}

        {onBack && (
          <Tooltip title={backLabel}>
            <IconButton
              onClick={onBack}
              aria-label={backLabel}
              sx={{
                flexShrink: 0,
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                p: 0,
                borderRadius: '10px',
                border: `1px solid ${theme.palette.tokens.divider}`,
                backgroundColor: theme.palette.tokens.fieldBg,
                '&:hover': {
                  backgroundColor: theme.palette.tokens.surface,
                },
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: { xs: 19, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        )}

        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {Boolean(breadcrumbs?.length) && (
            <Breadcrumbs
              separator={<NavigateNextRoundedIcon sx={{ fontSize: 13 }} />}
              aria-label="breadcrumb"
              sx={{
                mb: '1px',
                '& .MuiBreadcrumbs-separator': { mx: 0.25 },
                color: theme.palette.tokens.textSecondary,
                '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap', overflow: 'hidden' },
                '& .MuiBreadcrumbs-li': { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
                      fontSize: { xs: '11px', sm: '12px' },
                      fontWeight: 500,
                      color: theme.palette.tokens.textSecondary,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      '&:hover': { color: theme.palette.tokens.textPrimary },
                    }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <Typography
                    key={`${crumb.label}-${i}`}
                    variant="caption"
                    noWrap
                    sx={{ fontSize: { xs: '11px', sm: '12px' }, fontWeight: 500 }}
                  >
                    {crumb.label}
                  </Typography>
                ),
              )}
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
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
            noWrap
            sx={{
              fontSize: { xs: '17px', sm: '20px', md: '26px' },
              lineHeight: 1.2,
              fontWeight: 800,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              m: 0,
              p: 0,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              noWrap
              sx={{
                color: theme.palette.tokens.textSecondary,
                mt: '1px',
                fontSize: { xs: '11px', sm: '12px' },
                display: { xs: 'none', sm: 'block' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
          gap: { xs: 0.75, sm: 1.25 },
          flexShrink: 0,
          justifyContent: 'flex-end',
        }}
      >
        {rightAction && (
          <Box
            sx={{
              flexShrink: 0,
              '& .MuiButton-root': {
                height: { xs: 34, sm: 38 },
                minWidth: { xs: 34, sm: 'auto' },
                px: { xs: 1.25, sm: 2 },
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 700,
                whiteSpace: 'nowrap',
                borderRadius: `${theme.customRadii.pill}px`,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.35, sm: 0.75 },
                  ml: { xs: -0.25, sm: -0.5 },
                  '& > *:nth-of-type(1)': {
                    fontSize: { xs: 17, sm: 19 },
                  },
                },
              },
            }}
          >
            {rightAction}
          </Box>
        )}

        {onSearchClick && (
          <Tooltip title="Search">
            <IconButton
              onClick={onSearchClick}
              sx={{
                width: { xs: 34, sm: 38 },
                height: { xs: 34, sm: 38 },
                p: 0,
                borderRadius: '10px',
                border: `1px solid ${theme.palette.tokens.divider}`,
                backgroundColor: theme.palette.tokens.fieldBg,
                '&:hover': {
                  backgroundColor: theme.palette.tokens.surface,
                },
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: { xs: 19, sm: 20 } }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}>
          <IconButton
            onClick={handleOpenNotifications}
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            sx={{
              width: { xs: 34, sm: 38 },
              height: { xs: 34, sm: 38 },
              p: 0,
              borderRadius: '50%',
              border: `1px solid ${theme.palette.tokens.divider}`,
              backgroundColor: notificationAnchor ? theme.palette.tokens.accentBg : theme.palette.tokens.fieldBg,
              color: notificationAnchor ? theme.palette.tokens.accentText : theme.palette.tokens.textPrimary,
              '&:hover': {
                backgroundColor: theme.palette.tokens.surface,
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              max={99}
              overlap="circular"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: theme.palette.tokens.negative,
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 700,
                  minWidth: 14,
                  height: 14,
                  padding: '0 3px',
                },
              }}
            >
              <NotificationsNoneRoundedIcon sx={{ fontSize: { xs: 19, sm: 20 } }} />
            </Badge>
          </IconButton>
        </Tooltip>

        <UserMenu
          user={user}
          onProfileClick={onProfileClick}
          onLogoutClick={onLogoutClick}
        />

        <NotificationCenter
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleCloseNotifications}
        />
      </Box>
    </Box>
  );
};
