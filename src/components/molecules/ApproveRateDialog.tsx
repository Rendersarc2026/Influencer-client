import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { MoneyText, SectionHeading } from '@atoms';

export interface ApproveRateDialogProps {
  open: boolean;
  mapperId: string;
  influencerName?: string;
  influencerRate?: number | null;
  currency?: string;
  loading?: boolean;
  onApprove: (mapperId: string, margin: number, influencerRate?: number) => Promise<void> | void;
  onClose: () => void;
}

export const ApproveRateDialog: React.FC<ApproveRateDialogProps> = ({
  open,
  mapperId,
  influencerName,
  influencerRate,
  currency = 'INR',
  loading = false,
  onApprove,
  onClose,
}) => {
  const theme = useTheme();
  const [rateInput, setRateInput] = useState<string>('');
  const [marginInput, setMarginInput] = useState<string>('0');
  const [clientRateInput, setClientRateInput] = useState<string>('0');
  const [rateError, setRateError] = useState('');
  const [marginError, setMarginError] = useState('');

  const hasPresetRate =
    influencerRate !== null && influencerRate !== undefined && influencerRate > 0;

  useEffect(() => {
    if (open) {
      if (hasPresetRate) {
        const baseRate = influencerRate || 0;
        const defaultMargin = Math.round(baseRate * 0.2);
        setRateInput(String(baseRate));
        setMarginInput(String(defaultMargin));
        setClientRateInput(String(baseRate + defaultMargin));
      } else {
        setRateInput('');
        setMarginInput('0');
        setClientRateInput('0');
      }
      setRateError('');
      setMarginError('');
    }
  }, [open, influencerRate, hasPresetRate]);

  // When Creator Rate changes: recalculate Client Rate
  const handleRateChange = (newRateStr: string) => {
    const sanitized = newRateStr.replace(/[^0-9.]/g, '');
    setRateInput(sanitized);
    setRateError('');
    const rateVal = parseFloat(sanitized) || 0;
    const marginVal = parseFloat(marginInput) || 0;
    setClientRateInput(String(rateVal + marginVal));
  };

  // When Margin changes: recalculate Client Rate
  const handleMarginChange = (newMarginStr: string) => {
    const sanitized = newMarginStr.replace(/[^0-9.]/g, '');
    setMarginInput(sanitized);
    setMarginError('');
    const rateVal = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    const marginVal = parseFloat(sanitized) || 0;
    setClientRateInput(String(rateVal + marginVal));
  };

  // When Client Rate is typed directly: recalculate Margin (Client Rate - Creator Rate)
  const handleClientRateChange = (newClientRateStr: string) => {
    const sanitized = newClientRateStr.replace(/[^0-9.]/g, '');
    setClientRateInput(sanitized);
    setMarginError('');
    const clientVal = parseFloat(sanitized) || 0;
    const rateVal = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    const calculatedMargin = Math.max(0, clientVal - rateVal);
    setMarginInput(String(calculatedMargin));
  };

  const effectiveRate = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
  const marginNum = parseFloat(marginInput) || 0;
  const clientRateNum = parseFloat(clientRateInput) || (effectiveRate + marginNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!hasPresetRate && (!effectiveRate || effectiveRate <= 0)) {
      setRateError('Please enter a valid positive creator price');
      hasErr = true;
    }

    if (marginNum < 0) {
      setMarginError('Margin cannot be negative');
      hasErr = true;
    }

    if (hasErr) return;

    setRateError('');
    setMarginError('');
    await onApprove(mapperId, marginNum, !hasPresetRate ? effectiveRate : undefined);
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '16px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1, px: 1 }}>
          <SectionHeading
            title="Approve Rate & Set Margin"
            subtitle={
              influencerName ? `For: ${influencerName}` : 'Set agency margin before forwarding to brand'
            }
          />
        </DialogTitle>

        <DialogContent
          sx={{
            px: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* 1. Creator Rate Section */}
            {hasPresetRate ? (
              <Box
                sx={{
                  padding: '14px 16px',
                  backgroundColor: theme.palette.tokens.fieldBg,
                  borderRadius: `${theme.customRadii.inner}px`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}>
                    Creator Quoted Rate
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Amount paid to creator
                  </Typography>
                </Box>
                <MoneyText amount={influencerRate || 0} currency={currency} variant="h3" />
              </Box>
            ) : (
              <TextField
                label="1. Creator Price / Influencer Rate (₹) *"
                type="text"
                value={rateInput}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="e.g. 80000"
                error={Boolean(rateError)}
                helperText={rateError || 'Amount paid to the creator for this deliverable'}
                fullWidth
                disabled={loading}
              />
            )}

            {/* 2. Agency Margin Input */}
            <TextField
              label="2. Agency Margin (₹) *"
              type="text"
              value={marginInput}
              onChange={(e) => handleMarginChange(e.target.value)}
              placeholder="e.g. 20000"
              error={Boolean(marginError)}
              helperText={marginError || 'Agency markup earned on this deliverable'}
              fullWidth
              disabled={loading}
            />

            {/* 3. Direct Client Rate Input (Auto-synced) */}
            <TextField
              label="3. Final Client Rate to Brand (₹) *"
              type="text"
              value={clientRateInput}
              onChange={(e) => handleClientRateChange(e.target.value)}
              placeholder="e.g. 100000"
              helperText="Total rate billed to the brand (Creator Rate + Margin)"
              fullWidth
              disabled={loading}
            />

            <Divider sx={{ my: 0.5 }} />

            {/* Live Pricing Breakdown Card */}
            <Box
              sx={{
                padding: '16px 18px',
                backgroundColor: theme.palette.tints.mint,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Creator Payout:
                </Typography>
                <MoneyText amount={effectiveRate} currency={currency} variant="body2" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Agency Margin:
                </Typography>
                <MoneyText amount={marginNum} currency={currency} variant="body2" />
              </Box>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(0,0,0,0.08)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText }}
                  >
                    Billed to Brand (Client Rate)
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.positiveText, opacity: 0.85 }}
                  >
                    Only price visible to Brand upon approval
                  </Typography>
                </Box>
                <MoneyText
                  amount={clientRateNum}
                  currency={currency}
                  variant="h2"
                  color={theme.palette.tokens.positiveText}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, px: 1, pt: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isNaN(marginNum) || marginNum < 0 || effectiveRate <= 0}
            sx={{ minWidth: 160 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Approve & Send to Brand'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
