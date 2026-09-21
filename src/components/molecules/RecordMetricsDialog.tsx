import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
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

/**
 * The engagement components captured for every post.
 *
 * Only the two Instagram publishes are required. Shares and saves are
 * owner-only Insights that nothing can fill in automatically, so demanding
 * them blocked a save on numbers the agency may simply not have been sent —
 * and the easy way out of that is a typed 0, which reads as a measured zero
 * and is worse than an honest blank.
 */
const POST_FIELDS = [
  { key: 'likes', label: 'Likes', placeholder: 'e.g. 5k', required: true },
  { key: 'comments', label: 'Comments', placeholder: 'e.g. 320', required: true },
  { key: 'shares', label: 'Shares', placeholder: 'From Insights', required: false },
  { key: 'saves', label: 'Saves', placeholder: 'From Insights', required: false },
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

/** A computed total, or an em dash for a component no post recorded. */
const formatTotal = (value: number | null): string =>
  value === null ? '—' : value.toLocaleString('en-IN');

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

/** The shortcode inside a post URL, which is what makes two links the same post. */
function shortcodeOf(url: string): string | null {
  return /\/(?:p|reel|reels|tv)\/([^/?#]+)/.exec(url)?.[1] ?? null;
}

/**
 * Every distinct Instagram post link in a block of pasted text.
 *
 * The agency copies a run of links out of a chat or a sheet, so they arrive
 * separated by newlines, spaces or commas and often carry different tracking
 * parameters on the same post. Duplicates are dropped by shortcode rather than
 * by string, since `/p/ABC/?img_index=1` and `/p/ABC/` are one post.
 */
function splitPastedUrls(text: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const token of text.split(/[\s,;]+/)) {
    const url = token.trim();
    if (!INSTAGRAM_POST_URL.test(url)) continue;
    const shortcode = shortcodeOf(url);
    if (!shortcode || seen.has(shortcode)) continue;
    seen.add(shortcode);
    urls.push(url);
  }
  return urls;
}

/** How one post row's Instagram lookup is going. */
interface PostFetch {
  status: 'idle' | 'loading' | 'done' | 'error';
  message: string;
  /** The URL the last attempt was for, so leaving an unchanged box alone
   *  does not spend another call against Meta's hourly allowance. */
  url: string;
  /** Which boxes this dialog filled, and may therefore refill. */
  autoFilled: { likes: boolean; comments: boolean };
  /**
   * This post's play count, kept so Total Views can be the sum across every
   * post that was read. Null for a still, and for a row never looked up.
   */
  views: number | null;
}

const EMPTY_POST_FETCH: PostFetch = {
  status: 'idle',
  message: '',
  url: '',
  autoFilled: { likes: false, comments: false },
  views: null,
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
  /**
   * Total Views currently holds the sum of the fetched posts rather than a
   * typed figure, so a later lookup may update it. Cleared the moment the
   * agency types in the box themselves.
   */
  const [totalViewsAutoFilled, setTotalViewsAutoFilled] = useState(false);
  /** The paste-several-links panel, and the block of text sitting in it. */
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
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
    setTotalViewsAutoFilled(false);
    lastOfferedViewsRef.current = null;
    setBulkOpen(false);
    setBulkText('');
    setError('');
  }, [open, existingMetric]);

  const isEdit = Boolean(existingMetric);

  /** The distinct post links found in the paste panel, as it is typed into. */
  const bulkUrls = useMemo(() => splitPastedUrls(bulkText), [bulkText]);

  /**
   * Total Views across every post that was read from Instagram.
   *
   * The only headline figure the API can supply. Reach, impressions, watch time
   * and skip rate are owner-only Insights — Instagram publishes none of them for
   * an account we hold no token for — so those four stay hand-entered from the
   * creator's screenshot rather than being approximated from views.
   *
   * Null while nothing has been read, which is different from a post that
   * genuinely has no play count: a still contributes nothing to the sum but
   * does not suppress it.
   */
  const fetchedViewsTotal = useMemo(() => {
    const counted = postFetches.filter((fetch) => fetch.views !== null);
    if (counted.length === 0) return null;
    return counted.reduce((sum, fetch) => sum + (fetch.views ?? 0), 0);
  }, [postFetches]);

  /** The last sum offered to the box, so re-renders do not re-offer it. */
  const lastOfferedViewsRef = useRef<number | null>(null);

  useEffect(() => {
    if (fetchedViewsTotal === null) {
      // The last post that had been read was removed, so the derived figure has
      // no source left. Leaving it behind would show a total for posts that are
      // no longer on the record.
      if (totalViewsAutoFilled) {
        lastOfferedViewsRef.current = null;
        setTotalViews('');
        setTotalViewsAutoFilled(false);
      }
      return;
    }
    if (lastOfferedViewsRef.current === fetchedViewsTotal) return;
    lastOfferedViewsRef.current = fetchedViewsTotal;

    // A figure the agency typed is theirs — they may have added story views,
    // which Instagram does not expose here at all.
    if (totalViews.trim() && !totalViewsAutoFilled) return;

    setTotalViews(String(fetchedViewsTotal));
    setTotalViewsAutoFilled(true);
    setTotalViewsError('');
  }, [fetchedViewsTotal, totalViews, totalViewsAutoFilled]);

  // The summary is the breakdown: every engagement figure below is the sum of
  // what was entered per post, so the totals can never disagree with the posts
  // they came from. The server derives the same sums from the same payload.
  const totals = useMemo(() => {
    // Null when no post carried the component at all, so an untouched Shares
    // box reads as "not recorded" rather than as a measured zero.
    const sum = (key: PostFieldKey): number | null => {
      const entered = posts.filter((post) => post[key].trim());
      if (entered.length === 0) return null;
      return entered.reduce((acc, post) => acc + (readCount(post[key]) ?? 0), 0);
    };

    const likes = sum('likes');
    const comments = sum('comments');
    const shares = sum('shares');
    const saves = sum('saves');

    return {
      likes,
      comments,
      shares,
      saves,
      engagements: (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0),
    };
  }, [posts]);

  const reachValue = parseShorthandNumber(reach);
  const erPercent =
    reachValue && reachValue > 0
      ? Number(((totals.engagements / reachValue) * 100).toFixed(2))
      : null;

  const filledPostCount = posts.filter(
    (post) => post.url.trim() && post.likes.trim() && post.comments.trim(),
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
   * Takes a paste of one or more post links and gives each one its own row.
   *
   * The agency does not add posts one at a time — they finish a campaign with a
   * handful of links sitting together in a chat or a sheet. Pasting the lot into
   * any URL box fills that row and opens a row per remaining link, then reads
   * them one after another rather than all at once, so a batch of ten does not
   * arrive at Meta as ten simultaneous calls.
   */
  /**
   * Puts a batch of links into rows and reads each one.
   *
   * The agency does not add posts one at a time — they finish a campaign with a
   * handful of links sitting together in a chat or a sheet. `target` is the row
   * that takes the first link, or null to append the batch to the end. The
   * lookups run one after another rather than all at once, so a batch of ten
   * does not arrive at Meta as ten simultaneous calls.
   */
  const addUrls = (target: number | null, urls: string[]) => {
    // An existing row that takes the first link is one row that need not be made.
    const room = MAX_METRIC_POSTS - posts.length + (target === null ? 0 : 1);
    const accepted = urls.slice(0, Math.max(room, 0));

    if (accepted.length === 0) {
      setError(`A post-evaluation covers at most ${MAX_METRIC_POSTS} posts.`);
      return;
    }

    // Re-pasting the same link is someone tidying a URL, not swapping the post,
    // so that row keeps the numbers already against it. A different post means
    // the numbers on the row belong to something else and are cleared: a failed
    // lookup must never leave the previous post's counts under a new link.
    const samePost =
      target !== null && shortcodeOf(accepted[0]) === shortcodeOf(posts[target]?.url ?? '');
    const extras = target === null ? accepted : accepted.slice(1);
    const base = target ?? posts.length;
    const insertAt = target === null ? posts.length : target + 1;

    const nextPosts = [...posts];
    if (target !== null) {
      nextPosts[target] = samePost
        ? { ...(nextPosts[target] ?? EMPTY_POST), url: accepted[0] }
        : { ...EMPTY_POST, url: accepted[0] };
    }
    nextPosts.splice(insertAt, 0, ...extras.map((url) => ({ ...EMPTY_POST, url })));
    setPosts(nextPosts);

    setPostErrors((rows) => {
      const next = [...rows];
      if (target !== null) next[target] = { ...EMPTY_POST_ERRORS };
      next.splice(insertAt, 0, ...extras.map(() => ({ ...EMPTY_POST_ERRORS })));
      return next;
    });
    setPostFetches((rows) => {
      const next = [...rows];
      if (target !== null && !samePost) next[target] = { ...EMPTY_POST_FETCH };
      next.splice(insertAt, 0, ...extras.map(() => ({ ...EMPTY_POST_FETCH })));
      return next;
    });

    setError(
      accepted.length < urls.length
        ? `Added ${accepted.length} of the ${urls.length} links — a post-evaluation covers at most ${MAX_METRIC_POSTS} posts.`
        : '',
    );

    void (async () => {
      for (let offset = 0; offset < accepted.length; offset += 1) {
        // Every row but a re-paste of the same link was just cleared, so the
        // lookup writes into it rather than deferring to what used to be there.
        await runLookup(base + offset, offset > 0 || !samePost, accepted[offset]);
      }
    })();
  };

  /** Links pasted straight into a row's URL box, which needs no button. */
  const handleUrlPaste = (index: number, event: React.ClipboardEvent<HTMLDivElement>) => {
    const urls = splitPastedUrls(event.clipboardData?.getData('text') ?? '');
    if (urls.length === 0) return; // not links: let the ordinary paste happen
    event.preventDefault();
    addUrls(index, urls);
  };

  /** The batch from the paste panel lands in the first free row, else at the end. */
  const handleAddPastedLinks = () => {
    const firstEmpty = posts.findIndex((post) => !post.url.trim());
    addUrls(firstEmpty === -1 ? null : firstEmpty, bulkUrls);
    setBulkText('');
    setBulkOpen(false);
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
  const runLookup = async (index: number, force: boolean, urlOverride?: string) => {
    // A pasted batch knows its own URLs before React has re-rendered the rows
    // holding them, so the caller may name the URL instead of it being read
    // back out of state.
    const url = (urlOverride ?? posts[index]?.url ?? '').trim();
    if (!INSTAGRAM_POST_URL.test(url)) return;

    const draft = posts[index] ?? EMPTY_POST;
    const current = postFetches[index] ?? EMPTY_POST_FETCH;
    // Tabbing back out of an unchanged box is not a new question.
    if (!force && current.url === url && current.status !== 'idle') return;
    if (current.status === 'loading') return;

    const fillLikes = force || !draft.likes.trim() || current.autoFilled.likes;
    const fillComments = force || !draft.comments.trim() || current.autoFilled.comments;

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
        views: insights.views,
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
        if (!raw.trim()) {
          if (field.required) {
            row[field.key] = `${field.label} is required (enter 0 if none)`;
          }
          continue;
        }
        const parsed = parseShorthandNumber(raw);
        if (parsed === null || parsed < 0) {
          row[field.key] = `Enter a valid ${field.label} count (e.g. 0, 500, 5k)`;
          continue;
        }
        values[field.key] = parsed;
      }

      if (!hasPostError(row)) {
        // A blank shares or saves box is left out of the payload rather than
        // sent as 0: the server keeps the component null when no post carried
        // one, so a report can say "not recorded" instead of claiming nobody
        // shared the post.
        validPosts.push({
          postUrl: url,
          likes: values.likes ?? 0,
          comments: values.comments ?? 0,
          shares: values.shares,
          saves: values.saves,
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
                  const shorthand = losslessShorthand(reach);
                  if (shorthand !== null) setReach(shorthand);
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
                  // Typing over the derived sum claims the box: later lookups
                  // leave it alone, because story views only ever arrive by hand.
                  setTotalViewsAutoFilled(false);
                  if (totalViewsError) setTotalViewsError('');
                }}
                onBlur={() => {
                  const shorthand = losslessShorthand(totalViews);
                  if (shorthand !== null) setTotalViews(shorthand);
                }}
                placeholder="e.g. 150k, 500k"
                error={Boolean(totalViewsError)}
                helperText={
                  totalViewsError ||
                  (totalViewsAutoFilled && fetchedViewsTotal !== null
                    ? `${fetchedViewsTotal.toLocaleString('en-IN')} views across the posts read from Instagram - add story views by hand`
                    : totalViews && parseShorthandNumber(totalViews) !== null
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
                  const shorthand = losslessShorthand(impressions);
                  if (shorthand !== null) setImpressions(shorthand);
                }}
                placeholder="e.g. 200k, 1.2m"
                error={Boolean(impressionsError)}
                helperText={
                  impressionsError || 'Not published by Instagram - from post Insights screenshot'
                }
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<ContentPasteRoundedIcon fontSize="small" />}
                    onClick={() => setBulkOpen((prev) => !prev)}
                    disabled={loading || posts.length >= MAX_METRIC_POSTS}
                    sx={{ fontWeight: 600, textTransform: 'none', py: 0.25, px: 1 }}
                  >
                    Paste Links
                  </Button>
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
              </Box>

              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Instagram&apos;s own Likes and Comments are filled in from the post URL. Shares and
                Saves are private Insights only the creator can see — take those from their Insights
                screenshot, or leave them blank.
              </Typography>

              {/* Several links at once, for the run of URLs a finished campaign
                  leaves sitting in a chat or a sheet. */}
              {bulkOpen && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    padding: 2,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    borderRadius: `${theme.customRadii.inner}px`,
                  }}
                >
                  <TextField
                    label="Paste post links"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={
                      'https://www.instagram.com/reel/...\nhttps://www.instagram.com/p/...'
                    }
                    multiline
                    minRows={3}
                    maxRows={8}
                    size="small"
                    fullWidth
                    autoFocus
                    disabled={loading}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ flex: 1, color: theme.palette.tokens.textSecondary }}
                    >
                      {bulkUrls.length === 0
                        ? 'One link per line, or separated by commas. Duplicates are ignored.'
                        : `${bulkUrls.length} post ${bulkUrls.length === 1 ? 'link' : 'links'} found`}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setBulkText('');
                        setBulkOpen(false);
                      }}
                      disabled={loading}
                      sx={{ textTransform: 'none' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAddPastedLinks}
                      disabled={loading || bulkUrls.length === 0}
                      sx={{ textTransform: 'none' }}
                    >
                      {bulkUrls.length > 1 ? `Add ${bulkUrls.length} Posts` : 'Add Post'}
                    </Button>
                  </Box>
                </Box>
              )}

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
                      onPaste={(e) => handleUrlPaste(idx, e)}
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
                        required={field.required}
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
                <TotalTile label="Likes" value={formatTotal(totals.likes)} />
                <TotalTile label="Comments" value={formatTotal(totals.comments)} />
                <TotalTile label="Shares" value={formatTotal(totals.shares)} />
                <TotalTile label="Saves" value={formatTotal(totals.saves)} />
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
