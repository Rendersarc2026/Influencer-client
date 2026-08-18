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
  const [brandFit, setBrandFit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && mapper) {
      setDeliverables(mapper.deliverables || '');
      setPreEvalEr(
        mapper.preEvalEr !== undefined && mapper.preEvalEr !== null
          ? String(mapper.preEvalEr)
          : '',
      );
      setCommittedViews(
        mapper.committedViews !== undefined && mapper.committedViews !== null
          ? String(mapper.committedViews)
          : '',
      );
      setBrandFit(mapper.brandFit || '');
      setError('');
    }
  }, [open, mapper]);

  const committedViewsNum = parseInt(committedViews, 10) || 0;
  const preEvalErNum = parseFloat(preEvalEr) || 0;

  const cpv =
    mapper?.clientRate && committedViewsNum > 0
      ? (mapper.clientRate / committedViewsNum).toFixed(2)
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
        <DialogTitle sx={{ pb: 1 }}>
          <SectionHeading
            title="Edit Pre-Evaluation Details"
            subtitle={
              mapper?.influencerName
                ? `For: ${mapper.influencerName} · Update pre-evaluation metrics and deliverables`
                : 'Update pre-evaluation assessment dimensions and delivery estimates'
            }
          />
        </DialogTitle>

        <DialogContent
          sx={{
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Committed Views (Optional)"
                type="text"
                value={committedViews}
                onChange={(e) => setCommittedViews(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 50000"
                helperText="Optional estimated view guarantee"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Pre-Eval ER %"
                type="text"
                value={preEvalEr}
                onChange={(e) => setPreEvalEr(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="e.g. 4.5"
                helperText="Avg ER% over last 10 posts"
                fullWidth
                disabled={loading}
              />
            </Box>

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

            {/* Live Metrics & CPV Summary */}
            <Box
              sx={{
                padding: '14px 16px',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.2,
              }}
            >
              {mapper?.clientRate !== null && mapper?.clientRate !== undefined && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Client Commercial Rate:
                  </Typography>
                  <MoneyText amount={mapper.clientRate} currency={mapper.currency} variant="body2" />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Committed Views:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {committedViewsNum > 0 ? committedViewsNum.toLocaleString() : 'Not specified'}
                </Typography>
              </Box>

              <Divider sx={{ my: 0.25, borderColor: 'rgba(0,0,0,0.08)' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Calculated Pre-Eval CPV:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {cpv ? `₹${cpv}` : '—'}
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
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Pre-Eval'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
