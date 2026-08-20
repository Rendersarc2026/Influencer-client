import React, { useState, useEffect, useMemo } from 'react';
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
import { RecordMetricRequest, RecordMetricPost, MAX_METRIC_POSTS } from '@contracts';
import { parseShorthandNumber, formatShorthandNumber } from '@utils';

export interface RecordMetricsDialogProps {
  open: boolean;
  mapperId: string;
  influencerName?: string;
  loading?: boolean;
  onSubmit: (mapperId: string, data: RecordMetricRequest) => Promise<void> | void;
  onClose: () => void;
}

/** One post's row in the form, held as typed text so shorthand ("5k") survives editing. */
interface PostDraft {
  url: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
}

/** The engagement components captured for every post. */
const POST_FIELDS = [
  { key: 'likes', label: 'Likes', placeholder: 'e.g. 5k' },
  { key: 'comments', label: 'Comments', placeholder: 'e.g. 320' },
  { key: 'shares', label: 'Shares', placeholder: 'e.g. 180' },
  { key: 'saves', label: 'Saves', placeholder: 'e.g. 90' },
] as const;

type PostFieldKey = (typeof POST_FIELDS)[number]['key'];

const EMPTY_POST: PostDraft = { url: '', likes: '', comments: '', shares: '', saves: '' };

