import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { NavItem } from '@routes/navConfig';
import { BrandLogo } from '@atoms';
import { branding } from '@config/branding';

export interface SidebarRailProps {
  items?: NavItem[];
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  loading?: boolean;
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const getNavIcon = (iconName: string): ReactNode => {
  switch (iconName) {
    case 'Dashboard':
      return <DashboardRoundedIcon fontSize="small" />;
    case 'Business':
      return <BusinessRoundedIcon fontSize="small" />;
    case 'Storefront':
      return <StorefrontRoundedIcon fontSize="small" />;
    case 'Category':
      return <CategoryRoundedIcon fontSize="small" />;
    // The nav table is the source of truth and has carried both spellings.
    case 'Place':
    case 'LocationOn':
      return <PlaceRoundedIcon fontSize="small" />;
    case 'Campaign':
      return <CampaignRoundedIcon fontSize="small" />;
    case 'People':
      return <PeopleAltRoundedIcon fontSize="small" />;
    case 'Assessment':
      return <AssessmentRoundedIcon fontSize="small" />;
    case 'Chat':
      return <ChatBubbleRoundedIcon fontSize="small" />;
    case 'Assignment':
      return <AssignmentRoundedIcon fontSize="small" />;
    case 'AttachMoney':
    case 'CurrencyRupee':
      return <CurrencyRupeeRoundedIcon fontSize="small" />;
    case 'Palette':
      return <PaletteRoundedIcon fontSize="small" />;
    case 'Calculate':
      return <CalculateRoundedIcon fontSize="small" />;
    default:
      return <DashboardRoundedIcon fontSize="small" />;
  }
};

/**
 * Determine if a nav item is active given the current path.
 */
function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (currentPath === itemPath) return true;

  if (
    (itemPath.endsWith('/profile') && currentPath.endsWith('/profile')) ||
    (itemPath === '/profile' && currentPath.endsWith('/profile')) ||
    (itemPath.endsWith('/profile') && currentPath === '/profile')
  ) {
    return true;
  }

  const segments = itemPath.replace(/^\//, '').split('/').filter(Boolean);
  if (segments.length <= 1) {
    return false;
  }

  return currentPath.startsWith(itemPath + '/') || currentPath === itemPath;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  items = [],
  onNavigate,
  onLogout,
  loading = false,
  className,
  mobileOpen = false,
  onMobileClose,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavigate = (path: string) => {
    if (onMobileClose) {
      onMobileClose();
    }
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleLogout = () => {
    if (onMobileClose) {
      onMobileClose();
    }
    if (onLogout) {
      onLogout();
    }
  };

  const renderNavList = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        width: '100%',
        flexGrow: 1,
        mt: 2,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {loading || items.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            py: 4,
          }}
        >
          <CircularProgress size={24} thickness={4} sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
        </Box>
      ) : (
        items.map((item) => {
          const isActive = isNavItemActive(item.path, currentPath);

          return (
            <ButtonBase
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
                width: '100%',
                height: 44,
                px: 1.5,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: isActive ? theme.palette.tints.butter : 'transparent',
                color: isActive ? theme.palette.tokens.rail : theme.palette.tokens.textSecondary,
                transition: 'all 0.15s ease',
                textAlign: 'left',
                '&:hover': {
                  backgroundColor: isActive
                    ? theme.palette.tints.butter
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? theme.palette.tokens.rail : '#FFFFFF',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {getNavIcon(item.iconName)}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexGrow: 1,
                  color: 'inherit',
                }}
              >
                {item.label}
              </Typography>
              {item.badge && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.2,
                    borderRadius: `${theme.customRadii.pill}px`,
                    backgroundColor: theme.palette.tokens.negative,
                    color: theme.palette.tokens.surface,
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    lineHeight: 1.4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 4px ${theme.palette.tokens.negative}4D`,
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </ButtonBase>
          );
        })
      )}
    </Box>
  );

  const renderLogoutButton = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
        pt: 1,
      }}
    >
      <ButtonBase
        onClick={handleLogout}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          width: '100%',
          height: 44,
          px: 1.5,
          borderRadius: `${theme.customRadii.inner}px`,
          backgroundColor: 'transparent',
          color: theme.palette.tokens.textSecondary,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: theme.palette.tokens.negative,
          },
        }}
      >
        <LogoutRoundedIcon fontSize="small" />
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '14px', color: 'inherit' }}>
          Log Out
        </Typography>
      </ButtonBase>
    </Box>
  );

  return (
    <>
      {/* 1. Desktop Permanent Sidebar (md and up) */}
      <Box
        component="aside"
        className={className}
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'fixed',
          top: 16,
          left: 16,
          bottom: 16,
          width: 240,
          height: 'calc(100vh - 32px)',
          '@supports (height: 100dvh)': { height: 'calc(100dvh - 32px)' },
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: '20px 14px',
          zIndex: 1200,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 0.5,
            mb: 1.5,
            cursor: 'pointer',
          }}
          onClick={() => handleNavigate('/')}
        >
          <BrandLogo
            sx={{
              borderRadius: `${theme.customRadii.inner}px`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          />
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                fontSize: '14px',
                letterSpacing: '-0.01em',
              }}
            >
              {branding.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                fontSize: '11px',
                fontWeight: 500,
                display: 'block',
              }}
            >
              Workspace
            </Typography>
          </Box>
        </Box>

        {/* Navigation List */}
        {renderNavList()}

        {/* Logout */}
        {renderLogoutButton()}
      </Box>

      {/* 2. Mobile / Tablet Responsive Side Drawer (below md) */}
      <Drawer
        anchor="left"
        open={Boolean(mobileOpen)}
        onClose={onMobileClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          zIndex: theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': {
            width: 'min(300px, 82vw)',
            boxSizing: 'border-box',
            backgroundColor: theme.palette.tokens.rail,
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 14px',
            boxShadow: '8px 0 32px rgba(0, 0, 0, 0.45)',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            borderTopRightRadius: '20px',
            borderBottomRightRadius: '20px',
            overflow: 'hidden',
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            },
          },
        }}
      >
        {/* Drawer Header with Logo & Close Button */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 0.5,
            pb: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              cursor: 'pointer',
            }}
            onClick={() => handleNavigate('/')}
          >
            <BrandLogo
              sx={{
                borderRadius: `${theme.customRadii.inner}px`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              }}
            />
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  fontSize: '14px',
                  letterSpacing: '-0.01em',
                }}
              >
                {branding.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.tokens.textSecondary,
                  fontSize: '11px',
                  fontWeight: 500,
                  display: 'block',
                }}
              >
                Workspace
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onMobileClose}
            aria-label="Close navigation"
            sx={{
              color: theme.palette.tokens.textSecondary,
              p: 0.75,
              '&:hover': {
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Navigation List */}
        {renderNavList()}

        {/* Logout */}
        {renderLogoutButton()}
      </Drawer>
    </>
  );
};
