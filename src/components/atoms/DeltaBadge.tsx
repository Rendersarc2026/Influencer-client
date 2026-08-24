import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import SouthEastRoundedIcon from '@mui/icons-material/SouthEastRounded';
import { useTheme } from '@mui/material/styles';

export interface DeltaBadgeProps {
  delta: number;
  label?: string;
  inverted?: boolean;
  size?: 'small' | 'medium';
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = React.memo(({
  delta,
  label,
  inverted = false,
  size = 'small',
}) => {
  const theme = useTheme();

  const isPositive = inverted ? delta <= 0 : delta >= 0;
  const isZero = delta === 0;

  const bgColor = isZero
    ? theme.palette.tokens.fieldBg
    : isPositive
      ? theme.palette.tokens.positiveBg
      : theme.palette.tokens.negativeBg;

  const textColor = isZero
    ? theme.palette.tokens.textSecondary
    : isPositive
      ? theme.palette.tokens.positiveText
      : theme.palette.tokens.negativeText;

  const iconColor = textColor;
  const formattedDelta = `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius: `${theme.customRadii.pill}px`,
        padding: size === 'small' ? '2px 8px' : '4px 12px',
        fontWeight: 600,
        fontSize:
          size === 'small' ? theme.typography.caption.fontSize : theme.typography.body2.fontSize,
      }}
    >
      {!isZero &&
        (isPositive ? (
          <NorthEastRoundedIcon
            sx={{ fontSize: size === 'small' ? '12px' : '14px', color: iconColor }}
          />
        ) : (
          <SouthEastRoundedIcon
            sx={{ fontSize: size === 'small' ? '12px' : '14px', color: iconColor }}
          />
        ))}
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: 'inherit',
          color: 'inherit',
          lineHeight: 1,
        }}
      >
        {formattedDelta}
      </Typography>
      {label && (
        <Typography
          component="span"
          sx={{
            fontWeight: 500,
            fontSize: 'inherit',
            color: 'inherit',
            opacity: 0.85,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
});

DeltaBadge.displayName = 'DeltaBadge';
