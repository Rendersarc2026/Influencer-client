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
import { MoneyText } from '@atoms';

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
        setRateInput(String(influencerRate));
        setMarginInput('0');
        setClientRateInput(String(influencerRate));
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
  const handleRateChange = (val: string) => {
    const numeric = val.replace(/[^0-9.]/g, '');
    setRateInput(numeric);
    if (rateError) setRateError('');

    const r = parseFloat(numeric) || 0;
    const m = parseFloat(marginInput) || 0;
    setClientRateInput(String(r + m));
  };

  // When Margin changes: recalculate Client Rate
  const handleMarginChange = (val: string) => {
    const numeric = val.replace(/[^0-9.]/g, '');
    setMarginInput(numeric);
    if (marginError) setMarginError('');

    const r = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    const m = parseFloat(numeric) || 0;
    setClientRateInput(String(r + m));
  };

  // When Client Rate is typed directly: recalculate Margin (Client Rate - Creator Rate)
  const handleClientRateChange = (val: string) => {
    const numeric = val.replace(/[^0-9.]/g, '');
    setClientRateInput(numeric);

    const cr = parseFloat(numeric) || 0;
    const r = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    const newMargin = Math.max(0, cr - r);
    setMarginInput(String(newMargin));
    if (marginError) setMarginError('');
  };

  const effectiveRate = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
  const marginNum = parseFloat(marginInput) || 0;
  const clientRateNum = parseFloat(clientRateInput) || (effectiveRate + marginNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    if (!hasPresetRate && (!effectiveRate || effectiveRate <= 0)) {
      setRateError('Please enter a valid positive influencer rate');
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
            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.25)',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 1, pt: 1, pb: 0 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Set Margin & Client Rate
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5 }}>
            {influencerName
              ? `For: ${influencerName} · Review the price and set your agency margin to compute the final client rate.`
              : "Review the influencer's price and set your agency margin to compute the final client rate."}
          </Typography>
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
            {/* 1. Influencer Rate Section */}
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
                    Influencer Quoted Rate
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Amount paid to influencer
                  </Typography>
                </Box>
                <MoneyText amount={influencerRate || 0} currency={currency} variant="h3" />
              </Box>
            ) : (
              <TextField
                label="1. Influencer Rate (₹) *"
                type="text"
                value={rateInput}
                onChange={(e) => handleRateChange(e.target.value)}
                placeholder="e.g. 80000"
                error={Boolean(rateError)}
                helperText={rateError || 'Amount paid to the influencer for this deliverable'}
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
              helperText="Total rate billed to the brand (Influencer Rate + Margin)"
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
                  Influencer Payout:
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
