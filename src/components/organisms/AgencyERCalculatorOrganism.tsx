import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
import InstagramIcon from '@mui/icons-material/Instagram';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import MovieCreationRoundedIcon from '@mui/icons-material/MovieCreationRounded';
import CollectionsRoundedIcon from '@mui/icons-material/Collections';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { useAuth, useToast } from '@hooks';
import { apiClient, useAgencyInfluencers, useAssignERToInfluencer } from '@api';
import {
  safeUrl,
  safeImageUrl,
  calculateMedian,
  calculateEngagementRate,
  calculatePreEvalCpv,
  parseNumberInput,
  validateNumericInput,
  cleanInstagramHandle,
  formatInstagramHandle,
} from '@utils';
import type { AnalyzedPost, CalculateERResponse } from '@contracts';

type ERResult = CalculateERResponse;

/**
 * Stable identity for a post row.
 *
 * Exclusions are held by key rather than by index, so striking a post out —
 * which re-slices the sample and pulls a standby post up — never shifts the
 * exclusion onto a different post.
 */
function postKeyOf(post: AnalyzedPost, index: number): string {
  return post.shortcode ?? post.permalink ?? `${post.takenAt}#${index}`;
}

export const AgencyERCalculatorOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // URL parameters (e.g. ?influencerId=...)
  const [searchParams] = useSearchParams();
  const initialInfluencerId = searchParams.get('influencerId') || '';

  // Agency Roster Query
  const { data: influencersData, isLoading: influencersLoading } = useAgencyInfluencers({
    limit: 100,
  });
  const influencersList = useMemo(() => influencersData?.items || [], [influencersData]);

  // Selected Influencer from Roster
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>(initialInfluencerId);
  const selectedInfluencer = useMemo(
    () => influencersList.find((inf) => inf.id === selectedInfluencerId) || null,
    [influencersList, selectedInfluencerId],
  );

  // Assign ER Mutation
  const assignERMutation = useAssignERToInfluencer();

  // Assign ER Modal Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogTargetId, setAssignDialogTargetId] = useState<string>('');

  // Auto Profile Fetch Inputs & State
  const [autoHandle, setAutoHandle] = useState('');
  const [autoCommercialFee, setAutoCommercialFee] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<ERResult | null>(null);
  /** Server error code from the last failed lookup, e.g. NOT_PROFESSIONAL_ACCOUNT. */
  const [autoErrorCode, setAutoErrorCode] = useState<string | null>(null);
  /**
   * Posts the agency has struck out of the sample by hand, by post key.
   *
   * The usual reason is an Instagram trial reel: published to non-followers
   * only, so it never appears on the creator's grid, but Meta's API returns it
   * anyway and it drags the rate down with reach the creator's own audience
   * never saw. Nothing is excluded automatically — the server only flags.
   */
  const [excludedPostKeys, setExcludedPostKeys] = useState<string[]>([]);

  // When initialInfluencerId arrives from URL query param
  useEffect(() => {
    if (initialInfluencerId && !selectedInfluencerId) {
      setSelectedInfluencerId(initialInfluencerId);
    }
  }, [initialInfluencerId, selectedInfluencerId]);

  // When selected influencer changes, auto-populate inputs
  useEffect(() => {
    if (selectedInfluencer) {
      const handle = selectedInfluencer.instagram || selectedInfluencer.name || '';
      setAutoHandle(handle);
      if (selectedInfluencer.avgCommercialMin || selectedInfluencer.avgCommercialMax) {
        const fee =
          selectedInfluencer.avgCommercialMin || selectedInfluencer.avgCommercialMax || '';
        setAutoCommercialFee(String(fee));
      }
    }
  }, [selectedInfluencer]);

  // ---------------------------------------------------------------------------
  // Calculations for Auto Mode
  // ---------------------------------------------------------------------------

  const autoCommercialFeeNum = useMemo(
    () => parseNumberInput(autoCommercialFee),
    [autoCommercialFee],
  );

  /** Everything the server sent back, newest first, each paired with its key. */
  const candidatePosts = useMemo(() => {
    if (!autoResult?.posts) return [];
    return [...autoResult.posts]
      .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
      .map((post, index) => ({ post, key: postKeyOf(post, index) }));
  }, [autoResult?.posts]);

  const sampleSize = autoResult?.sampleSize ?? 10;

  /**
   * The posts currently feeding every figure on the page: the newest
   * `sampleSize` candidates that have not been struck out. Excluding one
   * therefore promotes the next standby post into the sample rather than
   * shrinking it — the sample stays ten posts wide as long as the pool lasts.
   */
  const activeKeys = useMemo(() => {
    const excluded = new Set(excludedPostKeys);
    return new Set(
      candidatePosts
        .filter((entry) => !excluded.has(entry.key))
        .slice(0, sampleSize)
        .map((entry) => entry.key),
    );
  }, [candidatePosts, excludedPostKeys, sampleSize]);

  const activeEntries = useMemo(
    () => candidatePosts.filter((entry) => activeKeys.has(entry.key)),
    [candidatePosts, activeKeys],
  );

  const activePosts = useMemo(() => activeEntries.map((entry) => entry.post), [activeEntries]);

  /**
   * The headline numbers, recomputed in the browser from the active sample.
   *
   * The server's own figures cover its default ten, so once a post is struck
   * out they no longer describe what is on screen. Same formula either way.
   */
  const liveMetrics = useMemo(() => {
    const followers = autoResult?.followersCount ?? 0;
    const count = activePosts.length;
    const totalLikes = activePosts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = activePosts.reduce((sum, post) => sum + post.comments, 0);
    return {
      count,
      totalLikes,
      totalComments,
      avgLikes: count > 0 ? Math.round(totalLikes / count) : 0,
      avgComments: count > 0 ? Math.round(totalComments / count) : 0,
      engagementRate: Number(
        calculateEngagementRate(totalLikes, totalComments, count, followers).toFixed(2),
      ),
    };
  }, [activePosts, autoResult?.followersCount]);

  /**
   * The rows the table actually renders.
   *
   * Standby posts stay out of sight — they are backfill, not part of the
   * reading, and listing all 30 buried the ten that matter. A struck-out post
   * keeps its row so it can be put back; without it, removal would only be
   * undoable by refetching.
   */
  const visiblePosts = useMemo(() => {
    // `position` numbers the counted posts 1..N without gaps. A removed row
    // still shows, so it can be put back, but it does not consume a number —
    // otherwise removing the third post leaves the list running to eleven.
    let position = 0;
    return candidatePosts
      .filter((entry) => activeKeys.has(entry.key) || excludedPostKeys.includes(entry.key))
      .map((entry) => {
        const isActive = activeKeys.has(entry.key);
        if (isActive) position += 1;
        return { ...entry, position: isActive ? position : null };
      });
  }, [candidatePosts, activeKeys, excludedPostKeys]);

  const excludedCount = useMemo(
    () => candidatePosts.filter((entry) => excludedPostKeys.includes(entry.key)).length,
    [candidatePosts, excludedPostKeys],
  );

  const togglePostExcluded = (key: string) => {
    setExcludedPostKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const autoReelViews = useMemo(
    () =>
      activePosts
        .filter((p) => p.mediaKind === 'REEL' || p.mediaKind === 'VIDEO')
        .map((p) => p.views)
        .filter((v): v is number => v !== null && v > 0),
    [activePosts],
  );

  const autoCommittedViews = useMemo(() => {
    if (autoReelViews.length > 0) {
      return calculateMedian(autoReelViews);
    }
    return autoResult?.avgViews || 0;
  }, [autoReelViews, autoResult]);

  const autoCpv = useMemo(
    () => calculatePreEvalCpv(autoCommercialFeeNum, autoCommittedViews),
    [autoCommercialFeeNum, autoCommittedViews],
  );

  const handleCopyAutoSummary = () => {
    if (!autoResult) return;
    const handleLabel = formatInstagramHandle(
      autoHandle || autoResult.instagramHandle,
      'Influencer',
    );

    const postsCount = liveMetrics.count;
    const totalLikes = liveMetrics.totalLikes;
    const totalComments = liveMetrics.totalComments;
    const excludedNote =
      excludedCount > 0
        ? `\n• Posts excluded by hand: ${excludedCount} (suspected trial reels)`
        : '';

    const reportText = `📊 Influencer Evaluation Report: ${handleLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Followers: ${autoResult.followersCount ? autoResult.followersCount.toLocaleString() : 'Not specified'}
• Analyzed Posts: ${postsCount}${excludedNote}
• Total Likes: ${totalLikes.toLocaleString()} (Avg: ${liveMetrics.avgLikes.toLocaleString()}/post)
• Total Comments: ${totalComments.toLocaleString()} (Avg: ${liveMetrics.avgComments.toLocaleString()}/post)
• Engagement Rate (ER%): ${liveMetrics.engagementRate.toFixed(2)}%
• Pre-Eval Committed Views: ${autoCommittedViews > 0 ? `${autoCommittedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${autoCommercialFeeNum > 0 ? `₹${autoCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${autoCpv !== null ? `₹${autoCpv.toFixed(2)} / view` : 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formula: ER% = [(Likes + Comments) ÷ Posts] ÷ Followers × 100
Formula: Committed Views = Median of Analyzed Reel Views
Formula: Pre-Eval CPV = Reel Fee ÷ Committed Views`;

    navigator.clipboard.writeText(reportText);
    showSuccess('Evaluation report copied to clipboard');
  };

  /**
   * Fetches metrics for a handle via Meta official Instagram Graph API.
   * forceRefresh bypasses the server's 24h stored copy.
   */
  const handleCalculateAuto = async (forceRefresh = false) => {
    const trimmed = autoHandle.trim();
    if (!trimmed) return;

    setAutoLoading(true);
    setAutoResult(null);
    setAutoErrorCode(null);
    setExcludedPostKeys([]);

    try {
      const res = await apiClient.post<ERResult>('/er-calculator', {
        instagramHandle: trimmed,
        ...(forceRefresh ? { forceRefresh: true } : {}),
      });
      setAutoResult(res.data);
      showSuccess(`Fetched profile for @${res.data.instagramHandle}`);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; code?: string } } })
        ?.response?.data;
      setAutoErrorCode(response?.code ?? null);
      showError(response?.message || 'Failed to calculate engagement rate via Meta Graph API.');
    } finally {
      setAutoLoading(false);
    }
  };

  const openAssignDialog = () => {
    if (selectedInfluencerId) {
      setAssignDialogTargetId(selectedInfluencerId);
    } else {
      const clean = cleanInstagramHandle(autoHandle).toLowerCase();
      if (clean) {
        const match = influencersList.find(
          (inf) =>
            (inf.instagram && cleanInstagramHandle(inf.instagram).toLowerCase() === clean) ||
            inf.name.toLowerCase() === autoHandle.trim().toLowerCase(),
        );
        if (match) {
          setAssignDialogTargetId(match.id);
        } else {
          setAssignDialogTargetId('');
        }
      } else {
        setAssignDialogTargetId('');
      }
    }
    setAssignDialogOpen(true);
  };

  const handleAssignToInfluencer = async (targetIdOverride?: string) => {
    const targetInfluencerId = targetIdOverride || selectedInfluencerId;

    if (!targetInfluencerId) {
      openAssignDialog();
      return;
    }

    const erValue = liveMetrics.engagementRate;
    if (erValue <= 0) {
      showError('Please fetch a profile to calculate ER% before assigning.');
      return;
    }

    const followers = autoResult?.followersCount || undefined;
    const commFee = autoCommercialFeeNum > 0 ? autoCommercialFeeNum : undefined;
    const committedViews = autoCommittedViews > 0 ? autoCommittedViews : undefined;
    const handle = cleanInstagramHandle(autoHandle || autoResult?.instagramHandle || '');

    try {
      const res = await assignERMutation.mutateAsync({
        influencerId: targetInfluencerId,
        engagementRate: Number(erValue.toFixed(2)),
        followersCount: followers,
        commercialFee: commFee,
        avgViews: committedViews,
        avgLikes: liveMetrics.avgLikes,
        avgComments: liveMetrics.avgComments,
        postsCount: liveMetrics.count,
        instagramHandle: handle || undefined,
        source: autoResult?.source || 'META_GRAPH_BUSINESS_DISCOVERY',
        // Record what was actually counted, not just what Instagram returned,
        // so an assigned rate can be traced back to the exact sample.
        rawResponse: { autoResult, excludedPostKeys, analyzedPosts: activePosts },
      });

      if (targetInfluencerId !== selectedInfluencerId) {
        setSelectedInfluencerId(targetInfluencerId);
      }
      setAssignDialogOpen(false);

      const targetInfluencerObj = influencersList.find((inf) => inf.id === targetInfluencerId);
      showSuccess(
        res.message ||
          `Engagement rate of ${erValue.toFixed(2)}% successfully assigned to ${targetInfluencerObj?.name || 'influencer'}!`,
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to assign ER value.',
      );
    }
  };

  const getErTierBadge = (er: number) => {
    if (er <= 0) return null;
    if (er >= 3.5) {
      return (
        <Chip
          label="🔥 High Engagement (≥3.5%)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.positiveBg,
            color: theme.palette.tokens.positiveText,
          }}
        />
      );
    }
    if (er >= 1.5) {
      return (
        <Chip
          label="✨ Good Engagement (1.5% – 3.5%)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.accentBg,
            color: theme.palette.tokens.accentText,
          }}
        />
      );
    }
    return (
      <Chip
        label="📉 Low Engagement (<1.5%)"
        size="small"
        sx={{
          fontWeight: 700,
          backgroundColor: theme.palette.tokens.warningBg,
          color: theme.palette.tokens.warningText,
        }}
      />
    );
  };

  return (
    <DashboardLayout
      title="ER Calculator"
      subtitle="Live Instagram Engagement Rate & Pre-Evaluation Metrics via Official Meta Graph API"
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${theme.customSpacing.cardGap}px`,
          pb: 4,
        }}
      >
        {/* Profile Search & Roster Selector Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            {/* Roster Influencer Selector */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete
                options={influencersList}
                loading={influencersLoading}
                loadingText="Loading roster…"
                getOptionLabel={(option) =>
                  option.instagram ? `${option.name} (@${option.instagram})` : option.name
                }
                value={selectedInfluencer}
                onChange={(_, newValue) => {
                  setSelectedInfluencerId(newValue?.id || '');
                  if (newValue) {
                    const handle = newValue.instagram || newValue.name || '';
                    setAutoHandle(handle);
                    if (newValue.avgCommercialMin || newValue.avgCommercialMax) {
                      const fee = newValue.avgCommercialMin || newValue.avgCommercialMax || '';
                      setAutoCommercialFee(String(fee));
                    }
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                size="small"
                renderOption={(props, option) => {
                  return (
                    <Box
                      component="li"
                      {...props}
                      key={option.id}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                    >
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {option.name?.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.tokens.textSecondary }}
                        >
                          {option.instagram ? `@${option.instagram}` : option.category || 'Creator'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select from Roster (Optional)"
                    placeholder="Search roster..."
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PeopleAltRoundedIcon
                                sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }}
                              />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {influencersLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Instagram Handle / URL Input */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Enter Instagram handle or URL (e.g. virat.kohli or https://instagram.com/...)"
                  value={autoHandle}
                  onChange={(e) => setAutoHandle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCalculateAuto();
                  }}
                  size="small"
                  sx={{ flex: 1, minWidth: 260 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <InstagramIcon sx={{ color: theme.palette.tokens.textSecondary }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => void handleCalculateAuto()}
                  disabled={autoLoading || !autoHandle.trim()}
                  startIcon={autoLoading ? <CircularProgress size={18} /> : <CalculateRoundedIcon />}
                  sx={{ height: 40, px: 3, fontWeight: 700 }}
                >
                  {autoLoading ? 'Fetching Profile…' : 'Fetch Profile'}
                </Button>
                {autoResult && (
                  <Tooltip title="Bypass cache and read fresh live metrics from Meta Graph API">
                    <span>
                      <Button
                        variant="outlined"
                        onClick={() => void handleCalculateAuto(true)}
                        disabled={autoLoading}
                        startIcon={<RefreshRoundedIcon />}
                        sx={{ height: 40 }}
                      >
                        Refresh Live
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Error Notice */}
          {autoErrorCode === 'NOT_PROFESSIONAL_ACCOUNT' && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: `${theme.customRadii.card}px`,
                border: `1px solid ${theme.palette.warning.main}`,
                backgroundColor: `${theme.palette.warning.main}14`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <InfoOutlinedIcon sx={{ color: theme.palette.warning.main }} />
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary }}>
                <strong>@{autoHandle.trim()}</strong> is not an Instagram Business or Creator
                account. Meta&apos;s official Graph API only provides insights for Business & Creator
                accounts.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Results Section */}
        {autoResult && (
          <>
            {/* Profile Card */}
            {autoResult.profile && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2.5,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                  <Avatar
                    src={safeImageUrl(autoResult.profile.profilePicUrl)}
                    alt={autoResult.profile.fullName ?? autoResult.instagramHandle}
                    imgProps={{ referrerPolicy: 'no-referrer' }}
                    sx={{ width: 72, height: 72 }}
                  >
                    {(autoResult.profile.fullName ?? autoResult.instagramHandle)
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>

                  <Box sx={{ minWidth: 200 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {autoResult.profile.fullName || `@${autoResult.instagramHandle}`}
                      </Typography>
                      {autoResult.profile.isVerified && (
                        <VerifiedRoundedIcon
                          sx={{ fontSize: 20, color: theme.palette.primary.main }}
                        />
                      )}
                      {autoResult.profile.isPrivate && (
                        <Chip label="Private" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>

                    {safeUrl(`https://www.instagram.com/${autoResult.instagramHandle}/`) && (
                      <Link
                        href={safeUrl(`https://www.instagram.com/${autoResult.instagramHandle}/`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="body2"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        @{autoResult.instagramHandle}
                        <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                      </Link>
                    )}

                    {autoResult.profile.biography && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.tokens.textSecondary,
                          mt: 0.5,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {autoResult.profile.biography}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {[
                      {
                        label: 'Followers',
                        value: autoResult.followersCount
                          ? autoResult.followersCount.toLocaleString()
                          : '—',
                      },
                      {
                        label: 'Following',
                        value: autoResult.followingCount
                          ? autoResult.followingCount.toLocaleString()
                          : '—',
                      },
                      {
                        label: 'Total Posts',
                        value: autoResult.profile.totalPosts
                          ? autoResult.profile.totalPosts.toLocaleString()
                          : '—',
                      },
                    ].map((item) => (
                      <Box key={item.label} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {item.value}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.tokens.textSecondary }}
                        >
                          {item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={
                      assignERMutation.isPending ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckCircleRoundedIcon />
                      )
                    }
                    onClick={() => {
                      if (selectedInfluencerId) {
                        void handleAssignToInfluencer();
                      } else {
                        openAssignDialog();
                      }
                    }}
                    disabled={liveMetrics.engagementRate <= 0 || assignERMutation.isPending}
                    sx={{ height: 40, fontWeight: 700 }}
                  >
                    {assignERMutation.isPending
                      ? 'Assigning...'
                      : selectedInfluencer
                        ? `Assign ER% (${liveMetrics.engagementRate.toFixed(2)}%)`
                        : 'Assign to Influencer'}
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Commercial Fee Input */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: `${theme.customRadii.card}px`,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Quoted Reel Commercial Fee (₹)"
                    placeholder="e.g. 50000 or 50k"
                    value={autoCommercialFee}
                    onChange={(e) => setAutoCommercialFee(e.target.value)}
                    error={
                      autoCommercialFee.trim() !== '' &&
                      !validateNumericInput(autoCommercialFee).isValid
                    }
                    size="small"
                    fullWidth
                    helperText={
                      autoCommercialFee.trim() !== '' &&
                      !validateNumericInput(autoCommercialFee).isValid
                        ? 'Invalid fee amount (e.g. 50k or 50000)'
                        : autoCommercialFeeNum > 0
                          ? `Parsed: ₹${autoCommercialFeeNum.toLocaleString()}`
                          : 'Enter commercial fee to compute Pre-Eval CPV'
                    }
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CurrencyRupeeRoundedIcon
                              sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                  >
                    Pre-Evaluation CPV = Reel Fee ÷ Committed Views (Median of 10 Reels)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    Calculated CPV:{' '}
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 700,
                        color: autoCpv
                          ? theme.palette.tokens.positiveText
                          : theme.palette.tokens.textSecondary,
                      }}
                    >
                      {autoCpv ? `₹${autoCpv.toFixed(2)} / view` : 'Enter fee above'}
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* 3 Result Metric Cards */}
            <Grid container spacing={2.5}>
              {/* ER% Hero Card */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: theme.palette.tokens.accentBg,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.accentText }}
                  >
                    ENGAGEMENT RATE (ER%)
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: theme.palette.tokens.accentText,
                      my: 1,
                    }}
                  >
                    {liveMetrics.engagementRate.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    [(Likes + Comments) ÷ {liveMetrics.count} Posts] ÷ Followers × 100
                  </Typography>
                  {autoResult.likesHidden && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1.5,
                        fontWeight: 600,
                        color: theme.palette.warning.main,
                      }}
                    >
                      ⚠ This creator hides like counts, so this rate reflects comments only.
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Pre-Eval Committed Views Hero Card */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: theme.palette.tokens.purpleBg,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.purpleText }}
                  >
                    PRE-EVAL COMMITTED VIEWS
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: theme.palette.tokens.purpleText,
                      my: 1,
                    }}
                  >
                    {autoCommittedViews > 0
                      ? `${autoCommittedViews.toLocaleString()} views`
                      : '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Median of {autoReelViews.length} analyzed reel views
                  </Typography>
                </Paper>
              </Grid>

              {/* Pre-Eval CPV Hero Card */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: theme.palette.tokens.positiveBg,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText }}
                  >
                    PRE-EVAL CPV (COST PER VIEW)
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: autoCpv
                        ? theme.palette.tokens.positiveText
                        : theme.palette.tokens.textSecondary,
                      my: 1,
                    }}
                  >
                    {autoCpv ? `₹${autoCpv.toFixed(2)} / view` : '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Reel Commercial Fee ÷ Pre-Eval Committed Views
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Analyzed Posts Table */}
            {autoResult.posts.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 3, pb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Analyzed Posts ({liveMetrics.count})
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    The newest {sampleSize} posts by publish date, out of {candidatePosts.length}{' '}
                    fetched. Remove one and the next post moves up in its place. Committed views is
                    the median of the analyzed reel views.
                  </Typography>

                  {/* Trial reels cannot be identified from the API — Instagram
                      reports them as ordinary reels and hides the Reels tab
                      behind a login — so the check is the agency's own eyes.
                      Comparing against that tab is one click away. */}
                  {safeUrl(`https://www.instagram.com/${autoResult.instagramHandle}/reels/`) && (
                    <Link
                      href={safeUrl(
                        `https://www.instagram.com/${autoResult.instagramHandle}/reels/`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 1,
                        fontWeight: 600,
                      }}
                    >
                      Open @{autoResult.instagramHandle}&apos;s Reels tab to check for trial posts
                      <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                    </Link>
                  )}

                  {excludedCount > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1.5,
                        fontWeight: 600,
                        color: theme.palette.tokens.textSecondary,
                      }}
                    >
                      {excludedCount} post{excludedCount === 1 ? '' : 's'} removed by hand and
                      replaced from the standby pool — every figure above is recalculated without
                      them.
                    </Typography>
                  )}

                  {/* Removals outrun the pool once the standby posts are used
                      up. Saying so beats letting the sample quietly shrink. */}
                  {liveMetrics.count < sampleSize && candidatePosts.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        fontWeight: 700,
                        color: theme.palette.warning.dark,
                      }}
                    >
                      No standby posts left to pull in — the rate is now based on{' '}
                      {liveMetrics.count} post{liveMetrics.count === 1 ? '' : 's'}, not {sampleSize}.
                      Use Refresh Live to fetch more.
                    </Typography>
                  )}
                </Box>

                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 720 }}>
                    <TableHead sx={{ backgroundColor: theme.palette.tokens.fieldBg }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 48, textAlign: 'center' }}>
                          #
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Post</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            Date
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                color: theme.palette.tokens.accentText,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              (Latest first ↓)
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Likes
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Comments
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          Views
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ER %
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 64 }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {visiblePosts.map(({ post, key, position }) => {
                        const isReel = post.mediaKind === 'REEL' || post.mediaKind === 'VIDEO';
                        const isExcluded = excludedPostKeys.includes(key);
                        const isActive = activeKeys.has(key);
                        const postDate = new Date(post.takenAt);
                        const formattedDate = !isNaN(postDate.getTime())
                          ? postDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : post.takenAt;
                        const formattedTime = !isNaN(postDate.getTime())
                          ? postDate.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';

                        return (
                          <TableRow
                            key={key}
                            hover
                            sx={{
                              opacity: isActive ? 1 : 0.5,
                              backgroundColor: isExcluded
                                ? theme.palette.tokens.fieldBg
                                : 'transparent',
                              '& td': isExcluded ? { textDecoration: 'line-through' } : undefined,
                            }}
                          >
                            <TableCell
                              align="center"
                              sx={{ fontWeight: 600, color: theme.palette.tokens.textSecondary }}
                            >
                              {position ?? '—'}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  variant="rounded"
                                  src={safeImageUrl(post.thumbnailUrl)}
                                  imgProps={{ referrerPolicy: 'no-referrer' }}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    bgcolor: theme.palette.tokens.fieldBg,
                                    color: isReel
                                      ? theme.palette.tokens.purpleText
                                      : theme.palette.tokens.accentText,
                                  }}
                                >
                                  {isReel ? (
                                    <MovieCreationRoundedIcon />
                                  ) : (
                                    <CollectionsRoundedIcon />
                                  )}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}
                                  >
                                    {post.caption || <em>No caption</em>}
                                  </Typography>
                                  {safeUrl(post.permalink) && (
                                    <Link
                                      href={safeUrl(post.permalink)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      variant="caption"
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.25,
                                      }}
                                    >
                                      View post
                                      <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                                    </Link>
                                  )}

                                  {isExcluded && (
                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
                                      <Chip
                                        label="Removed"
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 22, fontSize: '0.7rem' }}
                                      />
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Tooltip title={formattedTime ? `${formattedDate}, ${formattedTime}` : formattedDate} arrow>
                                <Box component="span" sx={{ cursor: 'default' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {formattedDate}
                                  </Typography>
                                  {formattedTime && (
                                    <Typography
                                      variant="caption"
                                      sx={{ display: 'block', color: theme.palette.tokens.textSecondary }}
                                    >
                                      {formattedTime}
                                    </Typography>
                                  )}
                                </Box>
                              </Tooltip>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={post.mediaKind}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: isReel
                                    ? theme.palette.tokens.purpleText
                                    : theme.palette.tokens.accentText,
                                  color: isReel
                                    ? theme.palette.tokens.purpleText
                                    : theme.palette.tokens.accentText,
                                }}
                              />
                            </TableCell>

                            <TableCell align="right">{post.likes.toLocaleString()}</TableCell>
                            <TableCell align="right">{post.comments.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {post.views === null ? '—' : post.views.toLocaleString()}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 600, color: theme.palette.tokens.accentText }}
                            >
                              {post.engagementRate.toFixed(2)}%
                            </TableCell>

                            <TableCell align="center">
                              <Tooltip
                                title={
                                  isExcluded
                                    ? 'Put this post back in the pool'
                                    : 'Remove this post — the next one moves up in its place'
                                }
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => togglePostExcluded(key)}
                                  aria-label={
                                    isExcluded
                                      ? 'Put this removed post back in the pool'
                                      : `Remove post ${position}`
                                  }
                                  sx={{
                                    color: isExcluded
                                      ? theme.palette.tokens.accentText
                                      : theme.palette.tokens.textSecondary,
                                  }}
                                >
                                  {isExcluded ? (
                                    <UndoRoundedIcon fontSize="small" />
                                  ) : (
                                    <RemoveCircleOutlineRoundedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Evaluation Summary Sheet */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: `${theme.customRadii.card}px`,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Influencer Evaluation Summary
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary }}
                  >
                    Shareable summary report & direct ER assignment to roster
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopyRoundedIcon />}
                    onClick={handleCopyAutoSummary}
                  >
                    Copy Evaluation Report
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  fontSize: theme.typography.body2.fontSize,
                  color: theme.palette.tokens.textPrimary,
                  lineHeight: 1.6,
                }}
              >
                {`📊 Influencer Evaluation Report: ${formatInstagramHandle(autoHandle || autoResult.instagramHandle, 'Influencer')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Followers: ${autoResult.followersCount ? autoResult.followersCount.toLocaleString() : 'Not specified'}
• Analyzed Posts / Reels: ${liveMetrics.count}${excludedCount > 0 ? ` (${excludedCount} excluded by hand)` : ''}
• Total Likes: ${liveMetrics.totalLikes.toLocaleString()} (Avg: ${liveMetrics.avgLikes.toLocaleString()}/post)
• Total Comments: ${liveMetrics.totalComments.toLocaleString()} (Avg: ${liveMetrics.avgComments.toLocaleString()}/post)
• Engagement Rate (ER%): ${liveMetrics.engagementRate.toFixed(2)}%
• Pre-Eval Committed Views: ${autoCommittedViews > 0 ? `${autoCommittedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${autoCommercialFeeNum > 0 ? `₹${autoCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${autoCpv !== null ? `₹${autoCpv.toFixed(2)} / view` : 'Not specified'}`}
              </Box>

              {/* Roster Assignment Link Status Strip */}
              {selectedInfluencer ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.75,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {selectedInfluencer.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {selectedInfluencer.name}
                        </Typography>
                        {selectedInfluencer.instagram && (
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.tokens.textSecondary }}
                          >
                            {formatInstagramHandle(selectedInfluencer.instagram)}
                          </Typography>
                        )}
                        <Chip
                          label="Selected Roster Influencer"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: theme.palette.tokens.purpleBg,
                            color: theme.palette.tokens.purpleText,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.textSecondary }}
                      >
                        {selectedInfluencer.followers
                          ? `${selectedInfluencer.followers.toLocaleString()} followers`
                          : 'Followers pending'}
                        {' • '}Ready to assign calculated ER of{' '}
                        {liveMetrics.engagementRate.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<SwapHorizRoundedIcon />}
                      onClick={openAssignDialog}
                      sx={{
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        color: theme.palette.tokens.textSecondary,
                      }}
                    >
                      Change Influencer
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        assignERMutation.isPending ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <CheckCircleRoundedIcon />
                        )
                      }
                      onClick={() => void handleAssignToInfluencer()}
                      disabled={liveMetrics.engagementRate <= 0 || assignERMutation.isPending}
                      sx={{ fontWeight: 700 }}
                    >
                      {assignERMutation.isPending
                        ? 'Assigning...'
                        : `Assign ER to ${selectedInfluencer.name}`}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.75,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    border: `1px dashed ${theme.palette.tokens.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PeopleAltRoundedIcon
                      sx={{ color: theme.palette.tokens.textSecondary, fontSize: 24 }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        No Influencer Linked to this Calculation
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.textSecondary }}
                      >
                        Assign this calculated Engagement Rate (
                        {liveMetrics.engagementRate.toFixed(2)}%) to an influencer in your roster.
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PeopleAltRoundedIcon />}
                    onClick={openAssignDialog}
                    disabled={liveMetrics.engagementRate <= 0}
                    sx={{ fontWeight: 700 }}
                  >
                    Select Influencer & Assign ER
                  </Button>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Box>

      {/* ========================================================================= */}
      {/* ASSIGN ER TO INFLUENCER DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => !assignERMutation.isPending && setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.purpleBg,
                color: theme.palette.tokens.purpleText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalculateRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Assign ER to Influencer
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Assign calculated engagement rate and metrics to an agency roster profile
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Calculation Preview Summary Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.tokens.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Calculated Metrics (Official Meta API)
                </Typography>
                {getErTierBadge(liveMetrics.engagementRate)}
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                  >
                    Engagement Rate
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: theme.palette.tokens.accentText }}
                  >
                    {liveMetrics.engagementRate.toFixed(2)}%
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                  >
                    Followers
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {autoResult?.followersCount ? autoResult.followersCount.toLocaleString() : '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                  >
                    Committed Views
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {autoCommittedViews > 0 ? autoCommittedViews.toLocaleString() : '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                  >
                    Reel Fee
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {autoCommercialFeeNum > 0 ? `₹${autoCommercialFeeNum.toLocaleString()}` : '—'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Target Influencer Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Select Target Influencer from Roster
              </Typography>
              <Autocomplete
                options={influencersList}
                getOptionLabel={(option) =>
                  option.instagram ? `${option.name} (@${option.instagram})` : option.name
                }
                value={influencersList.find((inf) => inf.id === assignDialogTargetId) || null}
                onChange={(_, newValue) => {
                  setAssignDialogTargetId(newValue?.id || '');
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                renderOption={(props, option) => {
                  return (
                    <Box
                      component="li"
                      {...props}
                      key={option.id}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: theme.palette.primary.main,
                          fontSize: '0.875rem',
                          fontWeight: 700,
                        }}
                      >
                        {option.name?.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.tokens.textSecondary }}
                        >
                          {option.instagram ? `@${option.instagram}` : option.category || 'Creator'}{' '}
                          ·{' '}
                          {option.followers
                            ? `${option.followers.toLocaleString()} followers`
                            : 'Followers pending'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Target Influencer *"
                    placeholder="Search by name or Instagram handle..."
                    size="medium"
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PeopleAltRoundedIcon
                                sx={{ color: theme.palette.tokens.textSecondary, fontSize: 20 }}
                              />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Box>

            {/* Selected influencer confirmation details */}
            {(() => {
              const target = influencersList.find((inf) => inf.id === assignDialogTargetId);
              if (!target) return null;
              return (
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    borderRadius: `${theme.customRadii.inner}px`,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.tokens.positiveText,
                      display: 'block',
                    }}
                  >
                    Assigning to: {target.name} {target.instagram ? `(@${target.instagram})` : ''}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5, display: 'block' }}
                  >
                    This will persist an engagement calculation record and update the influencer
                    profile&apos;s ER metrics in your agency roster.
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setAssignDialogOpen(false)}
            disabled={assignERMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleAssignToInfluencer(assignDialogTargetId)}
            disabled={
              !assignDialogTargetId ||
              liveMetrics.engagementRate <= 0 ||
              assignERMutation.isPending
            }
            startIcon={
              assignERMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircleRoundedIcon />
              )
            }
            sx={{ fontWeight: 700 }}
          >
            {assignERMutation.isPending ? 'Assigning ER...' : 'Confirm & Assign ER'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};
