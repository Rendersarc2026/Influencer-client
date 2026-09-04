import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { MoneyText, SectionHeading } from '@atoms';
import { AgencyMapperResponse, UpdatePreEvalRequest } from '@contracts';

export interface EditPreEvalDialogProps {
  open: boolean;
  mapper: AgencyMapperResponse | null;
  loading?: boolean;
  onSubmit: (mapperId: string, data: UpdatePreEvalRequest) => Promise<void> | void;
  onClose: () => void;
}

export const EditPreEvalDialog: React.FC<EditPreEvalDialogProps> = ({
  open,
  mapper,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();

  const [deliverables, setDeliverables] = useState('');
  const [preEvalEr, setPreEvalEr] = useState('');
  const [committedViews, setCommittedViews] = useState('');
  const [reachFromRegion, setReachFromRegion] = useState('');
  const [brandFit, setBrandFit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && mapper) {
      setDeliverables(mapper.deliverables || '');

      const initialEr =
        mapper.preEvalEr !== undefined && mapper.preEvalEr !== null ? String(mapper.preEvalEr) : '';
      setPreEvalEr(initialEr);

      const initialViews =
        mapper.committedViews !== undefined && mapper.committedViews !== null
          ? String(mapper.committedViews)
          : '';
      setCommittedViews(initialViews);

      setReachFromRegion(mapper.reachFromRegion || '');
      setBrandFit(mapper.brandFit || '');
      setError('');
    }
  }, [open, mapper]);

  const committedViewsNum = parseInt(committedViews, 10) || 0;
  const preEvalErNum = parseFloat(preEvalEr) || 0;

  const effectiveRate =
    mapper?.clientRate !== null && mapper?.clientRate !== undefined
      ? mapper.clientRate
      : mapper?.influencerRate !== null && mapper?.influencerRate !== undefined
        ? mapper.influencerRate
        : 0;

  const cpv =
    effectiveRate > 0 && committedViewsNum > 0
      ? (effectiveRate / committedViewsNum).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapper) return;

    if (preEvalEr && (isNaN(preEvalErNum) || preEvalErNum < 0 || preEvalErNum > 100)) {
      setError('Engagement rate must be a valid percentage between 0 and 100');
      return;
    }

    setError('');
    const payload: UpdatePreEvalRequest = {
      deliverables: deliverables.trim() || null,
      preEvalEr: preEvalEr.trim() ? preEvalErNum : null,
      committedViews: committedViews.trim() ? committedViewsNum : null,
      reachFromRegion: reachFromRegion.trim() || null,
      brandFit: brandFit.trim() || null,
    };

    await onSubmit(mapper.id, payload);
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
            padding: '12px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 0, pt: 1, px: 2 }}>
          <SectionHeading
            title="Edit Pre-Evaluation Details"
            subtitle={
              mapper?.influencerName
                ? `For: ${mapper.influencerName} · Update pre-evaluation metrics and deliverables`
                : 'Update pre-evaluation assessment dimensions and delivery estimates'
            }
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Deliverables & Formats"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g. 1x Instagram Reel + 2x Stories"
              helperText="Agreed content format deliverables for this campaign"
              fullWidth
              disabled={loading}
            />

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Committed Views (Optional)"
                type="text"
                value={committedViews}
                onChange={(e) => setCommittedViews(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 50000"
                helperText="Estimated view guarantee"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Pre-Eval ER %"
                type="text"
                value={preEvalEr}
                onChange={(e) => setPreEvalEr(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 4.5"
                helperText="Expected engagement rate percentage"
                fullWidth
                disabled={loading}
              />
            </Box>

            <TextField
              label="Reach from the region"
              value={reachFromRegion}
              onChange={(e) => setReachFromRegion(e.target.value)}
              placeholder="e.g. 75% or 45,000"
              helperText="% or number of their audience based in your target region - ask influencer for their Insights > Audience > Locations screenshot."
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Brand Fit (Qualitative Comments)"
              value={brandFit}
              onChange={(e) => setBrandFit(e.target.value)}
              placeholder="e.g. High aesthetic tone, premium audience alignment"
              multiline
              rows={2}
              helperText="Agency qualitative assessment visible to client brand"
              fullWidth
              disabled={loading}
            />

            {/* Live Metrics & Pre-Evaluation Rate Summary */}
            <Box
              sx={{
                padding: '14px 16px',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.2,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: theme.palette.tokens.textSecondary,
                  mb: 0.25,
                }}
              >
                Pre-Evaluation & Commercials Summary
              </Typography>

              {/* Influencer Commercial Rate */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Influencer Quoted Rate:
                </Typography>
                {mapper?.influencerRate !== null && mapper?.influencerRate !== undefined ? (
                  <MoneyText
                    amount={mapper.influencerRate}
                    currency={mapper.currency}
                    variant="body2"
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Pending quote
                  </Typography>
                )}
              </Box>

              {/* Client Commercial Rate */}
              {mapper?.clientRate !== null && mapper?.clientRate !== undefined && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Client Commercial Rate:
                  </Typography>
                  <MoneyText
                    amount={mapper.clientRate}
                    currency={mapper.currency}
                    variant="body2"
                    color={theme.palette.tokens.positiveText}
                  />
                </Box>
              )}

              {/* Pre-Eval ER % */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Pre-Eval Engagement Rate (ER):
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color:
                        preEvalErNum > 0
                          ? theme.palette.tokens.purpleText
                          : theme.palette.tokens.textSecondary,
                    }}
                  >
                    {preEvalErNum > 0 ? `${preEvalErNum.toFixed(2)}%` : 'Not specified'}
                  </Typography>
                  {preEvalErNum > 0 && (
                    <Chip
                      label={
                        preEvalErNum >= 4.0
                          ? '🔥 High'
                          : preEvalErNum >= 2.0
                            ? '✨ Good'
                            : 'Standard'
                      }
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: theme.palette.tokens.purpleBg,
                        color: theme.palette.tokens.purpleText,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Committed Views */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Committed Views:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {committedViewsNum > 0 ? committedViewsNum.toLocaleString() : 'Not specified'}
                </Typography>
              </Box>

              {/* Reach from Region */}
              {reachFromRegion && (
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Reach from Region:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {reachFromRegion}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 0.25, borderColor: 'rgba(0,0,0,0.08)' }} />

              {/* Calculated Pre-Eval CPV */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Calculated Pre-Eval CPV (Cost Per View):
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: cpv ? theme.palette.primary.main : theme.palette.tokens.textSecondary,
                  }}
                >
                  {cpv ? `₹${cpv} / view` : '—'}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 140 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Pre-Eval'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
