import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@hooks';
import { SidebarRail } from '../organisms/SidebarRail';
import { navConfig } from '../../routes/navConfig';
import { RoleCode } from '@contracts';

export type PageSkeletonVariant =
  'dashboard' | 'list' | 'detail' | 'chat' | 'form' | 'grid' | 'auth' | 'shell';

export interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
}

function resolveVariant(pathname: string, requested?: PageSkeletonVariant): PageSkeletonVariant {
  if (requested && requested !== 'shell') return requested;
  if (pathname === '/login' || pathname === '/accept-terms' || pathname === '/complete-profile') {
    return 'auth';
  }
  if (pathname === '/agency' || pathname === '/brand' || pathname === '/influencer') {
    return 'dashboard';
  }
  if (pathname.includes('/chats')) return 'chat';
  if (pathname.includes('/profile')) return 'form';
  if (pathname.endsWith('/add')) return 'grid';
  if (pathname.match(/\/(campaigns|assignments)\/[^/]+$/)) return 'detail';
  return 'list';
}

const AuthLoading: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        backgroundColor: theme.palette.tokens.pageBg,
        padding: 2,
        gap: 2,
      }}
    >
      <CircularProgress size={44} thickness={4} sx={{ color: theme.palette.tokens.accent }} />
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.tokens.textSecondary,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        Loading...
      </Typography>
    </Box>
  );
};

/**
 * Route-level page loading indicator.
 * Displays a clean loading state instead of layout shimmers during page transitions.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'shell' }) => {
  const theme = useTheme();
  const location = useLocation();
  const { roleCode, logout } = useAuth();

  const resolved = resolveVariant(location.pathname, variant);

  if (resolved === 'auth') {
    return <AuthLoading />;
  }

  const activeRoleCode: RoleCode =
    (roleCode as RoleCode) ||
    (location.pathname.startsWith('/brand')
      ? 'BRAND'
      : location.pathname.startsWith('/influencer')
        ? 'INFLUENCER'
        : 'AGENCY');

  const navItems = activeRoleCode && activeRoleCode in navConfig ? navConfig[activeRoleCode] : [];

  return (
    <Box
      sx={{
        display: 'flex',
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
      <SidebarRail
        items={navItems}
        loading={false}
        activePath={location.pathname}
        onNavigate={() => {}}
        onLogout={logout}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: 0,
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
          marginLeft: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={44} thickness={4} sx={{ color: theme.palette.tokens.accent }} />
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.tokens.textSecondary,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            Loading...
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
