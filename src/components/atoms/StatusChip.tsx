import React from 'react';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';

export interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
  className?: string;
}

interface StatusConfig {
  label: string;
  bg: string;
  color: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small', className }) => {
  const theme = useTheme();

  const getStatusConfig = (rawStatus: string): StatusConfig => {
    const key = rawStatus.toUpperCase().trim();

    switch (key) {
      // Rate Statuses
      case 'PENDING_SUBMISSION':
        return {
          label: 'Pending Submission',
          bg: theme.palette.tokens.warningBg,
          color: theme.palette.tokens.warningText,
        };
      case 'SUBMITTED':
        return {
          label: 'Submitted',
          bg: theme.palette.tokens.accentBg,
          color: theme.palette.tokens.accentText,
        };
      case 'AGENCY_APPROVED':
        return {
          label: 'Agency Approved',
          bg: theme.palette.tokens.positiveBg,
          color: theme.palette.tokens.positiveText,
        };
      case 'REVISION_REQUESTED':
        return {
          label: 'Revision Requested',
          bg: theme.palette.tokens.purpleBg,
          color: theme.palette.tokens.purpleText,
        };

      // Brand Statuses
      case 'NOT_VISIBLE':
        return {
          label: 'Not Visible',
          bg: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textSecondary,
        };
      case 'PENDING_REVIEW':
        return {
          label: 'Pending Review',
          bg: theme.palette.tokens.warningBg,
          color: theme.palette.tokens.warningText,
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          bg: theme.palette.tokens.positiveBg,
          color: theme.palette.tokens.positiveText,
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          bg: theme.palette.tokens.negativeBg,
          color: theme.palette.tokens.negativeText,
        };
      case 'CORRECTION_REQUESTED':
        return {
          label: 'Correction Requested',
          bg: theme.palette.tokens.purpleBg,
          color: theme.palette.tokens.purpleText,
        };

      // Payment Statuses
      case 'PENDING':
        return {
          label: 'Pending',
          bg: theme.palette.tokens.warningBg,
          color: theme.palette.tokens.warningText,
        };
      case 'PAID':
        return {
          label: 'Paid',
          bg: theme.palette.tokens.positiveBg,
          color: theme.palette.tokens.positiveText,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: theme.palette.tokens.negativeBg,
          color: theme.palette.tokens.negativeText,
        };

      // General / Campaign
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: theme.palette.tokens.positiveBg,
          color: theme.palette.tokens.positiveText,
        };
      case 'DRAFT':
        return {
          label: 'Draft',
          bg: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textSecondary,
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: theme.palette.tokens.accentBg,
          color: theme.palette.tokens.accentText,
        };
      case 'ARCHIVED':
        return {
          label: 'Archived',
          bg: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textSecondary,
        };
      case 'DEACTIVATED':
        return {
          label: 'Deactivated',
          bg: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textSecondary,
        };

      default:
        return {
          label: rawStatus.replace(/_/g, ' '),
          bg: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textPrimary,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      size={size}
      className={className}
      sx={{
        backgroundColor: config.bg,
        color: config.color,
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
