import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { useTheme } from '@mui/material/styles';
import { UserMenu } from '@molecules';

export interface TopBarProps {
  title: string;
  subtitle?: string;
  user?: {
    name: string;
    email?: string;
    roleCode?: string;
    avatarUrl?: string;
  };
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  rightAction?: ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  user = { name: 'User', roleCode: 'ADMIN' },
  onSearchClick,
  onNotificationsClick,
  notificationCount = 0,
  onProfileClick,
  onLogoutClick,
  rightAction,
  className,
}) => {
  const theme = useTheme();

  return (
    <Box
      component="header"
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 24px 20px 24px',
        borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        borderTopLeftRadius: `${theme.customRadii.card}px`,
        borderTopRightRadius: `${theme.customRadii.card}px`,
      }}
    >
      {/* Left title and subtitle */}
      <Box>
        <Typography variant="h1">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mt: '4px' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right controls: Search, Notifications, UserMenu, and Custom Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {rightAction}

        {onSearchClick && (
          <Tooltip title="Search">
            <IconButton onClick={onSearchClick}>
              <SearchRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Notifications">
          <IconButton onClick={onNotificationsClick}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsNoneRoundedIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <UserMenu user={user} onProfileClick={onProfileClick} onLogoutClick={onLogoutClick} />
      </Box>
    </Box>
  );
};
