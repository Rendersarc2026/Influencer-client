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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { useLookupPostInsights } from '@api';
import {
  RecordMetricRequest,
  RecordMetricPost,
  MetricResponse,
  PostInsightsResponse,
  MAX_METRIC_POSTS,
} from '@contracts';
import { parseShorthandNumber, formatShorthandNumber, formatDateDDMMYYYY } from '@utils';

export interface RecordMetricsDialogProps {
  open: boolean;
  mapperId: string;
  influencerName?: string;
  /**
   * The post-evaluation already on file for this assignment, if any.
   *
   * The server keeps one record per assignment and a second save overwrites it,
   * so re-opening this dialog is an edit, not a second entry. Passing the
   * existing record is what makes that visible: the boxes arrive filled in and
   * the wording says "Edit" rather than inviting a duplicate.
   */
  existingMetric?: MetricResponse | null;
  /** The existing record is still being read, so the form is not seeded yet. */
  metricLoading?: boolean;
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
  { key: 'likes', label: 'Likes *', placeholder: 'e.g. 5k' },
  { key: 'comments', label: 'Comments *', placeholder: 'e.g. 320' },
  { key: 'shares', label: 'Shares *', placeholder: 'e.g. 180' },
  { key: 'saves', label: 'Saves *', placeholder: 'e.g. 90' },
] as const;

type PostFieldKey = (typeof POST_FIELDS)[number]['key'];

const EMPTY_POST: PostDraft = { url: '', likes: '', comments: '', shares: '', saves: '' };

/** Per-row validation messages, mirroring `PostDraft` field for field. */
type PostErrors = Record<keyof PostDraft, string>;

const EMPTY_POST_ERRORS: PostErrors = { url: '', likes: '', comments: '', shares: '', saves: '' };

const hasPostError = (row: PostErrors): boolean => Object.values(row).some(Boolean);

