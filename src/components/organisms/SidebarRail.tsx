import React, { ReactNode, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Skeleton from '@mui/material/Skeleton';
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
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { NavItem } from '@routes/navConfig';
import { RailIconButton } from '@atoms';

export interface SidebarRailProps {
  items?: NavItem[];
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  loading?: boolean;
  className?: string;
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
    (itemPath === '/influencer/profile' && currentPath === '/profile') ||
    (itemPath === '/profile' && currentPath === '/influencer/profile')
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
}) => {
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

  // The mobile bar scrolls sideways once a role has more items than fit. The
  // active one is often past the fold — for the chat item at the end of the
  // agency's list, nothing on screen said which page you were on.
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [currentPath]);

  return (
    <Box
      component="aside"
      className={className}
      sx={{
        // Desktop permanent expanded sidebar
        [theme.breakpoints.up('md')]: {
          position: 'fixed',
          top: 16,
          left: 16,
          bottom: 16,
          width: 240,
          height: 'calc(100vh - 32px)',
          '@supports (height: 100dvh)': { height: 'calc(100dvh - 32px)' },
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          padding: '20px 14px',
          zIndex: 1200,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
          overflow: 'hidden',
        },
        // Mobile & Tablet bottom bar
        [theme.breakpoints.down('md')]: {
          position: 'fixed',
          bottom: { xs: 'calc(8px + env(safe-area-inset-bottom, 0px))', sm: 12 },
          left: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          height: { xs: 60, sm: 66 },
          backgroundColor: 'rgba(16, 17, 20, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: { xs: '20px', sm: `${theme.customRadii.rail}px` },
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: { xs: '0 8px', sm: '0 12px' },
          zIndex: 1200,
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        },
      }}
    >
      {/* Top Header Section (Desktop Only) */}
      {loading ? (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.25,
            px: 0.5,
            mb: 1.5,
          }}
        >
          <Skeleton
            variant="rounded"
            width={36}
            height={36}
            animation="wave"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: `${theme.customRadii.inner}px`,
              flexShrink: 0,
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Skeleton
              variant="rounded"
              width={96}
              height={14}
              animation="wave"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px' }}
            />
            <Skeleton
              variant="rounded"
              width={56}
              height={10}
              animation="wave"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px' }}
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.25,
            px: 0.5,
            mb: 1.5,
            cursor: 'pointer',
          }}
          onClick={() => onNavigate && onNavigate('/')}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tints.butter,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StarRoundedIcon sx={{ fontSize: '20px', color: theme.palette.tokens.rail }} />
          </Box>
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
              Influencer Hub
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                lineHeight: 1,
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              Workspace
            </Typography>
          </Box>
        </Box>
      )}

      {/* Main Navigation Items */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: { xs: 0.5, sm: 1, md: 1 },
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', md: 'flex-start' },
          width: { xs: 'max-content', md: '100%' },
          minWidth: { xs: '100%', md: 'auto' },
          flexGrow: { xs: 0, md: 1 },
          mt: { xs: 0, md: 2 },
        }}
      >
        {loading || items.length === 0 ? (
          <>
            {/* Desktop Shimmer Items */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                gap: 1,
                width: '100%',
              }}
            >
              {[1, 2, 3, 4].map((k) => (
                <Box
                  key={k}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    width: '100%',
                    height: 44,
                    px: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Skeleton
                    variant="circular"
                    width={20}
                    height={20}
                    animation="wave"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={`${50 + (k % 3) * 18}%`}
                    height={14}
                    animation="wave"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.07)', borderRadius: '4px' }}
                  />
                </Box>
              ))}
            </Box>
            {/* Mobile Shimmer Icons */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
              {[1, 2, 3, 4].map((k) => (
                <Skeleton
                  key={k}
                  variant="rounded"
                  width={40}
                  height={40}
                  animation="wave"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.07)',
                    borderRadius: '12px',
                    flexShrink: 0,
                  }}
                />
              ))}
            </Box>
          </>
        ) : (
          items.map((item) => {
            const isActive = isNavItemActive(item.path, currentPath);

            return (
              <React.Fragment key={item.id}>
                {/* Desktop full-width item */}
                <Box sx={{ display: { xs: 'none', md: 'block' }, width: '100%' }}>
                  <ButtonBase
                    onClick={() => onNavigate && onNavigate(item.path)}
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
                          backgroundColor: isActive
                            ? theme.palette.tokens.rail
                            : theme.palette.tints.butter,
                          color: isActive ? '#FFFFFF' : theme.palette.tokens.rail,
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </Box>
                    )}
                  </ButtonBase>
                </Box>

                {/* Mobile icon item */}
                <Box
                  ref={isActive ? activeItemRef : undefined}
                  sx={{ display: { xs: 'block', md: 'none' } }}
                >
                  <RailIconButton
                    icon={getNavIcon(item.iconName)}
                    label={item.label}
                    active={isActive}
                    badgeContent={item.badge}
                    onClick={() => onNavigate && onNavigate(item.path)}
                  />
                </Box>
              </React.Fragment>
            );
          })
        )}
      </Box>

      {/* Logout Pin at Bottom */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          width: '100%',
          flexShrink: 0,
        }}
      >
        {loading ? (
          <Skeleton
            variant="rounded"
            width="100%"
            height={44}
            animation="wave"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: `${theme.customRadii.inner}px`,
            }}
          />
        ) : (
          <ButtonBase
            onClick={onLogout}
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
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontSize: '14px', color: 'inherit' }}
            >
              Log Out
            </Typography>
          </ButtonBase>
        )}
      </Box>
    </Box>
  );
};


