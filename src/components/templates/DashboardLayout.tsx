import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { SidebarRail, TopBar } from '@organisms';
import { ConfirmDialog } from '@molecules';
import { NavItem } from '@routes/navConfig';

export interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  navItems?: NavItem[];
  activePath?: string;
  user?: {
    name: string;
    email?: string;
    roleCode?: string;
    avatarUrl?: string;
  };
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
  rightAction?: ReactNode;
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  navItems = [],
  activePath = '',
  user = { name: 'User', roleCode: 'ADMIN' },
  onNavigate,
  onLogout,
  onSearchClick,
  onNotificationsClick,
  notificationCount = 0,
  rightAction,
  children,
}) => {
  const theme = useTheme();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '8px 8px 80px 8px', sm: '12px 12px 88px 12px', md: '16px' },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
      }}
    >
      {/* 1. Floating Sidebar Rail / Bottom Bar */}
      <SidebarRail
        items={navItems}
        activePath={activePath}
        onNavigate={onNavigate}
        onLogout={handleLogoutClick}
      />

      {/* 2. Main White Content Surface */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
          minHeight: { xs: 'calc(100vh - 88px)', md: 'calc(100vh - 32px)' },
          marginLeft: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        {/* TopBar on surface */}
        <TopBar
          title={title}
          subtitle={subtitle}
          user={user}
          onSearchClick={onSearchClick}
          onNotificationsClick={onNotificationsClick}
          notificationCount={notificationCount}
          onProfileClick={() => onNavigate && onNavigate('/profile')}
          onLogoutClick={handleLogoutClick}
          rightAction={rightAction}
        />

        {/* Content Body with responsive padding */}
        <Box
          sx={{
            padding: {
              xs: `${theme.customSpacing.cardPadding / 2}px`,
              sm: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: `${theme.customSpacing.cardGap}px`,
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log Out?"
        body="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </Box>
  );
};
