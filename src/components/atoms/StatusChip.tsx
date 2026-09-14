import React from 'react';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import {
  StatusCategory,
  StatusPerspective,
  getStatusConfig,
  StatusConfig,
  StatusTone,
} from '@utils';

export type { StatusCategory, StatusPerspective };

export interface StatusChipProps {
  category: StatusCategory;
  code: number | null | undefined;
  /**
   * Who is reading this chip. A rate status describes the creator's side and the
   * agency's side of the same step, so the wording follows the screen it sits on
   * — "Pending Approval" on the agency roster is "Under Review" to the creator.
   * Every other category reads the same to everyone and can leave this unset.
   */
  perspective?: StatusPerspective;
  size?: 'small' | 'medium';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  category,
  code,
  perspective,
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
  const config: StatusConfig = getStatusConfig(category, code, perspective) ?? {
    label: code === null || code === undefined ? '—' : `Unknown (${code})`,
    tone: 'neutral',
  };

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
