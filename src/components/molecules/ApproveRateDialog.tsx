import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { MoneyText, SectionHeading } from '@atoms';

export interface ApproveRateDialogProps {
  open: boolean;
  mapperId: string;
  influencerName?: string;
  influencerRate: number;
  currency?: string;
  loading?: boolean;
  onApprove: (mapperId: string, margin: number) => Promise<void> | void;
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
  const [marginInput, setMarginInput] = useState<string>('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      // Default initial margin to 20% of submitted rate or 0
      const defaultMargin = Math.round(influencerRate * 0.2);
      setMarginInput(String(defaultMargin));
      setError('');
    }
  }, [open, influencerRate]);

  const marginNum = parseFloat(marginInput) || 0;
  // LIVE PREVIEW: Display-only calculation in UI. Never sent as clientRate to server.
  const liveClientRatePreview = influencerRate + marginNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(marginNum) || marginNum < 0) {
      setError('Please enter a valid non-negative margin amount');
      return;
    }
    setError('');
    // Sends ONLY mapperId and margin; server computes & persists client_rate in a single transaction
    await onApprove(mapperId, marginNum);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '12px',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <SectionHeading
            title="Approve Rate & Set Margin"
            subtitle={
              influencerName
                ? `Influencer: ${influencerName}`
                : 'Set agency margin for brand client rate'
            }
          />
        </DialogTitle>

        <DialogContent sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Submitted Influencer Rate */}
            <Box
              sx={{
                padding: '14px 18px',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Submitted Influencer Rate
              </Typography>
              <MoneyText amount={influencerRate} currency={currency} variant="h3" />
            </Box>

            {/* Margin Input */}
            <TextField
              label="Agency Margin (₹) *"
              type="number"
              value={marginInput}
              onChange={(e) => setMarginInput(e.target.value)}
              placeholder="e.g. 5000"
              error={Boolean(error)}
              helperText={error || 'Margin added to influencer rate'}
              fullWidth
              autoFocus
              disabled={loading}
            />

            {/* Live Client Rate Preview Card */}
            <Box
              sx={{
                padding: '16px 18px',
                backgroundColor: theme.palette.tints.mint,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: theme.palette.tokens.positiveText }}
                >
                  Resulting Client Rate (Live Preview)
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.tokens.positiveText, opacity: 0.85 }}
                >
                  Visible to brand upon approval
                </Typography>
              </Box>
              <MoneyText
                amount={liveClientRatePreview}
                currency={currency}
                variant="h2"
                color={theme.palette.tokens.positiveText}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ pt: 3, pb: 1, px: 2, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isNaN(marginNum) || marginNum < 0}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Approve Rate'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
