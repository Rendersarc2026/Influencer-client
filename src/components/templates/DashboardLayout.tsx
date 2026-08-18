import React, { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { SidebarRail, TopBar } from '@organisms';
import { ConfirmDialog } from '@molecules';
import { navConfig, NavItem } from '@routes/navConfig';
import { useNavigation } from '@api';
import { RoleCode } from '@contracts';

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
  user = { name: 'User' },
  onNavigate,
  onLogout,
  onSearchClick,
  onNotificationsClick,
  notificationCount = 0,
  rightAction,
  children,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: dbNavItems, isLoading: isNavLoading } = useNavigation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const effectiveNavigate = onNavigate ?? ((path: string) => navigate(path));

  const effectiveNavItems: NavItem[] =
    dbNavItems && dbNavItems.length > 0
      ? dbNavItems.map((item) => ({
          id: item.code,
          label: item.label,
          path: item.path,
          iconName: item.iconName || 'Dashboard',
          badge: item.badge || undefined,
        }))
      : navItems.length > 0
        ? navItems
        : user?.roleCode && user.roleCode in navConfig
          ? navConfig[user.roleCode as RoleCode]
          : [];

  const isSidebarLoading = isNavLoading && effectiveNavItems.length === 0;

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
        padding: {
          xs: '6px 6px calc(76px + env(safe-area-inset-bottom, 0px)) 6px',
          sm: '10px 10px 84px 10px',
          md: '16px',
        },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
      }}
    >
      {/* 1. Floating Sidebar Rail / Bottom Bar */}
      <SidebarRail
        loading={isSidebarLoading}
        items={effectiveNavItems}
        activePath={activePath}
        onNavigate={effectiveNavigate}
        onLogout={handleLogoutClick}
      />

      {/* 2. Main White Content Surface */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: 0,           // must shrink inside flex parent
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
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
            onClick: crumb.path ? () => effectiveNavigate(crumb.path!) : undefined,
          }))}
          onBack={onBack}
          backLabel={backLabel}
          user={user}
          onSearchClick={onSearchClick}
          onNotificationsClick={onNotificationsClick}
          notificationCount={notificationCount}
          onProfileClick={() => effectiveNavigate('/profile')}
          onLogoutClick={handleLogoutClick}
          rightAction={rightAction}
        />

        {/* Content Body */}
        <Box
          sx={{
            padding: {
              xs: '14px 10px',
              sm: '18px 18px',
              md: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '14px', sm: '16px', md: `${theme.customSpacing.cardGap}px` },
            overflowX: 'hidden',
            overflowY: 'auto',    // mixed-content pages scroll here; fillHeight tables scroll their own rows
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
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
