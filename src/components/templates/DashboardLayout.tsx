import React, { ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { SidebarRail, TopBar } from '@organisms';
import { ConfirmDialog } from '@molecules';
import { NavItem } from '@routes/navConfig';

export interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  /**
   * Ancestors of the current page, shown as a trail above the title; the page
   * itself is appended from `title`. A crumb with a `path` navigates through
   * `onNavigate`, so pages describe the trail rather than wiring each click.
   */
  breadcrumbs?: Array<{ label: string; path?: string }>;
  /** Shows a back control to the left of the title. */
  onBack?: () => void;
  backLabel?: string;
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
  breadcrumbs,
  onBack,
  backLabel,
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
        height: '100vh',          // hard lock — never grows past viewport
        overflow: 'hidden',
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
          minHeight: 0,           // must shrink inside flex parent
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
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
          breadcrumbs={breadcrumbs?.map((crumb) => ({
            label: crumb.label,
            onClick: crumb.path && onNavigate ? () => onNavigate(crumb.path!) : undefined,
          }))}
          onBack={onBack}
          backLabel={backLabel}
          user={user}
          onSearchClick={onSearchClick}
          onNotificationsClick={onNotificationsClick}
          notificationCount={notificationCount}
          onProfileClick={() => onNavigate && onNavigate('/profile')}
          onLogoutClick={handleLogoutClick}
          rightAction={rightAction}
        />

        {/* Content Body */}
        <Box
          sx={{
            padding: {
              xs: `${theme.customSpacing.cardPadding / 2}px`,
              sm: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: `${theme.customSpacing.cardGap}px`,
            overflowX: 'hidden',
            overflowY: 'auto',    // mixed-content pages scroll here; fillHeight tables scroll their own rows
            // Thin scrollbar
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.tokens.divider,
              borderRadius: 3,
            },
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
