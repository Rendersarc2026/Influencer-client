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
import { SectionHeading } from '@atoms';
import { SubmitRateRequest } from '@contracts';

export interface SubmitRateDialogProps {
  open: boolean;
  mapperId: string;
  campaignName?: string;
  deliverables?: string;
  currentRate?: number | null;
  revisionComment?: string | null;
  loading?: boolean;
  onSubmit: (mapperId: string, data: SubmitRateRequest) => Promise<void> | void;
  onClose: () => void;
}

export const SubmitRateDialog: React.FC<SubmitRateDialogProps> = ({
  open,
  mapperId,
  campaignName,
  deliverables,
  currentRate,
  revisionComment,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [rateInput, setRateInput] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setRateInput(currentRate ? String(currentRate) : '');
      setNote('');
      setError('');
    }
  }, [open, currentRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(rateInput);
    if (isNaN(rateNum) || rateNum <= 0) {
      setError('Please enter a valid positive rate amount');
      return;
    }

    setError('');
    const data: SubmitRateRequest = {
      influencerRate: rateNum,
      note: note.trim() || undefined,
    };

    await onSubmit(mapperId, data);
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
            title={currentRate ? 'Revise Your Rate' : 'Submit Commercial Rate'}
            subtitle={campaignName ? `For: ${campaignName}` : 'Provide binding deliverable rate'}
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
            {revisionComment && (
              <Box
                sx={{
                  padding: '12px 16px',
                  backgroundColor: '#FDF4E7',
                  border: '1px solid #F6D8A8',
                  borderRadius: `${theme.customRadii.inner}px`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#B45309', fontWeight: 700, display: 'block', mb: 0.5 }}
                >
                  AGENCY REVISION FEEDBACK
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#92400E', fontWeight: 500 }}
                >
                  {revisionComment}
                </Typography>
              </Box>
            )}

            {deliverables && (
              <Box
                sx={{
                  padding: '12px 16px',
                  backgroundColor: theme.palette.tokens.fieldBg,
                  borderRadius: `${theme.customRadii.inner}px`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                >
                  DELIVERABLES
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
                >
                  {deliverables}
                </Typography>
              </Box>
            )}

            <TextField
              label="Your Commercial Rate (₹) *"
              type="text"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 75000"
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Notes / Delivery Terms (Optional)"
              multiline
              minRows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Rate includes 2 revisions and 30-day usage rights"
              fullWidth
              disabled={loading}
            />

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
            disabled={loading || !rateInput}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Rate'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
