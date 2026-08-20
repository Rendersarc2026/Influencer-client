import React, { ReactNode, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { SidebarRail, TopBar } from '@organisms';
import { ConfirmDialog } from '@molecules';
import { navConfig, NavItem } from '@routes/navConfig';
import { useNavigation, useChats } from '@api';
import { useAuth } from '@hooks';
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
  activePath: explicitActivePath,
  user: explicitUser,
  onNavigate,
  onLogout,
  onSearchClick,
  onNotificationsClick,
  rightAction,
  children,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, roleCode: authRoleCode, logout: authLogout } = useAuth();

  const user = useMemo(() => {
    if (explicitUser && explicitUser.name && explicitUser.name !== 'User') {
      return {
        name: explicitUser.name,
        email: explicitUser.email || authUser?.email,
        roleCode: explicitUser.roleCode || authRoleCode || undefined,
        avatarUrl: explicitUser.avatarUrl || authUser?.profile?.avatarUrl || undefined,
      };
    }
    const defaultRoleName =
      authRoleCode === 'AGENCY'
        ? 'Agency Manager'
        : authRoleCode === 'BRAND'
        ? 'Brand Manager'
        : authRoleCode === 'INFLUENCER'
        ? 'Creator'
        : 'User';
    return {
      name: authUser?.profile?.fullName || explicitUser?.name || defaultRoleName,
      email: authUser?.email || explicitUser?.email,
      roleCode: authRoleCode || explicitUser?.roleCode || undefined,
      avatarUrl: authUser?.profile?.avatarUrl || explicitUser?.avatarUrl || undefined,
    };
  }, [explicitUser, authUser, authRoleCode]);

  const activePath = explicitActivePath || location.pathname;
  const activeRoleCode = (user?.roleCode || authRoleCode) as RoleCode | undefined;
  const { data: dbNavItems, isLoading: isNavLoading } = useNavigation(activeRoleCode);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const effectiveNavigate = onNavigate ?? ((path: string) => navigate(path));
  const effectiveLogout = onLogout ?? authLogout;

  const { data: chats = [] } = useChats({ enabled: Boolean(user?.email) });
  const totalUnreadMessages = useMemo(
    () => chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
    [chats],
  );

  const fallbackNavItems =
    navItems.length > 0
      ? navItems
      : activeRoleCode && activeRoleCode in navConfig
        ? navConfig[activeRoleCode]
        : [];

  const baseNavItems: NavItem[] =
    dbNavItems && dbNavItems.length > 0
      ? dbNavItems.map((item) => ({
          id: item.code,
          label: item.label,
          path: item.path,
          iconName: item.iconName || 'Dashboard',
          badge: item.badge || undefined,
        }))
      : fallbackNavItems;

  const effectiveNavItems: NavItem[] = baseNavItems.map((item) => {
    if ((item.iconName === 'Chat' || item.path.includes('/chats')) && totalUnreadMessages > 0) {
      return {
        ...item,
        badge: totalUnreadMessages > 99 ? '99+' : totalUnreadMessages,
      };
    }
    return item;
  });

  const isSidebarLoading = isNavLoading && effectiveNavItems.length === 0;

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false);
    effectiveLogout();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        // hard lock — never grows past viewport. `dvh` so a phone's
        // retracting toolbars don't push the layout out of view.
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        overflow: 'hidden',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: {
          xs: '8px',
          sm: '12px',
          md: '16px',
        },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
      }}
    >
      {/* 1. Sidebar Rail (Desktop Fixed + Mobile Side Drawer) */}
      <SidebarRail
        loading={isSidebarLoading}
        items={effectiveNavItems}
        activePath={activePath}
        onNavigate={effectiveNavigate}
        onLogout={handleLogoutClick}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
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
          onMenuClick={() => setMobileNavOpen(true)}
          user={user}
          onSearchClick={onSearchClick}
          onNotificationsClick={onNotificationsClick}
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
