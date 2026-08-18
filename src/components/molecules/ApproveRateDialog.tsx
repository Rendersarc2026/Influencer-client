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
  initialDeliverables?: string | null;
  initialPreEvalEr?: number | null;
  initialBrandFit?: string | null;
  initialCommittedViews?: number | null;
  onApprove: (
    mapperId: string,
    params: {
      margin: number;
      influencerRate?: number;
      committedViews?: number;
      preEvalEr?: number;
      brandFit?: string;
      deliverables?: string;
    },
  ) => Promise<void> | void;
  onClose: () => void;
}

export const ApproveRateDialog: React.FC<ApproveRateDialogProps> = ({
  open,
  mapperId,
  influencerName,
  influencerRate,
  currency = 'INR',
  loading = false,
  initialDeliverables,
  initialPreEvalEr,
  initialBrandFit,
  initialCommittedViews,
  onApprove,
  onClose,
}) => {
  const theme = useTheme();
  const [rateInput, setRateInput] = useState<string>('');
  const [marginInput, setMarginInput] = useState<string>('0');
  const [clientRateInput, setClientRateInput] = useState<string>('0');
  const [deliverablesInput, setDeliverablesInput] = useState<string>('');
  const [preEvalErInput, setPreEvalErInput] = useState<string>('');
  const [committedViewsInput, setCommittedViewsInput] = useState<string>('');
  const [brandFitInput, setBrandFitInput] = useState<string>('');
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
      setDeliverablesInput(initialDeliverables || '');
      setPreEvalErInput(initialPreEvalEr !== null && initialPreEvalEr !== undefined ? String(initialPreEvalEr) : '');
      setCommittedViewsInput(initialCommittedViews !== null && initialCommittedViews !== undefined ? String(initialCommittedViews) : '');
      setBrandFitInput(initialBrandFit || '');
      setRateError('');
      setMarginError('');
    }
  }, [open, influencerRate, hasPresetRate, initialDeliverables, initialPreEvalEr, initialBrandFit, initialCommittedViews]);

  const handleRateChange = (val: string) => {
    setRateInput(val);
    const r = parseFloat(val) || 0;
    const m = parseFloat(marginInput) || 0;
    setClientRateInput(String(r + m));
    if (rateError) setRateError('');
  };

  const handleMarginChange = (val: string) => {
    setMarginInput(val);
    const m = parseFloat(val) || 0;
    const r = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    setClientRateInput(String(r + m));
    if (marginError) setMarginError('');
  };

  const handleClientRateChange = (val: string) => {
    setClientRateInput(val);
    const cr = parseFloat(val) || 0;
    const r = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
    const newMargin = Math.max(0, cr - r);
    setMarginInput(String(newMargin));
    if (marginError) setMarginError('');
  };

  const effectiveRate = hasPresetRate ? (influencerRate || 0) : (parseFloat(rateInput) || 0);
  const marginNum = parseFloat(marginInput) || 0;
  const clientRateNum = parseFloat(clientRateInput) || (effectiveRate + marginNum);
  const committedViewsNum = parseInt(committedViewsInput, 10) || 0;
  const cpv = committedViewsNum > 0 ? (clientRateNum / committedViewsNum).toFixed(2) : null;

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
    await onApprove(mapperId, {
      margin: marginNum,
      influencerRate: !hasPresetRate ? effectiveRate : undefined,
      committedViews: committedViewsNum > 0 ? committedViewsNum : undefined,
      preEvalEr: preEvalErInput ? parseFloat(preEvalErInput) : undefined,
      brandFit: brandFitInput.trim() || undefined,
      deliverables: deliverablesInput.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
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
            Set Margin & Pre-Evaluation
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5 }}>
            {influencerName
              ? `For: ${influencerName} · Finalize commercial rate and pre-evaluation metrics for Brand approval.`
              : 'Finalize commercial rate and pre-evaluation metrics for Brand approval.'}
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
              helperText="Total commercial billed to brand (Influencer Rate + Margin)"
              fullWidth
              disabled={loading}
            />

            <Divider sx={{ my: 0.5 }} />

            {/* 4. Pre-Evaluation Metrics Section */}
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.tokens.textSecondary }}>
              Pre-Evaluation Base Metrics
            </Typography>

            <TextField
              label="Deliverables"
              value={deliverablesInput}
              onChange={(e) => setDeliverablesInput(e.target.value)}
              placeholder="e.g. 1 Reel + 2 Stories"
              helperText="Agreed content format deliverables"
              fullWidth
              disabled={loading}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Committed Views (Optional)"
                type="text"
                value={committedViewsInput}
                onChange={(e) => setCommittedViewsInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 50000"
                helperText="Optional estimated view guarantee"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Pre-Eval ER %"
                type="text"
                value={preEvalErInput}
                onChange={(e) => setPreEvalErInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 4.5"
                helperText="Avg ER% over last 10 posts"
                fullWidth
                disabled={loading}
              />
            </Box>

            <TextField
              label="Brand Fit (Qualitative Comments)"
              value={brandFitInput}
              onChange={(e) => setBrandFitInput(e.target.value)}
              placeholder="e.g. High aesthetic tone, premium audience alignment"
              multiline
              rows={2}
              helperText="Agency qualitative assessment for the brand"
              fullWidth
              disabled={loading}
            />

            {/* Live Pricing Breakdown & CPV Card */}
            <Box
              sx={{
                padding: '16px 18px',
                backgroundColor: theme.palette.tokens.fieldBg,
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Committed Views:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {committedViewsNum > 0 ? committedViewsNum.toLocaleString() : 'Not specified'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Pre-Eval CPV (Cost / Views):
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {cpv ? `₹${cpv}` : '—'}
                </Typography>
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
