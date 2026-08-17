import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useTheme } from '@mui/material/styles';
import { UserMenu } from '@molecules';

/**
 * One step in the trail above a page title. A crumb without `onClick` is the
 * current page — rendered as plain text rather than a dead link.
 */
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface TopBarProps {
  title: string;
  subtitle?: string;
  /**
   * Trail shown above the title. The current page is appended automatically
   * from `title`, so pass only its ancestors.
   */
  breadcrumbs?: BreadcrumbItem[];
  /** Renders a back control to the left of the title. */
  onBack?: () => void;
  backLabel?: string;
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
  breadcrumbs,
  onBack,
  backLabel = 'Back',
  user = { name: 'User', roleCode: 'AGENCY' },
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
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        padding: { xs: '14px 16px', sm: '18px 20px', md: '24px 24px 20px 24px' },
        borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        borderTopLeftRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
        borderTopRightRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
        gap: 1.5,
      }}
    >
      {/* Left: back control, breadcrumb trail, title and subtitle */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, minWidth: 0 }}>
        {onBack && (
          <Tooltip title={backLabel}>
            <IconButton
              onClick={onBack}
              aria-label={backLabel}
              sx={{
                // Nudged down so the arrow optically centres on the title line
                // rather than on the whole block once crumbs are present.
                mt: breadcrumbs?.length ? '20px' : '2px',
                flexShrink: 0,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ minWidth: 0 }}>
          {Boolean(breadcrumbs?.length) && (
            <Breadcrumbs
              separator={<NavigateNextRoundedIcon sx={{ fontSize: 16 }} />}
              aria-label="breadcrumb"
              sx={{
                mb: '2px',
                '& .MuiBreadcrumbs-separator': { mx: 0.5 },
                color: theme.palette.tokens.textSecondary,
              }}
            >
              {breadcrumbs!.map((crumb, i) =>
                crumb.onClick ? (
                  <Link
                    key={`${crumb.label}-${i}`}
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={crumb.onClick}
                    sx={{
                      font: 'inherit',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: theme.palette.tokens.textSecondary,
                      cursor: 'pointer',
                      '&:hover': { color: theme.palette.tokens.textPrimary },
                    }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <Typography
                    key={`${crumb.label}-${i}`}
                    variant="caption"
                    sx={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    {crumb.label}
                  </Typography>
                ),
              )}
              <Typography
                variant="caption"
                sx={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.palette.tokens.textPrimary,
                }}
              >
                {title}
              </Typography>
            </Breadcrumbs>
          )}

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '20px', sm: '24px', md: '32px' },
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.tokens.textSecondary,
                mt: '4px',
                fontSize: { xs: '12px', sm: '13px' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
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
