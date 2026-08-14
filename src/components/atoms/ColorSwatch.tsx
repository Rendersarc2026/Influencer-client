import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface ColorSwatchProps {
  name: string;
  hex: string;
  bg: string;
  textColor?: string;
  hasBorder?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  name,
  hex,
  bg,
  textColor,
  hasBorder,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: `${theme.customRadii.inner}px`,
        backgroundColor: theme.palette.tokens.surface,
        border: `1px solid ${theme.palette.tokens.divider}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          height: 72,
          backgroundColor: bg,
          borderBottom: hasBorder ? `1px solid ${theme.palette.tokens.divider}` : 'none',
        }}
      />
      <Box sx={{ padding: '12px 16px' }}>
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, color: textColor || theme.palette.text.primary }}
        >
          {name}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {hex}
        </Typography>
      </Box>
    </Box>
  );
};
