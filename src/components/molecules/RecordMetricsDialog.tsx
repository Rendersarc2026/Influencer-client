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
import { RecordMetricRequest } from '@contracts';
import { parseShorthandNumber, formatShorthandNumber } from '@utils';

export interface RecordMetricsDialogProps {
  open: boolean;
  mapperId: string;
  influencerName?: string;
  loading?: boolean;
  onSubmit: (mapperId: string, data: RecordMetricRequest) => Promise<void> | void;
  onClose: () => void;
}

export const RecordMetricsDialog: React.FC<RecordMetricsDialogProps> = ({
  open,
  mapperId,
  influencerName,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [reach, setReach] = useState<string>('');
  const [engagements, setEngagements] = useState<string>('');
  const [impressions, setImpressions] = useState<string>('');
  const [recordedFor, setRecordedFor] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReach('');
      setEngagements('');
      setImpressions('');
      setRecordedFor(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reachNum = parseShorthandNumber(reach);
    const engagementsNum = parseShorthandNumber(engagements);
    const impressionsParsed = impressions.trim() ? parseShorthandNumber(impressions) : undefined;

    if (reachNum === null || reachNum <= 0) {
      setError('Please enter a valid positive Reach count (e.g. 10k, 100k, 1m)');
      return;
    }

    if (engagementsNum === null || engagementsNum < 0) {
      setError('Please enter a valid non-negative Engagements count (e.g. 5k, 10k)');
      return;
    }

    if (impressions.trim() && (impressionsParsed === null || impressionsParsed === undefined || impressionsParsed < 0)) {
      setError('Please enter a valid Impressions count (e.g. 20k, 100k, 1m)');
      return;
    }

    setError('');
    const data: RecordMetricRequest = {
      reach: reachNum,
      engagements: engagementsNum,
      impressions: impressionsParsed ?? undefined,
      recordedFor: new Date(recordedFor),
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
            title="Record Campaign Metrics"
            subtitle={
              influencerName ? `For: ${influencerName}` : 'Enter server-verified deliverable metrics for engagement computation'
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
              label="Reach (Unique Views) *"
              value={reach}
              onChange={(e) => setReach(e.target.value.replace(/-/g, ''))}
              onBlur={() => {
                const parsed = parseShorthandNumber(reach);
                if (parsed !== null) setReach(formatShorthandNumber(parsed));
              }}
              placeholder="e.g. 100k, 1m"
              helperText={
                reach && parseShorthandNumber(reach) !== null
                  ? `${parseShorthandNumber(reach)?.toLocaleString('en-IN')} reach`
                  : undefined
              }
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Engagements (Likes + Comments + Shares) *"
              value={engagements}
              onChange={(e) => setEngagements(e.target.value.replace(/-/g, ''))}
              onBlur={() => {
                const parsed = parseShorthandNumber(engagements);
                if (parsed !== null) setEngagements(formatShorthandNumber(parsed));
              }}
              placeholder="e.g. 10k, 50k"
              helperText={
                engagements && parseShorthandNumber(engagements) !== null
                  ? `${parseShorthandNumber(engagements)?.toLocaleString('en-IN')} engagements`
                  : undefined
              }
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Impressions (Optional)"
              value={impressions}
              onChange={(e) => setImpressions(e.target.value.replace(/-/g, ''))}
              onBlur={() => {
                const parsed = parseShorthandNumber(impressions);
                if (parsed !== null) setImpressions(formatShorthandNumber(parsed));
              }}
              placeholder="e.g. 150k, 2m"
              helperText={
                impressions && parseShorthandNumber(impressions) !== null
                  ? `${parseShorthandNumber(impressions)?.toLocaleString('en-IN')} impressions`
                  : undefined
              }
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Recorded For Date *"
              type="date"
              value={recordedFor}
              onChange={(e) => setRecordedFor(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              disabled={loading}
            />

            <Box
              sx={{
                padding: '12px 16px',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Note: Engagement Rate percentage (ER%) is derived and verified server-side.
              </Typography>
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
            disabled={loading || !reach || !engagements}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Metrics'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
