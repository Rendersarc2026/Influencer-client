import React from 'react';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import { StatusCategory, STATUS_CONFIG, StatusConfig, StatusTone } from '@utils';

export type { StatusCategory };

export interface StatusChipProps {
  category: StatusCategory;
  code: number | null | undefined;
  size?: 'small' | 'medium';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  category,
  code,
  size = 'small',
  className,
}) => {
  const theme = useTheme();

  const tones: Record<StatusTone, { bg: string; color: string }> = {
    neutral: { bg: theme.palette.tokens.fieldBg, color: theme.palette.tokens.textSecondary },
    progress: { bg: theme.palette.tokens.accentBg, color: theme.palette.tokens.accentText },
    warning: { bg: theme.palette.tokens.warningBg, color: theme.palette.tokens.warningText },
    positive: { bg: theme.palette.tokens.positiveBg, color: theme.palette.tokens.positiveText },
    negative: { bg: theme.palette.tokens.negativeBg, color: theme.palette.tokens.negativeText },
  };

  // An unset or out-of-range code should still render something a human can act
  // on, rather than an empty chip that looks like a layout bug.
  const config: StatusConfig =
    code !== null && code !== undefined && STATUS_CONFIG[category][code]
      ? STATUS_CONFIG[category][code]
      : { label: code === null || code === undefined ? '—' : `Unknown (${code})`, tone: 'neutral' };

  const palette = tones[config.tone];

  return (
    <Chip
      label={config.label}
      size={size}
      className={className}
      sx={{
        backgroundColor: palette.bg,
        color: palette.color,
        fontWeight: 600,
        borderRadius: `${theme.customRadii.pill}px`,
        border: 'none',
        height: size === 'small' ? '24px' : '30px',
        fontSize:
          size === 'small' ? theme.typography.caption.fontSize : theme.typography.body2.fontSize,
      }}
    />
  );
};
