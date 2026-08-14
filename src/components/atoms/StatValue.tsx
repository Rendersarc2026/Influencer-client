import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface StatValueProps {
  value: string | number;
  label: string;
  valueColor?: string;
  labelColor?: string;
  align?: 'left' | 'center' | 'right';
}

export const StatValue: React.FC<StatValueProps> = ({
  value,
  label,
  valueColor,
  labelColor,
  align = 'left',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: valueColor || theme.palette.tokens.textPrimary,
          lineHeight: 1.1,
          mb: '4px',
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: labelColor || theme.palette.tokens.textSecondary,
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};
