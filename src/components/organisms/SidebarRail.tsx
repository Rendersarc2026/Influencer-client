import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
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
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { NavItem } from '@routes/navConfig';
import { RailIconButton } from '@atoms';

export interface SidebarRailProps {
  items?: NavItem[];
  activePath?: string; // kept for API compatibility; internal logic uses useLocation
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
 *
 * Rules:
 *  - Exact match always wins.
 *  - Prefix match only when the nav item path is NOT a "root" segment
 *    (i.e. it has more than one path segment like /agency/campaigns).
 *  - For single-segment roots like /brand or /admin we use exact match only
 *    to avoid the home icon lighting up on every sub-page.
 */
function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (currentPath === itemPath) return true;

  // Count the depth of the nav item path
  const segments = itemPath.replace(/^\//, '').split('/').filter(Boolean);
  if (segments.length <= 1) {
    // Root-level nav item (/brand, /agency, /admin, /influencer) — exact only
    return false;
  }

  // Deeper items (/agency/campaigns, /brand/campaigns, etc.) — prefix match
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
        // Desktop floating rail
        [theme.breakpoints.up('md')]: {
          position: 'fixed',
          top: 16,
          left: 16,
          bottom: 16,
          width: 72,
          height: 'calc(100vh - 32px)',
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 0',
          zIndex: 1200,
          boxShadow: 'none',
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
      {/* Top Brand Logo Square (Desktop Only) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: 44,
          height: 44,
          borderRadius: `${theme.customRadii.inner}px`,
          backgroundColor: theme.palette.tints.butter,
          color: theme.palette.tokens.rail,
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '18px',
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onClick={() => onNavigate && onNavigate('/')}
      >
        IM
      </Box>

      {/* Main Navigation Items */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', md: 'column' },
          gap: { xs: 1, md: 1.5 },
          alignItems: 'center',
          justifyContent: { xs: 'space-around', md: 'flex-start' },
          width: '100%',
          flexGrow: { xs: 0, md: 1 },
          mt: { xs: 0, md: 1 },
        }}
      >
        {items.map((item) => {
          const isActive = isNavItemActive(item.path, currentPath);
          return (
            <RailIconButton
              key={item.id}
              icon={getNavIcon(item.iconName)}
              label={item.label}
              active={isActive}
              badgeContent={item.badge}
              onClick={() => onNavigate && onNavigate(item.path)}
            />
          );
        })}
      </Box>

      {/* Logout Pin at Bottom (Desktop & Mobile) */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Tooltip title="Logout" placement="right" arrow>
          <IconButton
            onClick={onLogout}
            sx={{
              width: 44,
              height: 44,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: 'transparent',
              color: theme.palette.tokens.textSecondary,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: theme.palette.tokens.negative,
              },
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
