import React from 'react';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import {
  EnumCategory,
  CampaignStatusCode,
  RateStatusCode,
  BrandStatusCode,
  PaymentStatusCode,
} from '@contracts';

/**
 * A status is a code, and a code only means something next to its category —
 * RATE_STATUS 1 is "Pending Submission" while CAMPAIGN_STATUS 1 is "Draft". So
 * the chip takes both, and looks the pair up in one table.
 *
 * The labels live here rather than coming from the /enums registry on the wire:
 * the registry carries symbolic names (AGENCY_APPROVED), not the sentence case a
 * user should read, and a chip should not wait on a network round trip to render.
 */
export type StatusCategory = Extract<
  EnumCategory,
  'CAMPAIGN_STATUS' | 'RATE_STATUS' | 'BRAND_STATUS' | 'PAYMENT_STATUS'
>;

export interface StatusChipProps {
  category: StatusCategory;
  code: number | null | undefined;
  size?: 'small' | 'medium';
  className?: string;
}

/** Which palette a status should read as, independent of its wording. */
type Tone = 'neutral' | 'progress' | 'warning' | 'positive' | 'negative';

interface StatusConfig {
  label: string;
  tone: Tone;
}

const STATUS_CONFIG: Record<StatusCategory, Record<number, StatusConfig>> = {
  CAMPAIGN_STATUS: {
    [CampaignStatusCode.DRAFT]: { label: 'Draft', tone: 'neutral' },
    [CampaignStatusCode.ACTIVE]: { label: 'Active', tone: 'positive' },
    [CampaignStatusCode.COMPLETED]: { label: 'Completed', tone: 'progress' },
    [CampaignStatusCode.CANCELLED]: { label: 'Cancelled', tone: 'negative' },
  },
  RATE_STATUS: {
    [RateStatusCode.PENDING_SUBMISSION]: { label: 'Pending Submission', tone: 'warning' },
    [RateStatusCode.SUBMITTED]: { label: 'Submitted', tone: 'progress' },
    [RateStatusCode.REVISION_REQUESTED]: { label: 'Revision Requested', tone: 'warning' },
    [RateStatusCode.AGENCY_APPROVED]: { label: 'Agency Approved', tone: 'positive' },
  },
  BRAND_STATUS: {
    [BrandStatusCode.NOT_VISIBLE]: { label: 'Draft Proposal', tone: 'neutral' },
    [BrandStatusCode.PENDING_REVIEW]: { label: 'Pending Review', tone: 'warning' },
    [BrandStatusCode.CORRECTION_REQUESTED]: { label: 'Correction Requested', tone: 'warning' },
    [BrandStatusCode.APPROVED]: { label: 'Approved', tone: 'positive' },
    [BrandStatusCode.REJECTED]: { label: 'Rejected', tone: 'negative' },
  },
  PAYMENT_STATUS: {
    [PaymentStatusCode.NOT_RAISED]: { label: 'Not Raised', tone: 'neutral' },
    [PaymentStatusCode.PENDING_APPROVAL]: { label: 'Pending Approval', tone: 'warning' },
    [PaymentStatusCode.APPROVED]: { label: 'Approved', tone: 'positive' },
    [PaymentStatusCode.REJECTED]: { label: 'Rejected', tone: 'negative' },
  },
};

export const StatusChip: React.FC<StatusChipProps> = ({
  category,
  code,
  size = 'small',
  className,
}) => {
  const theme = useTheme();

  const tones: Record<Tone, { bg: string; color: string }> = {
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
