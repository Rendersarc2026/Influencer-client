import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useTheme } from '@mui/material/styles';
import { safeImageUrl } from '@utils';

export interface UserMenuProps {
  user: {
    name: string;
    email?: string;
    roleCode?: string;
    avatarUrl?: string;
  };
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onProfileClick,
  onLogoutClick,
  className,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const initials = (user.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const roleLabel =
    user.roleCode === 'INFLUENCER'
      ? 'Influencer'
      : user.roleCode === 'BRAND'
      ? 'Brand'
      : user.roleCode === 'AGENCY'
      ? 'Agency'
      : user.roleCode || '';

  return (
    <Box className={className}>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1.25 },
          padding: { xs: '2px 4px 2px 2px', sm: '5px 12px 5px 6px' },
          borderRadius: `${theme.customRadii.pill}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${open ? theme.palette.primary.main : theme.palette.tokens.divider}`,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open
            ? `0 0 0 3px rgba(37, 99, 235, 0.12)`
            : '0 1px 3px rgba(0, 0, 0, 0.04)',
          '&:hover': {
            backgroundColor: theme.palette.tokens.fieldBg,
            borderColor: open ? theme.palette.primary.main : 'rgba(0,0,0,0.15)',
          },
        }}
      >
        <Avatar
          src={safeImageUrl(user.avatarUrl)}
          sx={{
            width: { xs: 26, sm: 34 },
            height: { xs: 26, sm: 34 },
            backgroundColor: theme.palette.tokens.accentBg,
            color: theme.palette.tokens.accentText,
            fontWeight: 700,
            fontSize: { xs: '11px', sm: '13px' },
            border: `1.5px solid #ffffff`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left', minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: theme.palette.tokens.textPrimary,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 140,
            }}
          >
            {user.name}
          </Typography>
          {roleLabel && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              {roleLabel}
            </Typography>
          )}
        </Box>

        <KeyboardArrowDownRoundedIcon
          sx={{
            color: theme.palette.tokens.textSecondary,
            fontSize: { xs: '14px', sm: '18px' },
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            ml: { xs: 0, sm: 0.25 },
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: '16px',
              border: `1px solid ${theme.palette.tokens.divider}`,
              minWidth: 230,
              padding: '6px',
              mt: 1.25,
              boxShadow:
                '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* User Identity Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            mb: 0.5,
            borderRadius: '12px',
            backgroundColor: 'rgba(241, 245, 249, 0.65)',
          }}
        >
          <Avatar
            src={safeImageUrl(user.avatarUrl)}
            sx={{
              width: 38,
              height: 38,
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 650,
                color: theme.palette.tokens.textPrimary,
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.name}
            </Typography>
            {user.email && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.tokens.textSecondary,
                  display: 'block',
                  fontSize: '11.5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mt: 0.25,
                }}
              >
                {user.email}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 0.75, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

        {/* Profile Item */}
        <MenuItem
          onClick={() => {
            handleClose();
            if (onProfileClick) onProfileClick();
          }}
          sx={{
            fontSize: '13.5px',
            fontWeight: 500,
            py: 1,
            px: 1.5,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: theme.palette.tokens.textPrimary,
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textSecondary, minWidth: 'auto' }}>
            <PersonOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>

        <Divider sx={{ my: 0.75, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

        {/* Logout Item */}
        <MenuItem
          onClick={() => {
            handleClose();
            if (onLogoutClick) onLogoutClick();
          }}
          sx={{
            fontSize: '13.5px',
            fontWeight: 500,
            py: 1,
            px: 1.5,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: theme.palette.tokens.negative,
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              color: theme.palette.tokens.negative,
            },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: 'auto' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};
