import React from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface MoneyTextProps {
  amount: string | number | null | undefined;
  currency?: string;
  compact?: boolean;
  variant?: TypographyProps['variant'];
  fontWeight?: number;
  color?: string;
  className?: string;
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

function formatMoneyValue(val: number, currency: string, compact: boolean): string {
  if (compact) {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)}Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    if (val >= 1000) {
      return `₹${(val / 1000).toFixed(1)}K`;
    }
  }
  return getCurrencyFormatter(currency).format(val);
}

export const MoneyText: React.FC<MoneyTextProps> = React.memo(
  ({
    amount,
    currency = 'INR',
    compact = false,
    variant = 'body1',
    fontWeight = 600,
    color,
    className,
  }) => {
    const theme = useTheme();

    if (amount === null || amount === undefined || amount === '') {
      return (
        <Typography
          variant={variant}
          className={className}
          sx={{ color: color || theme.palette.tokens.textSecondary, fontWeight }}
        >
          —
        </Typography>
      );
    }

    const numVal = typeof amount === 'number' ? amount : parseFloat(amount);

    if (isNaN(numVal)) {
      return (
        <Typography
          variant={variant}
          className={className}
          sx={{ color: color || theme.palette.tokens.textPrimary, fontWeight }}
        >
          {amount}
        </Typography>
      );
    }

    return (
      <Typography
        variant={variant}
        className={className}
        sx={{
          color: color || theme.palette.tokens.textPrimary,
          fontWeight,
        }}
      >
        {formatMoneyValue(numVal, currency, compact)}
      </Typography>
    );
  },
);

MoneyText.displayName = 'MoneyText';