/** A typed field's value, with blank read as zero and a bad value as null. */
function readCount(raw: string): number | null {
  if (!raw.trim()) return 0;
  const parsed = parseShorthandNumber(raw);
  return parsed !== null && parsed >= 0 ? parsed : null;
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
  const [impressions, setImpressions] = useState<string>('');
  const [totalViews, setTotalViews] = useState<string>('');
  const [watchTime, setWatchTime] = useState<string>('');
  const [skipRate, setSkipRate] = useState<string>('');
  const [posts, setPosts] = useState<PostDraft[]>([{ ...EMPTY_POST }]);
  const [recordedFor, setRecordedFor] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReach('');
      setImpressions('');
      setTotalViews('');
      setWatchTime('');
      setSkipRate('');
      setPosts([{ ...EMPTY_POST }]);
      setRecordedFor(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [open]);

  // The summary is the breakdown: every engagement figure below is the sum of
  // what was entered per post, so the totals can never disagree with the posts
  // they came from. The server derives the same sums from the same payload.
  const totals = useMemo(() => {
    const sum = (key: PostFieldKey) =>
      posts.reduce((acc, post) => acc + (readCount(post[key]) ?? 0), 0);

    const likes = sum('likes');
    const comments = sum('comments');
    const shares = sum('shares');
    const saves = sum('saves');

    return { likes, comments, shares, saves, engagements: likes + comments + shares + saves };
  }, [posts]);

  const reachValue = parseShorthandNumber(reach);
  const erPercent =
    reachValue && reachValue > 0
      ? Number(((totals.engagements / reachValue) * 100).toFixed(2))
      : null;

  const filledPostCount = posts.filter((post) => post.url.trim()).length;

  const handleAddPost = () => {
    setPosts((prev) => (prev.length < MAX_METRIC_POSTS ? [...prev, { ...EMPTY_POST }] : prev));
  };

  const handleRemovePost = (index: number) => {
    setPosts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ ...EMPTY_POST }];
    });
  };

  const handlePostChange = (index: number, field: keyof PostDraft, val: string) => {
    setPosts((prev) => prev.map((post, i) => (i === index ? { ...post, [field]: val } : post)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reachNum = parseShorthandNumber(reach);
    const impressionsParsed = impressions.trim() ? parseShorthandNumber(impressions) : undefined;
    const totalViewsParsed = totalViews.trim() ? parseShorthandNumber(totalViews) : undefined;
    const skipRateParsed = skipRate.trim() ? parseFloat(skipRate) : undefined;

    if (reachNum === null || reachNum <= 0) {
      setError('Please enter a valid positive Reach count (e.g. 10k, 100k, 1m)');
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

    if (skipRate.trim() && (skipRateParsed === undefined || isNaN(skipRateParsed) || skipRateParsed < 0 || skipRateParsed > 100)) {
      setError('Please enter a valid Skip Rate percentage between 0 and 100');
      return;
    }

    const validPosts: RecordMetricPost[] = [];
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const url = post.url.trim();
      const label = posts.length > 1 ? `Post #${i + 1}` : 'Post';

      const values: Partial<Record<PostFieldKey, number | undefined>> = {};
      let hasValue = false;
      for (const field of POST_FIELDS) {
        const raw = post[field.key];
        if (!raw.trim()) continue;
        const parsed = parseShorthandNumber(raw);
        if (parsed === null || parsed < 0) {
          setError(`${label}: please enter a valid ${field.label} count`);
          return;
        }
        values[field.key] = parsed;
        hasValue = true;
      }

      if (!url) {
        // A row with numbers but no link cannot be attributed to anything, and
        // dropping it silently would quietly shrink the totals shown above.
        if (hasValue) {
          setError(`${label}: enter the post URL these numbers belong to`);
          return;
        }
        continue;
      }

      if (!/^https?:\/\//i.test(url)) {
        setError(`${label}: URL must begin with http:// or https://`);
        return;
      }

      validPosts.push({ postUrl: url, ...values });
    }

    if (validPosts.length === 0) {
      setError('Add at least one post URL with its performance numbers');
      return;
    }

    if (totals.engagements > reachNum) {
      setError('Total engagements across the posts cannot exceed Reach');
      return;
    }

    setError('');
    const data: RecordMetricRequest = {
      reach: reachNum,
      impressions: impressionsParsed ?? undefined,
      totalViews: totalViewsParsed ?? undefined,
      watchTime: watchTime.trim() || undefined,
      skipRate: skipRateParsed ?? undefined,
      posts: validPosts,
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

            {/* Per-post engagement breakdown */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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
                  Published Posts ({filledPostCount}/{MAX_METRIC_POSTS})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon fontSize="small" />}
                  onClick={handleAddPost}
                  disabled={loading || posts.length >= MAX_METRIC_POSTS}
                  sx={{ fontWeight: 600, textTransform: 'none', py: 0.25, px: 1 }}
                >
                  {posts.length >= MAX_METRIC_POSTS ? 'Max 10 Posts' : 'Add Post'}
                </Button>
              </Box>

              {posts.map((post, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    padding: 2,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    borderRadius: `${theme.customRadii.inner}px`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: theme.palette.tokens.textSecondary }}
                    >
                      POST #{idx + 1}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                      {readEngagements(post).toLocaleString('en-IN')} engagements
                    </Typography>
                    {posts.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemovePost(idx)}
                        disabled={loading}
                        title="Remove post"
                        sx={{
                          color: theme.palette.tokens.textSecondary,
                          '&:hover': { color: theme.palette.tokens.negative },
                          p: 0.5,
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    label="Post URL *"
                    value={post.url}
                    onChange={(e) => handlePostChange(idx, 'url', e.target.value)}
                    placeholder="https://www.instagram.com/reel/..."
                    size="small"
                    fullWidth
                    disabled={loading}
                  />

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                      gap: 1.5,
                    }}
                  >
                    {POST_FIELDS.map((field) => (
                      <TextField
                        key={field.key}
                        label={field.label}
                        value={post[field.key]}
                        onChange={(e) =>
                          handlePostChange(idx, field.key, e.target.value.replace(/-/g, ''))
                        }
                        onBlur={() => {
                          const parsed = parseShorthandNumber(post[field.key]);
                          if (parsed !== null) {
                            handlePostChange(idx, field.key, formatShorthandNumber(parsed));
                          }
                        }}
                        placeholder={field.placeholder}
                        size="small"
                        fullWidth
                        disabled={loading}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Totals, computed from the posts above */}
            <Box
              sx={{
                padding: 2,
                backgroundColor: theme.palette.tokens.fieldBg,
                borderRadius: `${theme.customRadii.inner}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: theme.palette.tokens.textSecondary,
                }}
              >
                Totals (Computed From Posts)
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1.5,
                }}
              >
                <TotalTile label="Engagements" value={totals.engagements.toLocaleString('en-IN')} />
                <TotalTile label="Likes" value={totals.likes.toLocaleString('en-IN')} />
                <TotalTile label="Comments" value={totals.comments.toLocaleString('en-IN')} />
                <TotalTile label="Shares" value={totals.shares.toLocaleString('en-IN')} />
                <TotalTile label="Saves" value={totals.saves.toLocaleString('en-IN')} />
                <TotalTile label="Post-Eval ER%" value={erPercent !== null ? `${erPercent}%` : '—'} />
              </Box>

              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                💡 Engagements are the sum of likes, comments, shares and saves across every post. ER%
                (Engagements / Reach) and CPV (Commercial / Total Views) are computed and stored server-side.
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
            disabled={loading || !reach || filledPostCount === 0}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Post-Eval Metrics'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

/** One post's engagements as typed so far; unparseable text counts as nothing. */
function readEngagements(post: PostDraft): number {
  return POST_FIELDS.reduce((sum, field) => sum + (readCount(post[field.key]) ?? 0), 0);
}

const TotalTile: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.tokens.textPrimary }}>
        {value}
      </Typography>
    </Box>
  );
};
