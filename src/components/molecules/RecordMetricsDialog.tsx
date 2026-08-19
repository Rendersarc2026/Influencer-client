import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
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

const MAX_POST_URLS = 10;

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
  const [impressions, setImpressions] = useState<string>('');
  const [totalViews, setTotalViews] = useState<string>('');
  const [engagements, setEngagements] = useState<string>('');
  const [likes, setLikes] = useState<string>('');
  const [watchTime, setWatchTime] = useState<string>('');
  const [skipRate, setSkipRate] = useState<string>('');
  const [postUrls, setPostUrls] = useState<string[]>(['']);
  const [recordedFor, setRecordedFor] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReach('');
      setImpressions('');
      setTotalViews('');
      setEngagements('');
      setLikes('');
      setWatchTime('');
      setSkipRate('');
      setPostUrls(['']);
      setRecordedFor(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [open]);

  const handleAddPostUrl = () => {
    if (postUrls.length >= MAX_POST_URLS) return;
    setPostUrls((prev) => (prev.length < MAX_POST_URLS ? [...prev, ''] : prev));
  };

  const handleRemovePostUrl = (index: number) => {
    setPostUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const handlePostUrlChange = (index: number, val: string) => {
    setPostUrls((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reachNum = parseShorthandNumber(reach);
    const engagementsNum = parseShorthandNumber(engagements);
    const impressionsParsed = impressions.trim() ? parseShorthandNumber(impressions) : undefined;
    const totalViewsParsed = totalViews.trim() ? parseShorthandNumber(totalViews) : undefined;
    const likesParsed = likes.trim() ? parseShorthandNumber(likes) : undefined;
    const skipRateParsed = skipRate.trim() ? parseFloat(skipRate) : undefined;

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

    if (totalViews.trim() && (totalViewsParsed === null || totalViewsParsed === undefined || totalViewsParsed < 0)) {
      setError('Please enter a valid Total Views count (e.g. 50k, 500k)');
      return;
    }

    if (likes.trim() && (likesParsed === null || likesParsed === undefined || likesParsed < 0)) {
      setError('Please enter a valid Likes count');
      return;
    }

    if (skipRate.trim() && (skipRateParsed === undefined || isNaN(skipRateParsed) || skipRateParsed < 0 || skipRateParsed > 100)) {
      setError('Please enter a valid Skip Rate percentage between 0 and 100');
      return;
    }

    const validUrls: string[] = [];
    for (let i = 0; i < postUrls.length; i++) {
      const raw = postUrls[i].trim();
      if (raw) {
        if (!/^https?:\/\//i.test(raw)) {
          setError(`Post URL ${postUrls.length > 1 ? `#${i + 1} ` : ''}must begin with http:// or https://`);
          return;
        }
        validUrls.push(raw);
      }
    }

    setError('');
    const data: RecordMetricRequest = {
      reach: reachNum,
      engagements: engagementsNum,
      impressions: impressionsParsed ?? undefined,
      totalViews: totalViewsParsed ?? undefined,
      likes: likesParsed ?? undefined,
      watchTime: watchTime.trim() || undefined,
      skipRate: skipRateParsed ?? undefined,
      liveLink: validUrls.length > 0 ? validUrls.join('\n') : undefined,
      recordedFor: new Date(recordedFor),
    };

    await onSubmit(mapperId, data);
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
            backgroundImage: 'none',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <DialogTitle sx={{ pb: 0, pt: 1, px: 1, flexShrink: 0 }}>
          <SectionHeading
            title="Record Post-Evaluation Performance"
            subtitle={
              influencerName ? `Deliverable Insights for: ${influencerName}` : 'Enter verified post insights from social media analytics'
            }
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            px: 1,
            pt: 0.5,
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Post Eval - Reach (Unique) *"
                value={reach}
                onChange={(e) => setReach(e.target.value.replace(/-/g, ''))}
                onBlur={() => {
                  const parsed = parseShorthandNumber(reach);
                  if (parsed !== null) setReach(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 100k, 1m"
                helperText={
                  reach && parseShorthandNumber(reach) !== null
                    ? `${parseShorthandNumber(reach)?.toLocaleString('en-IN')} accounts`
                    : undefined
                }
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Post Eval - Total Views"
                value={totalViews}
                onChange={(e) => setTotalViews(e.target.value.replace(/-/g, ''))}
                onBlur={() => {
                  const parsed = parseShorthandNumber(totalViews);
                  if (parsed !== null) setTotalViews(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 150k, 500k"
                helperText={
                  totalViews && parseShorthandNumber(totalViews) !== null
                    ? `${parseShorthandNumber(totalViews)?.toLocaleString('en-IN')} views`
                    : undefined
                }
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Post Eval - Engagements *"
                value={engagements}
                onChange={(e) => setEngagements(e.target.value.replace(/-/g, ''))}
                onBlur={() => {
                  const parsed = parseShorthandNumber(engagements);
                  if (parsed !== null) setEngagements(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 10k, 50k"
                helperText={
                  engagements && parseShorthandNumber(engagements) !== null
                    ? `${parseShorthandNumber(engagements)?.toLocaleString('en-IN')} interactions`
                    : undefined
                }
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Post Eval - Likes"
                value={likes}
                onChange={(e) => setLikes(e.target.value.replace(/-/g, ''))}
                onBlur={() => {
                  const parsed = parseShorthandNumber(likes);
                  if (parsed !== null) setLikes(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 8.5k, 40k"
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Post Eval - Impressions"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value.replace(/-/g, ''))}
                onBlur={() => {
                  const parsed = parseShorthandNumber(impressions);
                  if (parsed !== null) setImpressions(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 200k, 1.2m"
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Post Eval - Watch Time"
                value={watchTime}
                onChange={(e) => setWatchTime(e.target.value)}
                placeholder="e.g. 18.5s avg or 140 hrs"
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Post Eval - Skip Rate %"
                type="number"
                value={skipRate}
                onChange={(e) => setSkipRate(e.target.value)}
                placeholder="e.g. 12.5"
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Recorded Date *"
                type="date"
                value={recordedFor}
                onChange={(e) => setRecordedFor(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={loading}
              />
            </Box>

            {/* Post URLs section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: theme.palette.tokens.textSecondary,
                  }}
                >
                  Post URLs (Published Deliverables)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon fontSize="small" />}
                  onClick={handleAddPostUrl}
                  disabled={loading || postUrls.length >= MAX_POST_URLS}
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.25,
                    px: 1,
                  }}
                >
                  Add Post URL {postUrls.length >= MAX_POST_URLS ? '(Max 10)' : `(${postUrls.length}/${MAX_POST_URLS})`}
                </Button>
              </Box>

              {postUrls.map((url, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label={postUrls.length > 1 ? `Post URL #${idx + 1}` : 'Post URL'}
                    value={url}
                    onChange={(e) => handlePostUrlChange(idx, e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    fullWidth
                    disabled={loading}
                  />
                  {postUrls.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePostUrl(idx)}
                      disabled={loading}
                      title="Remove URL"
                      sx={{
                        color: theme.palette.tokens.textSecondary,
                        '&:hover': { color: theme.palette.tokens.negative },
                        p: 1,
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                padding: '12px 16px',
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                💡 Note: Post-Eval ER% (Engagements / Reach) and Post-Eval CPV (Commercial / Total Views) will be computed automatically.
              </Typography>
            </Box>

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, px: 1, pt: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !reach || !engagements}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Post-Eval Metrics'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
