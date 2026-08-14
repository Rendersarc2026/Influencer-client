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
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
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
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onProfileClick,
  onSettingsClick,
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

  return (
    <Box className={className}>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          padding: '6px 12px 6px 6px',
          borderRadius: `${theme.customRadii.pill}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: theme.palette.tokens.fieldBg,
          },
        }}
      >
        <Avatar
          src={safeImageUrl(user.avatarUrl)}
          sx={{
            width: 32,
            height: 32,
            backgroundColor: theme.palette.tokens.accentBg,
            color: theme.palette.tokens.accentText,
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </Avatar>

        <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary, lineHeight: 1.2 }}
          >
            {user.name}
          </Typography>
          {user.roleCode && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', fontSize: '11px' }}
            >
              {user.roleCode}
            </Typography>
          )}
        </Box>

        <KeyboardArrowDownRoundedIcon
          sx={{
            color: theme.palette.tokens.textSecondary,
            fontSize: '18px',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
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
            sx: {
              borderRadius: `${theme.customRadii.inner}px`,
              border: `1px solid ${theme.palette.tokens.divider}`,
              minWidth: 200,
              padding: '6px 0',
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ padding: '8px 16px 10px 16px' }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          {user.email && (
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              {user.email}
            </Typography>
          )}
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            handleClose();
            if (onProfileClick) onProfileClick();
          }}
          sx={{ fontSize: '14px', py: 1 }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textPrimary, minWidth: '32px' }}>
            <PersonOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleClose();
            if (onSettingsClick) onSettingsClick();
          }}
          sx={{ fontSize: '14px', py: 1 }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textPrimary, minWidth: '32px' }}>
            <SettingsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            handleClose();
            if (onLogoutClick) onLogoutClick();
          }}
          sx={{ fontSize: '14px', py: 1, color: theme.palette.tokens.negative }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: '32px' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};