/** A typed field's value, with blank read as zero and a bad value as null. */
function readCount(raw: string): number | null {
  if (!raw.trim()) return 0;
  const parsed = parseShorthandNumber(raw);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

/** A stored count back into the box it was typed into, in shorthand. */
const toCountInput = (value: number | null | undefined): string =>
  value === null || value === undefined ? '' : formatShorthandNumber(value);

/**
 * Instagram post and reel permalinks, in both shapes Instagram hands out:
 * `/p/{code}/` and `/{username}/reel/{code}/`. Anything else is not worth a
 * round trip — the server rejects it for the same reason.
 */
const INSTAGRAM_POST_URL =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9._]+\/)?(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+/i;

/** How one post row's Instagram lookup is going. */
interface PostFetch {
  status: 'idle' | 'loading' | 'done' | 'error';
  message: string;
  /** The URL the last attempt was for, so leaving an unchanged box alone
   *  does not spend another call against Meta's hourly allowance. */
  url: string;
  /** Which boxes this dialog filled, and may therefore refill. */
  autoFilled: { likes: boolean; comments: boolean };
}

const EMPTY_POST_FETCH: PostFetch = {
  status: 'idle',
  message: '',
  url: '',
  autoFilled: { likes: false, comments: false },
};

/** How the fetched post is described back to the agency, so a wrong link shows. */
function describeFetchedPost(insights: PostInsightsResponse): string {
  const kind =
    insights.mediaKind.charAt(0) + insights.mediaKind.slice(1).toLowerCase().replace('_', ' ');
  const parts = [`@${insights.instagramHandle}`, kind];
  if (insights.takenAt) parts.push(formatDateDDMMYYYY(insights.takenAt));
  if (insights.views !== null) parts.push(`${insights.views.toLocaleString('en-IN')} views`);
  return parts.join(' · ');
}

/**
 * Shorthand only where it survives the round trip.
 *
 * The boxes reformat on blur so "5000" settles as "5k", but that pass runs over
 * fetched counts too, and `formatShorthandNumber(12437)` is "12.44k", which
 * parses back as 12,440. An exact figure read off Instagram must not be rounded
 * by the act of tabbing past it, so the reformat is skipped unless it is
 * lossless.
 */
function losslessShorthand(raw: string): string | null {
  const parsed = parseShorthandNumber(raw);
  if (parsed === null) return null;
  const formatted = formatShorthandNumber(parsed);
  return parseShorthandNumber(formatted) === parsed ? formatted : null;
}

/** A stored date back into a `type="date"` value. */
const toDateInput = (value: Date | string | null | undefined): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

export const RecordMetricsDialog: React.FC<RecordMetricsDialogProps> = ({
  open,
  mapperId,
  influencerName,
  existingMetric = null,
  metricLoading = false,
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
  const [reachError, setReachError] = useState('');
  const [impressionsError, setImpressionsError] = useState('');
  const [totalViewsError, setTotalViewsError] = useState('');
  const [skipRateError, setSkipRateError] = useState('');
  const [recordedForError, setRecordedForError] = useState('');
  const [postErrors, setPostErrors] = useState<PostErrors[]>([{ ...EMPTY_POST_ERRORS }]);
  const [postFetches, setPostFetches] = useState<PostFetch[]>([{ ...EMPTY_POST_FETCH }]);
  const [error, setError] = useState('');

  const lookupPostInsights = useLookupPostInsights();

  // Seeded from the record on file when there is one, so re-opening shows what
  // was entered rather than an empty form inviting a duplicate. Depends on the
  // record too: it arrives a round trip after the dialog opens.
  useEffect(() => {
    if (!open) return;

    const seededPosts: PostDraft[] = (existingMetric?.posts ?? []).map((post) => ({
      url: post.postUrl || '',
      likes: toCountInput(post.likes),
      comments: toCountInput(post.comments),
      shares: toCountInput(post.shares),
      saves: toCountInput(post.saves),
    }));

    setReach(toCountInput(existingMetric?.reach));
    setImpressions(toCountInput(existingMetric?.impressions));
    setTotalViews(toCountInput(existingMetric?.totalViews));
    setWatchTime(existingMetric?.watchTime || '');
    setSkipRate(
      existingMetric?.skipRate === null || existingMetric?.skipRate === undefined
        ? ''
        : String(existingMetric.skipRate),
    );
    setPosts(seededPosts.length > 0 ? seededPosts : [{ ...EMPTY_POST }]);
    setRecordedFor(
      existingMetric
        ? toDateInput(existingMetric.recordedFor)
        : new Date().toISOString().split('T')[0],
    );
    setReachError('');
    setImpressionsError('');
    setTotalViewsError('');
    setSkipRateError('');
    setRecordedForError('');
    setPostErrors(
      seededPosts.length > 0
        ? seededPosts.map(() => ({ ...EMPTY_POST_ERRORS }))
        : [{ ...EMPTY_POST_ERRORS }],
    );
    // A seeded row's numbers came off a saved record, so they count as
    // hand-entered: reopening the dialog must not overwrite them from Instagram.
    setPostFetches(
      seededPosts.length > 0
        ? seededPosts.map(() => ({ ...EMPTY_POST_FETCH }))
        : [{ ...EMPTY_POST_FETCH }],
    );
    setError('');
  }, [open, existingMetric]);

  const isEdit = Boolean(existingMetric);

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

  const filledPostCount = posts.filter(
    (post) =>
      post.url.trim() &&
      post.likes.trim() &&
      post.comments.trim() &&
      post.shares.trim() &&
      post.saves.trim(),
  ).length;

  const handleAddPost = () => {
    setPosts((prev) => (prev.length < MAX_METRIC_POSTS ? [...prev, { ...EMPTY_POST }] : prev));
    setPostErrors((prev) =>
      prev.length < MAX_METRIC_POSTS ? [...prev, { ...EMPTY_POST_ERRORS }] : prev,
    );
    setPostFetches((prev) =>
      prev.length < MAX_METRIC_POSTS ? [...prev, { ...EMPTY_POST_FETCH }] : prev,
    );
  };

  const handleRemovePost = (index: number) => {
    setPosts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ ...EMPTY_POST }];
    });
    setPostErrors((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ ...EMPTY_POST_ERRORS }];
    });
    setPostFetches((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ ...EMPTY_POST_FETCH }];
    });
  };

  const handlePostChange = (index: number, field: keyof PostDraft, val: string) => {
    setPosts((prev) => prev.map((post, i) => (i === index ? { ...post, [field]: val } : post)));
    // Clear that box's message as soon as it is being corrected.
    setPostErrors((prev) =>
      prev.map((row, i) => (i === index && row[field] ? { ...row, [field]: '' } : row)),
    );
    setPostFetches((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        // Typing over a fetched count claims it: the next lookup leaves it alone.
        if (field === 'likes' || field === 'comments') {
          return { ...row, autoFilled: { ...row.autoFilled, [field]: false } };
        }
        // A different URL makes the previous result stale, message and all.
        if (field === 'url' && val.trim() !== row.url) {
          return { ...row, status: 'idle', message: '' };
        }
        return row;
      }),
    );
  };

  /**
   * The shorthand tidy-up on blur. Separate from handlePostChange because that
   * one reads an edit as the agency claiming the box back from Instagram, and
   * reformatting 12000 as "12k" is not an edit.
   */
  const reformatPostField = (index: number, field: PostFieldKey, val: string) => {
    setPosts((prev) => prev.map((post, i) => (i === index ? { ...post, [field]: val } : post)));
  };

  const setPostFetch = (index: number, next: PostFetch) => {
    setPostFetches((prev) => prev.map((row, i) => (i === index ? next : row)));
  };

  /**
   * Reads Instagram's own like and comment counts for one pasted post.
   *
   * Only two of the four boxes can be filled. Shares and saves are private
   * Instagram Insights, readable only with a token for the account that
   * published the post, which the agency does not hold for a creator it
   * represents — so those stay hand-entered from the Insights screenshot
   * rather than being guessed at here.
   *
   * `force` is the refresh button: a blur fills only what is empty or was
   * filled by a previous lookup, while pressing refresh deliberately takes
   * Instagram's numbers over whatever is in the boxes.
   */
  const runLookup = async (index: number, force: boolean) => {
    const url = (posts[index]?.url ?? '').trim();
    if (!INSTAGRAM_POST_URL.test(url)) return;

    const current = postFetches[index] ?? EMPTY_POST_FETCH;
    // Tabbing back out of an unchanged box is not a new question.
    if (!force && current.url === url && current.status !== 'idle') return;
    if (current.status === 'loading') return;

    const fillLikes = force || !posts[index].likes.trim() || current.autoFilled.likes;
    const fillComments = force || !posts[index].comments.trim() || current.autoFilled.comments;

    setPostFetch(index, { ...current, status: 'loading', message: '', url });

    try {
      const insights = await lookupPostInsights.mutateAsync({ mapperId, url });

      // Written as plain digits, never shorthand: these are exact counts and
      // "12.44k" would round 12,437 away.
      const likesFilled = fillLikes && insights.likes !== null;
      setPosts((prev) =>
        prev.map((post, i) =>
          i === index
            ? {
                ...post,
                likes: likesFilled ? String(insights.likes) : post.likes,
                comments: fillComments ? String(insights.comments) : post.comments,
              }
            : post,
        ),
      );
      setPostErrors((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                url: '',
                likes: likesFilled ? '' : row.likes,
                comments: fillComments ? '' : row.comments,
              }
            : row,
        ),
      );

      const notes = [describeFetchedPost(insights)];
      if (insights.likes === null) {
        notes.push('this creator hides like counts, so Likes stays manual');
      }
      setPostFetch(index, {
        status: 'done',
        message: notes.join(' — '),
        url,
        autoFilled: {
          likes: likesFilled || current.autoFilled.likes,
          comments: fillComments || current.autoFilled.comments,
        },
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setPostFetch(index, {
        ...current,
        status: 'error',
        url,
        message:
          errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Instagram could not be read for this post. Enter the numbers by hand.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reachNum = reach.trim() ? parseShorthandNumber(reach) : undefined;
    const impressionsParsed = impressions.trim() ? parseShorthandNumber(impressions) : undefined;
    const totalViewsParsed = totalViews.trim() ? parseShorthandNumber(totalViews) : undefined;
    const skipRateParsed = skipRate.trim() ? parseFloat(skipRate) : undefined;

    // One validation pass over every field, so a submit marks all of the
    // offending fields red at once instead of one per failed click.
    const reachErr =
      reach.trim() && (reachNum === null || reachNum === undefined || reachNum < 0)
        ? 'Enter a valid positive Reach count (e.g. 10k, 100k, 1m)'
        : '';

    const impressionsErr =
      impressions.trim() &&
      (impressionsParsed === null || impressionsParsed === undefined || impressionsParsed < 0)
        ? 'Enter a valid Impressions count (e.g. 20k, 100k, 1m)'
        : '';

    const totalViewsErr =
      totalViews.trim() &&
      (totalViewsParsed === null || totalViewsParsed === undefined || totalViewsParsed < 0)
        ? 'Enter a valid Total Views count (e.g. 50k, 500k)'
        : '';

    const skipRateErr =
      skipRate.trim() &&
      (skipRateParsed === undefined ||
        isNaN(skipRateParsed) ||
        skipRateParsed < 0 ||
        skipRateParsed > 100)
        ? 'Enter a Skip Rate percentage between 0 and 100'
        : '';

    const recordedForErr = recordedFor ? '' : 'Recorded date is required';

    const validPosts: RecordMetricPost[] = [];
    const nextPostErrors: PostErrors[] = posts.map((post) => {
      const row: PostErrors = { ...EMPTY_POST_ERRORS };
      const url = post.url.trim();

      if (!url) {
        row.url = 'Post URL is required';
      } else if (!/^https?:\/\//i.test(url)) {
        row.url = 'URL must begin with http:// or https://';
      }

      const values: Partial<Record<PostFieldKey, number>> = {};
      for (const field of POST_FIELDS) {
        const raw = post[field.key];
        const cleanLabel = field.label.replace(' *', '');
        if (!raw.trim()) {
          row[field.key] = `${cleanLabel} is required (enter 0 if none)`;
          continue;
        }
        const parsed = parseShorthandNumber(raw);
        if (parsed === null || parsed < 0) {
          row[field.key] = `Enter a valid ${cleanLabel} count (e.g. 0, 500, 5k)`;
          continue;
        }
        values[field.key] = parsed;
      }

      if (!hasPostError(row)) {
        validPosts.push({
          postUrl: url,
          likes: values.likes ?? 0,
          comments: values.comments ?? 0,
          shares: values.shares ?? 0,
          saves: values.saves ?? 0,
        });
      }

      return row;
    });

    const postsInvalid = nextPostErrors.some(hasPostError);

    let formErr = '';
    if (!postsInvalid && validPosts.length === 0) {
      formErr = 'Add at least one post URL with its performance numbers';
    } else if (!postsInvalid && reachNum && reachNum > 0 && totals.engagements > reachNum) {
      formErr = 'Total engagements across the posts cannot exceed Reach';
    }

    setReachError(reachErr);
    setImpressionsError(impressionsErr);
    setTotalViewsError(totalViewsErr);
    setSkipRateError(skipRateErr);
    setRecordedForError(recordedForErr);
    setPostErrors(nextPostErrors);
    setError(formErr);

    if (
      reachErr ||
      impressionsErr ||
      totalViewsErr ||
      skipRateErr ||
      recordedForErr ||
      postsInvalid ||
      formErr
    ) {
      return;
    }

    const data: RecordMetricRequest = {
      reach: reachNum ?? 0,
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
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DialogTitle sx={{ pb: 0, pt: 1, px: 1, flexShrink: 0 }}>
          <SectionHeading
            title={
              isEdit ? 'Edit Post-Evaluation Performance' : 'Record Post-Evaluation Performance'
            }
            subtitle={
              influencerName
                ? `${isEdit ? 'Editing the recorded insights for' : 'Deliverable Insights for'}: ${influencerName}`
                : 'Enter verified post insights from social media analytics'
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
            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Post Eval - Reach (Unique)"
                value={reach}
                onChange={(e) => {
                  setReach(e.target.value.replace(/-/g, ''));
                  if (reachError) setReachError('');
                }}
                onBlur={() => {
                  const parsed = parseShorthandNumber(reach);
                  if (parsed !== null) setReach(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 100k, 1m"
                error={Boolean(reachError)}
                helperText={
                  reachError ||
                  (reach && parseShorthandNumber(reach) !== null
                    ? `${parseShorthandNumber(reach)?.toLocaleString('en-IN')} accounts`
                    : 'Actual unique accounts reached - from post Insights screenshot')
                }
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Post Eval - Total Views"
                value={totalViews}
                onChange={(e) => {
                  setTotalViews(e.target.value.replace(/-/g, ''));
                  if (totalViewsError) setTotalViewsError('');
                }}
                onBlur={() => {
                  const parsed = parseShorthandNumber(totalViews);
                  if (parsed !== null) setTotalViews(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 150k, 500k"
                error={Boolean(totalViewsError)}
                helperText={
                  totalViewsError ||
                  (totalViews && parseShorthandNumber(totalViews) !== null
                    ? `${parseShorthandNumber(totalViews)?.toLocaleString('en-IN')} views`
                    : 'Actual views the post got - from post Insights screenshot')
                }
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Post Eval - Impressions"
                value={impressions}
                onChange={(e) => {
                  setImpressions(e.target.value.replace(/-/g, ''));
                  if (impressionsError) setImpressionsError('');
                }}
                onBlur={() => {
                  const parsed = parseShorthandNumber(impressions);
                  if (parsed !== null) setImpressions(formatShorthandNumber(parsed));
                }}
                placeholder="e.g. 200k, 1.2m"
                error={Boolean(impressionsError)}
                helperText={impressionsError || undefined}
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

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Post Eval - Skip Rate %"
                type="number"
                value={skipRate}
                onChange={(e) => {
                  setSkipRate(e.target.value);
                  if (skipRateError) setSkipRateError('');
                }}
                placeholder="e.g. 12.5"
                error={Boolean(skipRateError)}
                helperText={skipRateError || undefined}
                fullWidth
                disabled={loading}
              />

              <TextField
                label="Recorded Date *"
                type="date"
                value={recordedFor}
                onChange={(e) => {
                  setRecordedFor(e.target.value);
                  if (recordedForError) setRecordedForError('');
                }}
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(recordedForError)}
                helperText={recordedForError || undefined}
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

              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Paste a post URL and Instagram&apos;s own Likes and Comments are filled in for you.
                Shares and Saves are private Insights that only the creator can see — take those
                from their Insights screenshot.
              </Typography>

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
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary }}
                    >
                      {readEngagements(post).toLocaleString('en-IN')} engagements
                    </Typography>
                    {posts.length > 1 && (
                      <IconButton
                        aria-label="Remove this post"
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

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <TextField
                      value={post.url}
                      onChange={(e) => handlePostChange(idx, 'url', e.target.value)}
                      // The lookup runs on blur rather than on every keystroke:
                      // each one spends a call against Meta's hourly allowance.
                      onBlur={() => void runLookup(idx, false)}
                      placeholder="https://www.instagram.com/reel/..."
                      size="small"
                      error={Boolean(postErrors[idx]?.url)}
                      helperText={postErrors[idx]?.url || undefined}
                      fullWidth
                      disabled={loading}
                    />
                    <IconButton
                      aria-label="Fetch likes and comments from Instagram"
                      title="Fetch likes and comments from Instagram"
                      size="small"
                      onClick={() => void runLookup(idx, true)}
                      disabled={
                        loading ||
                        postFetches[idx]?.status === 'loading' ||
                        !INSTAGRAM_POST_URL.test(post.url.trim())
                      }
                      sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5 }}
                    >
                      {postFetches[idx]?.status === 'loading' ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <RefreshRoundedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>

                  {postFetches[idx]?.status === 'loading' && (
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary }}
                    >
                      Reading this post from Instagram…
                    </Typography>
                  )}
                  {postFetches[idx]?.status === 'done' && (
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.positiveText }}>
                      {postFetches[idx]?.message}
                    </Typography>
                  )}
                  {postFetches[idx]?.status === 'error' && (
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.negativeText }}>
                      {postFetches[idx]?.message}
                    </Typography>
                  )}

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
                          const shorthand = losslessShorthand(post[field.key]);
                          if (shorthand !== null) {
                            reformatPostField(idx, field.key, shorthand);
                          }
                        }}
                        placeholder={field.placeholder}
                        size="small"
                        error={Boolean(postErrors[idx]?.[field.key])}
                        helperText={postErrors[idx]?.[field.key] || undefined}
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
                <TotalTile
                  label="Post-Eval ER%"
                  value={erPercent !== null ? `${erPercent}%` : '—'}
                />
              </Box>

              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                💡 Engagements are the sum of likes, comments, shares and saves across every post.
                ER% (Engagements / Reach) and CPV (Commercial / Total Views) are computed and stored
                server-side.
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
            disabled={loading || metricLoading}
            sx={{ minWidth: 140 }}
          >
            {loading || metricLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : isEdit ? (
              'Update Post-Eval Metrics'
            ) : (
              'Save Post-Eval Metrics'
            )}
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
