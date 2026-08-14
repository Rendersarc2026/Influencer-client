import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface PillProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  count?: number | string;
  icon?: ReactNode;
}

export const Pill: React.FC<PillProps> = ({ label, selected = false, onClick, count, icon }) => {
  const theme = useTheme();

  return (
    <Box
      component="button"
      onClick={onClick}
      type="button"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '32px',
        padding: '0 14px',
        borderRadius: `${theme.customRadii.pill}px`,
        backgroundColor: selected ? theme.palette.tokens.rail : theme.palette.tokens.fieldBg,
        color: selected ? '#FFFFFF' : theme.palette.tokens.textPrimary,
        border: 'none',
        outline: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        fontWeight: 600,
        fontSize: theme.typography.body2.fontSize,
        '&:hover': {
          backgroundColor: selected ? '#2D2E30' : theme.palette.tokens.divider,
        },
      }}
    >
      {icon && <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>{icon}</Box>}
      <Typography
        component="span"
        sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}
      >
        {label}
      </Typography>
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '18px',
            height: '18px',
            padding: '0 5px',
            borderRadius: `${theme.customRadii.pill}px`,
            backgroundColor: selected ? 'rgba(255, 255, 255, 0.2)' : theme.palette.tokens.divider,
            color: selected ? '#FFFFFF' : theme.palette.tokens.textSecondary,
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
};
