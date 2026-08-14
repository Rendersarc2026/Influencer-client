import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export interface IconSquareProps {
  icon: ReactNode;
  bg?: string;
  color?: string;
  size?: number;
  radius?: number;
}

export const IconSquare: React.FC<IconSquareProps> = ({ icon, bg, color, size = 44, radius }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${radius ?? theme.customRadii.inner}px`,
        backgroundColor: bg || theme.palette.tokens.fieldBg,
        color: color || theme.palette.tokens.textPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
  );
};
