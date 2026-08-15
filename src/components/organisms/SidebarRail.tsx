import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
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
      return <AttachMoneyRoundedIcon fontSize="small" />;
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
  className,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;

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
          bottom: 12,
          left: 12,
          right: 12,
          height: 64,
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 16px',
          zIndex: 1200,
        },
      }}
    >
      {/* Top Header Section (Desktop Only) */}
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

      {/* Main Navigation Items */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: { xs: 1, md: 1 },
          alignItems: { xs: 'center', md: 'stretch' },
          justifyContent: { xs: 'space-around', md: 'flex-start' },
          width: '100%',
          flexGrow: { xs: 0, md: 1 },
          mt: { xs: 0, md: 2 },
        }}
      >
        {items.map((item) => {
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
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
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
        })}
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
      </Box>
    </Box>
  );
};


