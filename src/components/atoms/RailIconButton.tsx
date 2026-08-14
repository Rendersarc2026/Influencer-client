import React, { ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';

export interface RailIconButtonProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badgeContent?: ReactNode;
}

export const RailIconButton: React.FC<RailIconButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
  badgeContent,
}) => {
  const theme = useTheme();

  return (
    <Tooltip title={label} placement="right" arrow>
      <IconButton
        onClick={onClick}
        sx={{
          width: 44,
          height: 44,
          borderRadius: `${theme.customRadii.inner}px`,
          backgroundColor: active ? theme.palette.tints.butter : 'transparent',
          color: active ? theme.palette.tokens.rail : theme.palette.tokens.textSecondary,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: active ? theme.palette.tints.butter : 'rgba(255, 255, 255, 0.12)',
            color: active ? theme.palette.tokens.rail : '#FFFFFF',
          },
        }}
      >
        {badgeContent ? (
          <Badge badgeContent={badgeContent} color="primary">
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </IconButton>
    </Tooltip>
  );
};
