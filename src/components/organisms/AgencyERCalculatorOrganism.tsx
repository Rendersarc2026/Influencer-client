import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import InstagramIcon from '@mui/icons-material/Instagram';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import MovieCreationRoundedIcon from '@mui/icons-material/MovieCreationRounded';
import CollectionsRoundedIcon from '@mui/icons-material/Collections';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded';
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading, Pill } from '@atoms';
import { useAuth, useToast } from '@hooks';
import {
  apiClient,
  useAgencyInfluencers,
  useAgencyCampaigns,
  useAssignERToInfluencer,
} from '@api';
import {
  safeUrl,
  safeImageUrl,
  calculateMedian,
  calculateEngagementRate,
  calculatePreEvalCpv,
  parseNumberInput,
  parseNumberList,
  ManualPostRowData,
} from '@utils';

type MediaKind = 'REEL' | 'VIDEO' | 'CAROUSEL' | 'IMAGE';

interface AnalyzedPost {
  shortcode: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  mediaKind: MediaKind;
  takenAt: string;
  likes: number;
  comments: number;
  views: number | null;
  engagementRate: number;
}

interface ERProfile {
  fullName: string | null;
  profilePicUrl: string | null;
  biography: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  totalPosts: number | null;
}

interface ERResult {
  instagramHandle: string;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  engagementRate: number;
  source: string;
  fetchedAt: string;
  profile: ERProfile | null;
  posts: AnalyzedPost[];
}

const createInitialRows = (count = 10): ManualPostRowData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    likes: '',
    comments: '',
    views: '',
  }));

export const AgencyERCalculatorOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Active Main Tab: 'manual' | 'auto'
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');

  // Manual Mode Sub-entry: 'table' | 'summary'
  const [manualEntryMode, setManualEntryMode] = useState<'table' | 'summary'>('table');

  // URL parameters (e.g. ?influencerId=...)
  const [searchParams] = useSearchParams();
  const initialInfluencerId = searchParams.get('influencerId') || '';

  // Agency Roster Query
  const { data: influencersData } = useAgencyInfluencers({ limit: 100 });
  const influencersList = useMemo(() => influencersData?.items || [], [influencersData]);

  // Selected Influencer from Roster
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>(initialInfluencerId);
  const selectedInfluencer = useMemo(
    () => influencersList.find((inf) => inf.id === selectedInfluencerId) || null,
    [influencersList, selectedInfluencerId],
  );

  // Agency Campaigns Query (Optional campaign selection)
  const { data: campaignsData } = useAgencyCampaigns({ limit: 100 });
  const campaignsList = useMemo(() => campaignsData?.items || [], [campaignsData]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Assign ER Mutation & Dialog State
  const assignERMutation = useAssignERToInfluencer();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningSource, setAssigningSource] = useState<'manual' | 'auto'>('manual');

  // Manual Mode Inputs
  const [manualHandle, setManualHandle] = useState('');
  const [manualFollowers, setManualFollowers] = useState('');
  const [manualCommercialFee, setManualCommercialFee] = useState('');
  const [manualRows, setManualRows] = useState<ManualPostRowData[]>(createInitialRows(10));

  // Manual Mode Summary Fields (for direct summary entry)
  const [summaryLikes, setSummaryLikes] = useState('');
  const [summaryComments, setSummaryComments] = useState('');
  const [summaryPostsCount, setSummaryPostsCount] = useState('10');
  const [summaryCommittedViews, setSummaryCommittedViews] = useState('');

  // Bulk Paste Dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTargetField, setBulkTargetField] = useState<'views' | 'likes' | 'comments'>('views');
  const [bulkInputText, setBulkInputText] = useState('');

  // Auto Mode Inputs & State
  const [autoHandle, setAutoHandle] = useState('');
  const [autoCommercialFee, setAutoCommercialFee] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<ERResult | null>(null);

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
      setManualHandle(handle);
      setAutoHandle(handle);
      if (selectedInfluencer.followers && selectedInfluencer.followers > 0) {
        setManualFollowers(String(selectedInfluencer.followers));
      }
      if (selectedInfluencer.avgCommercialMin || selectedInfluencer.avgCommercialMax) {
        const fee = selectedInfluencer.avgCommercialMin || selectedInfluencer.avgCommercialMax || '';
        setManualCommercialFee(String(fee));
        setAutoCommercialFee(String(fee));
      }
    }
  }, [selectedInfluencer]);

  // ---------------------------------------------------------------------------
  // Calculations for Manual Mode
  // ---------------------------------------------------------------------------

  const manualFollowersNum = useMemo(
    () => parseNumberInput(manualFollowers),
    [manualFollowers],
  );

  const manualCommercialFeeNum = useMemo(
    () => parseNumberInput(manualCommercialFee),
    [manualCommercialFee],
  );

  // Table calculation
  const tableData = useMemo(() => {
    const parsedRows = manualRows.map((r, index) => {
      const likesNum = parseNumberInput(r.likes);
      const commentsNum = parseNumberInput(r.comments);
      const viewsNum = parseNumberInput(r.views);
      const rowEngagement = likesNum + commentsNum;
      const rowEr =
        manualFollowersNum > 0 && rowEngagement > 0
          ? (rowEngagement / manualFollowersNum) * 100
          : 0;

      return {
        id: r.id,
        postIndex: index + 1,
        likesNum,
        commentsNum,
        viewsNum,
        rowEngagement,
        rowEr,
        hasData: r.likes.trim() !== '' || r.comments.trim() !== '' || r.views.trim() !== '',
      };
    });

    const activeRows = parsedRows.filter((r) => r.hasData);
    const effectiveCount = activeRows.length > 0 ? activeRows.length : manualRows.length;

    const totalLikes = parsedRows.reduce((sum, r) => sum + r.likesNum, 0);
    const totalComments = parsedRows.reduce((sum, r) => sum + r.commentsNum, 0);
    const validViews = parsedRows.filter((r) => r.viewsNum > 0).map((r) => r.viewsNum);
    const committedViews = calculateMedian(validViews);

    const erPercent = calculateEngagementRate(
      totalLikes,
      totalComments,
      effectiveCount,
      manualFollowersNum,
    );

    const cpv = calculatePreEvalCpv(manualCommercialFeeNum, committedViews);

    return {
      parsedRows,
      activeRowsCount: effectiveCount,
      totalLikes,
      totalComments,
      validViews,
      committedViews,
      erPercent,
      cpv,
      avgLikes: effectiveCount > 0 ? Math.round(totalLikes / effectiveCount) : 0,
      avgComments: effectiveCount > 0 ? Math.round(totalComments / effectiveCount) : 0,
    };
  }, [manualRows, manualFollowersNum, manualCommercialFeeNum]);

  // Summary calculation (when using direct summary totals)
  const summaryData = useMemo(() => {
    const totalLikes = parseNumberInput(summaryLikes);
    const totalComments = parseNumberInput(summaryComments);
    const postsCount = parseNumberInput(summaryPostsCount) || 10;
    const committedViews = parseNumberInput(summaryCommittedViews);

    const erPercent = calculateEngagementRate(
      totalLikes,
      totalComments,
      postsCount,
      manualFollowersNum,
    );

    const cpv = calculatePreEvalCpv(manualCommercialFeeNum, committedViews);

    return {
      totalLikes,
      totalComments,
      postsCount,
      committedViews,
      erPercent,
      cpv,
      avgLikes: postsCount > 0 ? Math.round(totalLikes / postsCount) : 0,
      avgComments: postsCount > 0 ? Math.round(totalComments / postsCount) : 0,
    };
  }, [
    summaryLikes,
    summaryComments,
    summaryPostsCount,
    summaryCommittedViews,
    manualFollowersNum,
    manualCommercialFeeNum,
  ]);

  // Effective manual calculations based on active sub-mode
  const effectiveManual = manualEntryMode === 'table' ? tableData : summaryData;

  // ---------------------------------------------------------------------------
  // Calculations for Auto Mode
  // ---------------------------------------------------------------------------

  const autoCommercialFeeNum = useMemo(
    () => parseNumberInput(autoCommercialFee),
    [autoCommercialFee],
  );

  const autoReelViews = useMemo(() => {
    if (!autoResult?.posts) return [];
    return autoResult.posts
      .filter(
        (p) =>
          (p.mediaKind === 'REEL' || p.mediaKind === 'VIDEO') &&
          p.views !== null &&
          p.views > 0,
      )
      .slice(0, 10)
      .map((p) => p.views as number);
  }, [autoResult]);

  const autoCommittedViews = useMemo(
    () => calculateMedian(autoReelViews),
    [autoReelViews],
  );

  const autoCpv = useMemo(
    () => calculatePreEvalCpv(autoCommercialFeeNum, autoCommittedViews),
    [autoCommercialFeeNum, autoCommittedViews],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleRowChange = (
    index: number,
    field: 'likes' | 'comments' | 'views',
    value: string,
  ) => {
    setManualRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddRow = () => {
    setManualRows((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        likes: '',
        comments: '',
        views: '',
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setManualRows((prev) => {
      if (prev.length <= 1) {
        return [{ id: '1', likes: '', comments: '', views: '' }];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearManual = () => {
    setManualHandle('');
    setManualFollowers('');
    setManualCommercialFee('');
    setManualRows(createInitialRows(10));
    setSummaryLikes('');
    setSummaryComments('');
    setSummaryPostsCount('10');
    setSummaryCommittedViews('');
    showSuccess('Calculator reset successfully');
  };

  const handleOpenBulkDialog = (field: 'views' | 'likes' | 'comments') => {
    setBulkTargetField(field);
    setBulkInputText('');
    setBulkDialogOpen(true);
  };

  const handleApplyBulkData = () => {
    const parsedList = parseNumberList(bulkInputText);
    if (parsedList.length === 0) {
      showError('No valid numbers found in the pasted text');
      return;
    }

    setManualRows((prev) => {
      const targetLength = Math.max(prev.length, parsedList.length);
      const next: ManualPostRowData[] = [];

      for (let i = 0; i < targetLength; i++) {
        const existing = prev[i] || {
          id: String(i + 1),
          likes: '',
          comments: '',
          views: '',
        };
        const valToSet = i < parsedList.length ? String(parsedList[i]) : existing[bulkTargetField];
        next.push({
          ...existing,
          [bulkTargetField]: valToSet,
        });
      }
      return next;
    });

    setBulkDialogOpen(false);
    showSuccess(`Applied ${parsedList.length} values to ${bulkTargetField}`);
  };

  const handleCopySummary = () => {
    const handleLabel = manualHandle.trim()
      ? manualHandle.startsWith('@')
        ? manualHandle.trim()
        : `@${manualHandle.trim()}`
      : 'Influencer';

    const postsAnalyzed =
      manualEntryMode === 'table' ? tableData.activeRowsCount : summaryData.postsCount;

    const reportText = `📊 Influencer Evaluation Report: ${handleLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Followers: ${manualFollowersNum > 0 ? manualFollowersNum.toLocaleString() : 'Not specified'}
• Analyzed Posts: ${postsAnalyzed}
• Total Likes: ${effectiveManual.totalLikes.toLocaleString()} (Avg: ${effectiveManual.avgLikes.toLocaleString()}/post)
• Total Comments: ${effectiveManual.totalComments.toLocaleString()} (Avg: ${effectiveManual.avgComments.toLocaleString()}/post)
• Engagement Rate (ER%): ${effectiveManual.erPercent.toFixed(2)}%
• Pre-Eval Committed Views: ${effectiveManual.committedViews > 0 ? `${effectiveManual.committedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${manualCommercialFeeNum > 0 ? `₹${manualCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${effectiveManual.cpv !== null ? `₹${effectiveManual.cpv.toFixed(2)} / view` : 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formula: ER% = [(Likes + Comments) ÷ Posts] ÷ Followers × 100
Formula: Committed Views = Median of Latest 10 Reel Views
Formula: Pre-Eval CPV = Reel Fee ÷ Committed Views`;

    navigator.clipboard.writeText(reportText);
    showSuccess('Evaluation report copied to clipboard');
  };

  const handleCalculateAuto = async () => {
    const trimmed = autoHandle.trim();
    if (!trimmed) return;

    setAutoLoading(true);
    setAutoResult(null);

    try {
      const res = await apiClient.post<ERResult>('/er-calculator', {
        instagramHandle: trimmed,
      });
      setAutoResult(res.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to calculate engagement rate';
      showError(message);
    } finally {
      setAutoLoading(false);
    }
  };

  const handleTransferToManual = () => {
    if (!autoResult) return;

    setManualHandle(autoResult.instagramHandle);
    setManualFollowers(autoResult.followersCount ? String(autoResult.followersCount) : '');
    if (autoCommercialFee) {
      setManualCommercialFee(autoCommercialFee);
    }

    if (autoResult.posts.length > 0) {
      const transferredRows: ManualPostRowData[] = autoResult.posts
        .slice(0, 10)
        .map((p, idx) => ({
          id: String(idx + 1),
          likes: String(p.likes),
          comments: String(p.comments),
          views: p.views !== null ? String(p.views) : '',
        }));

      while (transferredRows.length < 10) {
        transferredRows.push({
          id: String(transferredRows.length + 1),
          likes: '',
          comments: '',
          views: '',
        });
      }

      setManualRows(transferredRows);
    }

    setActiveTab('manual');
    setManualEntryMode('table');
    showSuccess('Transferred Instagram profile data to Manual Calculator');
  };

  const handleOpenAssignDialog = (source: 'manual' | 'auto') => {
    setAssigningSource(source);
    setAssignDialogOpen(true);
  };

  const handleAssignToInfluencer = async () => {
    const isManual = assigningSource === 'manual';
    const targetInfluencerId = selectedInfluencerId;

    if (!targetInfluencerId) {
      showError('Please select an influencer from your roster to assign this ER value.');
      return;
    }

    const erValue = isManual ? effectiveManual.erPercent : autoResult?.engagementRate || 0;
    if (erValue <= 0) {
      showError('Engagement Rate must be greater than 0% to assign.');
      return;
    }

    const followers = isManual
      ? manualFollowersNum
      : (autoResult?.followersCount || manualFollowersNum);
    const commFee = isManual ? manualCommercialFeeNum : (autoCommercialFeeNum || manualCommercialFeeNum);
    const committedViews = isManual ? effectiveManual.committedViews : autoCommittedViews;
    const handle = isManual ? manualHandle : (autoHandle || manualHandle);

    try {
      const res = await assignERMutation.mutateAsync({
        influencerId: targetInfluencerId,
        engagementRate: Number(erValue.toFixed(2)),
        followersCount: followers > 0 ? followers : undefined,
        commercialFee: commFee > 0 ? commFee : undefined,
        avgViews: committedViews > 0 ? committedViews : undefined,
        avgLikes: effectiveManual.avgLikes > 0 ? effectiveManual.avgLikes : (autoResult?.avgLikes ?? undefined),
        avgComments: effectiveManual.avgComments > 0 ? effectiveManual.avgComments : (autoResult?.avgComments ?? undefined),
        postsCount: isManual
          ? (manualEntryMode === 'table' ? tableData.activeRowsCount : summaryData.postsCount)
          : (autoResult?.postsCount ?? undefined),
        instagramHandle: handle || undefined,
        campaignMapperId: selectedCampaignId || undefined,
        source: isManual ? 'MANUAL_CALCULATOR' : (autoResult?.source || 'AUTO_FETCH'),
        rawResponse: isManual ? { tableData: manualRows, summaryData } : { autoResult },
      });

      showSuccess(
        res.message ||
          `Engagement rate of ${erValue.toFixed(2)}% successfully assigned to ${selectedInfluencer?.name || 'influencer'}!`,
      );
      setAssignDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to assign ER value.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const getErTierBadge = (er: number) => {
    if (er <= 0) return null;
    if (er >= 4.0) {
      return (
        <Chip
          label="🔥 High ER (≥4%)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.purpleBg,
            color: theme.palette.tokens.purpleText,
          }}
        />
      );
    }
    if (er >= 2.0) {
      return (
        <Chip
          label="✨ Good ER (2%–4%)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.positiveBg,
            color: theme.palette.tokens.positiveText,
          }}
        />
      );
    }
    if (er >= 1.0) {
      return (
        <Chip
          label="⚖️ Average ER (1%–2%)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.fieldBg,
            color: theme.palette.tokens.textSecondary,
          }}
        />
      );
    }
    return (
      <Chip
        label="❄️ Low ER (<1%)"
        size="small"
        sx={{
          fontWeight: 700,
          backgroundColor: theme.palette.tokens.warningBg,
          color: theme.palette.tokens.warningText,
        }}
      />
    );
  };

  const getCpvEfficiencyBadge = (cpv: number | null) => {
    if (cpv === null || cpv <= 0) return null;
    if (cpv <= 1.0) {
      return (
        <Chip
          label="💎 Highly Cost Effective (≤ ₹1)"
          size="small"
          sx={{
            fontWeight: 700,
            backgroundColor: theme.palette.tokens.positiveBg,
            color: theme.palette.tokens.positiveText,
          }}
        />
      );
    }
    if (cpv <= 2.5) {
      return (
        <Chip
          label="✅ Healthy CPV (₹1 – ₹2.5)"
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
        label="⚠️ High CPV (> ₹2.5)"
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
      navItems={navConfig.AGENCY}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      title="ER Calculator"
    >
      <SectionHeading
        title="Engagement Rate & Pre-Evaluation Calculator"
        subtitle="Calculate ER%, Pre-Evaluation Committed Views, and CPV manually or fetch from Instagram"
      />

      {/* Top Navigation & Mode Switcher */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Pill
            label="Manual Calculator"
            selected={activeTab === 'manual'}
            onClick={() => setActiveTab('manual')}
            icon={<CalculateRoundedIcon sx={{ fontSize: 18 }} />}
          />
          <Pill
            label="Auto Profile Fetch"
            selected={activeTab === 'auto'}
            onClick={() => setActiveTab('auto')}
            icon={<InstagramIcon sx={{ fontSize: 18 }} />}
          />
        </Box>

        {activeTab === 'manual' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={handleCopySummary}
              sx={{ height: 32 }}
            >
              Copy Report
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<RefreshRoundedIcon />}
              onClick={handleClearManual}
              sx={{ height: 32 }}
            >
              Reset
            </Button>
          </Box>
        )}
      </Box>

      {/* ========================================================================= */}
      {/* MANUAL CALCULATOR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Formula Reference Explainer Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.tokens.fieldBg,
              border: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <FunctionsRoundedIcon sx={{ color: theme.palette.tokens.accentText, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Standard Evaluation Equations
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.accentText, display: 'block' }}
                  >
                    1. ER% (Engagement Rate)
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mt: 0.5 }}>
                    [(Total Likes + Total Comments) ÷ Number of Posts] ÷ Followers × 100
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.purpleText, display: 'block' }}
                  >
                    2. Pre Eval Committed Views
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mt: 0.5 }}>
                    Committed Views = Median of Latest 10 Reel Views
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText, display: 'block' }}
                  >
                    3. Pre Eval CPV (Cost Per View)
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mt: 0.5 }}>
                    Reel Commercial Fee ÷ Pre Eval Committed Views
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Primary Inputs Card: Influencer & Rate Setup */}
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
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Influencer & Deal Parameters
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Select an influencer from your roster to auto-fill details, or input parameters manually.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                startIcon={<PersonAddAlt1RoundedIcon />}
                onClick={() => handleOpenAssignDialog('manual')}
                disabled={effectiveManual.erPercent <= 0}
                sx={{ height: 32 }}
              >
                Assign ER to Influencer
              </Button>
            </Box>

            {/* Roster Autocomplete & Campaign Selector Row */}
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={influencersList}
                  getOptionLabel={(option) =>
                    option.instagram ? `${option.name} (@${option.instagram})` : option.name
                  }
                  value={selectedInfluencer}
                  onChange={(_, newValue) => {
                    setSelectedInfluencerId(newValue?.id || '');
                    setSelectedCampaignId('');
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Influencer from Roster (Optional)"
                      placeholder="Search by name or Instagram handle..."
                      size="small"
                      helperText={
                        selectedInfluencer
                          ? `Roster match: ${selectedInfluencer.name} • ${selectedInfluencer.followers ? `${selectedInfluencer.followers.toLocaleString()} followers` : 'Followers not set'}`
                          : 'Optional — pick an existing influencer to assign this calculation to'
                      }
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <PeopleAltRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl size="small" fullWidth disabled={campaignsList.length === 0}>
                  <InputLabel id="param-campaign-select-label">Assign to Campaign (Optional Pre-Eval)</InputLabel>
                  <Select
                    labelId="param-campaign-select-label"
                    label="Assign to Campaign (Optional Pre-Eval)"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None (Save to Influencer Profile Only)</em>
                    </MenuItem>
                    {campaignsList.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Influencer Handle / Name (Optional)"
                  placeholder="e.g. @ananyapandey"
                  value={manualHandle}
                  onChange={(e) => setManualHandle(e.target.value)}
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <InstagramIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Followers Count *"
                  placeholder="e.g. 100k or 100000"
                  value={manualFollowers}
                  onChange={(e) => setManualFollowers(e.target.value)}
                  size="small"
                  fullWidth
                  helperText={
                    manualFollowersNum > 0
                      ? `Parsed: ${manualFollowersNum.toLocaleString()} followers`
                      : 'Required to compute ER%'
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PeopleAltRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Reel Commercial Fee (₹)"
                  placeholder="e.g. 50k or 50000"
                  value={manualCommercialFee}
                  onChange={(e) => setManualCommercialFee(e.target.value)}
                  size="small"
                  fullWidth
                  helperText={
                    manualCommercialFeeNum > 0
                      ? `Parsed: ₹${manualCommercialFeeNum.toLocaleString()}`
                      : 'Required to compute Pre-Eval CPV'
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupeeRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 3 HERO RESULT CARDS */}
          <Grid container spacing={2.5}>
            {/* Hero Card 1: ER% */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.tokens.accentBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: theme.palette.tokens.accentText,
                      }}
                    >
                      Engagement Rate (ER%)
                    </Typography>
                    {getErTierBadge(effectiveManual.erPercent)}
                  </Box>

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color:
                        effectiveManual.erPercent > 0
                          ? theme.palette.tokens.accentText
                          : theme.palette.tokens.textSecondary,
                      my: 1,
                    }}
                  >
                    {effectiveManual.erPercent > 0 ? `${effectiveManual.erPercent.toFixed(2)}%` : '0.00%'}
                  </Typography>

                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    {manualFollowersNum > 0
                      ? `Based on ${effectiveManual.totalLikes.toLocaleString()} likes & ${effectiveManual.totalComments.toLocaleString()} comments across ${manualEntryMode === 'table' ? tableData.activeRowsCount : summaryData.postsCount} posts`
                      : 'Enter followers count above to calculate ER%'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 1.5,
                    borderTop: `1px dashed ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.accentText, fontWeight: 600 }}>
                    Formula: [(Likes + Comments) ÷ Posts] ÷ Followers × 100
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Hero Card 2: Committed Views */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.tokens.purpleBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: theme.palette.tokens.purpleText,
                      }}
                    >
                      Pre-Eval Committed Views
                    </Typography>
                    {effectiveManual.committedViews > 0 && (
                      <Chip
                        label="Median Value"
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: theme.palette.background.paper,
                          color: theme.palette.tokens.purpleText,
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color:
                        effectiveManual.committedViews > 0
                          ? theme.palette.tokens.purpleText
                          : theme.palette.tokens.textSecondary,
                      my: 1,
                    }}
                  >
                    {effectiveManual.committedViews > 0
                      ? `${effectiveManual.committedViews.toLocaleString()} views`
                      : '0 views'}
                  </Typography>

                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    {manualEntryMode === 'table'
                      ? tableData.validViews.length > 0
                        ? `Computed from median of ${tableData.validViews.length} reel view inputs`
                        : 'Enter reel views in the table below to calculate median'
                      : summaryData.committedViews > 0
                        ? 'Committed views set directly'
                        : 'Enter committed views value'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 1.5,
                    borderTop: `1px dashed ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.purpleText, fontWeight: 600 }}>
                    Formula: Committed Views = Median of Latest 10 Reel Views
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Hero Card 3: Pre-Eval CPV */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.tokens.positiveBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: theme.palette.tokens.positiveText,
                      }}
                    >
                      Pre-Eval CPV (Cost Per View)
                    </Typography>
                    {getCpvEfficiencyBadge(effectiveManual.cpv)}
                  </Box>

                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color:
                        effectiveManual.cpv !== null
                          ? theme.palette.tokens.positiveText
                          : theme.palette.tokens.textSecondary,
                      my: 1,
                    }}
                  >
                    {effectiveManual.cpv !== null ? `₹${effectiveManual.cpv.toFixed(2)} / view` : '—'}
                  </Typography>

                  <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                    {manualCommercialFeeNum > 0 && effectiveManual.committedViews > 0
                      ? `₹${manualCommercialFeeNum.toLocaleString()} fee ÷ ${effectiveManual.committedViews.toLocaleString()} committed views`
                      : 'Requires both Commercial Fee & Committed Views'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 1.5,
                    borderTop: `1px dashed ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.positiveText, fontWeight: 600 }}>
                    Formula: Reel Commercial Fee ÷ Pre Eval Committed Views
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Posts Data Entry Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            {/* Header & Sub-mode toggle */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Posts & Reels Data Breakdown
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Input data for the latest 10 posts/reels or enter aggregated totals directly
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Pill
                  label="10 Reels Grid"
                  selected={manualEntryMode === 'table'}
                  onClick={() => setManualEntryMode('table')}
                />
                <Pill
                  label="Direct Totals"
                  selected={manualEntryMode === 'summary'}
                  onClick={() => setManualEntryMode('summary')}
                />
              </Box>
            </Box>

            {/* Table Entry Mode */}
            {manualEntryMode === 'table' && (
              <>
                {/* Table Action Bar */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.textSecondary, mr: 1 }}>
                      Quick Bulk Paste:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlaylistAddRoundedIcon />}
                      onClick={() => handleOpenBulkDialog('views')}
                      sx={{ height: 28 }}
                    >
                      Paste 10 Reel Views
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlaylistAddRoundedIcon />}
                      onClick={() => handleOpenBulkDialog('likes')}
                      sx={{ height: 28 }}
                    >
                      Paste Likes
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlaylistAddRoundedIcon />}
                      onClick={() => handleOpenBulkDialog('comments')}
                      sx={{ height: 28 }}
                    >
                      Paste Comments
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<AddRoundedIcon />}
                      onClick={handleAddRow}
                      sx={{ height: 28 }}
                    >
                      Add Row
                    </Button>
                  </Box>
                </Box>

                {/* 10 Posts Table */}
                <TableContainer
                  sx={{
                    borderRadius: `${theme.customRadii.inner}px`,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    overflowX: 'auto',
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: theme.palette.tokens.fieldBg }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 80 }}>Post #</TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>
                          Likes
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>
                          Comments
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                          Reel Views (for Median)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, minWidth: 130 }}>
                          Engagement
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>
                          Post ER%
                        </TableCell>
                        <TableCell align="center" sx={{ width: 60 }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableData.parsedRows.map((row, index) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            backgroundColor:
                              index % 2 === 0 ? 'transparent' : theme.palette.tokens.tableHover,
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.tokens.textSecondary }}>
                            Reel {index + 1}
                          </TableCell>

                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="e.g. 1200 or 1.2k"
                              value={manualRows[index]?.likes ?? ''}
                              onChange={(e) => handleRowChange(index, 'likes', e.target.value)}
                              fullWidth
                              slotProps={{
                                input: {
                                  sx: {
                                    height: 36,
                                    fontSize: theme.typography.body2.fontSize,
                                  },
                                },
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="e.g. 85"
                              value={manualRows[index]?.comments ?? ''}
                              onChange={(e) => handleRowChange(index, 'comments', e.target.value)}
                              fullWidth
                              slotProps={{
                                input: {
                                  sx: {
                                    height: 36,
                                    fontSize: theme.typography.body2.fontSize,
                                  },
                                },
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="e.g. 45000 or 45k"
                              value={manualRows[index]?.views ?? ''}
                              onChange={(e) => handleRowChange(index, 'views', e.target.value)}
                              fullWidth
                              slotProps={{
                                input: {
                                  sx: {
                                    height: 36,
                                    fontSize: theme.typography.body2.fontSize,
                                  },
                                },
                              }}
                            />
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {row.rowEngagement > 0 ? row.rowEngagement.toLocaleString() : '—'}
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.tokens.accentText }}>
                            {row.rowEr > 0 ? `${row.rowEr.toFixed(2)}%` : '—'}
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip title="Delete row">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteRow(index)}
                                sx={{ color: theme.palette.tokens.textSecondary }}
                              >
                                <DeleteOutlineRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Summary Table Footer */}
                      <TableRow
                        sx={{
                          backgroundColor: theme.palette.tokens.fieldBg,
                          borderTop: `2px solid ${theme.palette.tokens.divider}`,
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800 }}>
                          Total ({tableData.activeRowsCount} Posts)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {tableData.totalLikes.toLocaleString()} likes
                          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                            Avg: {tableData.avgLikes.toLocaleString()}/post
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {tableData.totalComments.toLocaleString()} comments
                          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                            Avg: {tableData.avgComments.toLocaleString()}/post
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: theme.palette.tokens.purpleText }}>
                          Median: {tableData.committedViews.toLocaleString()} views
                          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                            From {tableData.validViews.length} reel view inputs
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          {(tableData.totalLikes + tableData.totalComments).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: theme.palette.tokens.accentText }}>
                          {tableData.erPercent > 0 ? `${tableData.erPercent.toFixed(2)}%` : '0.00%'}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Direct Summary Entry Mode */}
            {manualEntryMode === 'summary' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Total Likes"
                      placeholder="e.g. 45000 or 45k"
                      value={summaryLikes}
                      onChange={(e) => setSummaryLikes(e.target.value)}
                      size="small"
                      fullWidth
                      helperText={
                        summaryData.totalLikes > 0
                          ? `Parsed: ${summaryData.totalLikes.toLocaleString()}`
                          : 'Sum of likes across all analyzed posts'
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Total Comments"
                      placeholder="e.g. 3200 or 3.2k"
                      value={summaryComments}
                      onChange={(e) => setSummaryComments(e.target.value)}
                      size="small"
                      fullWidth
                      helperText={
                        summaryData.totalComments > 0
                          ? `Parsed: ${summaryData.totalComments.toLocaleString()}`
                          : 'Sum of comments across all analyzed posts'
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Number of Analyzed Posts"
                      placeholder="e.g. 10"
                      value={summaryPostsCount}
                      onChange={(e) => setSummaryPostsCount(e.target.value)}
                      size="small"
                      fullWidth
                      helperText="Default is 10 latest posts"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Pre-Eval Committed Views"
                      placeholder="e.g. 35000 or 35k"
                      value={summaryCommittedViews}
                      onChange={(e) => setSummaryCommittedViews(e.target.value)}
                      size="small"
                      fullWidth
                      helperText={
                        summaryData.committedViews > 0
                          ? `Parsed: ${summaryData.committedViews.toLocaleString()} views`
                          : 'Median of latest 10 reels'
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Influencer Evaluation Summary
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={handleCopySummary}
              >
                Copy Evaluation Report
              </Button>
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
              {`📊 Influencer Evaluation Report: ${
                manualHandle.trim()
                  ? manualHandle.startsWith('@')
                    ? manualHandle.trim()
                    : `@${manualHandle.trim()}`
                  : 'Influencer'
              }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Followers: ${manualFollowersNum > 0 ? manualFollowersNum.toLocaleString() : 'Not specified'}
• Analyzed Posts / Reels: ${manualEntryMode === 'table' ? tableData.activeRowsCount : summaryData.postsCount}
• Total Likes: ${effectiveManual.totalLikes.toLocaleString()} (Avg: ${effectiveManual.avgLikes.toLocaleString()}/post)
• Total Comments: ${effectiveManual.totalComments.toLocaleString()} (Avg: ${effectiveManual.avgComments.toLocaleString()}/post)
• Engagement Rate (ER%): ${effectiveManual.erPercent.toFixed(2)}%
• Pre-Eval Committed Views: ${effectiveManual.committedViews > 0 ? `${effectiveManual.committedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${manualCommercialFeeNum > 0 ? `₹${manualCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${effectiveManual.cpv !== null ? `₹${effectiveManual.cpv.toFixed(2)} / view` : 'Not specified'}`}
            </Box>
          </Paper>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* AUTO INSTAGRAM PROFILE FETCH TAB */}
      {/* ========================================================================= */}
      {activeTab === 'auto' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Profile Search Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Enter Instagram handle or URL (e.g. virat.kohli or https://instagram.com/...)"
                value={autoHandle}
                onChange={(e) => setAutoHandle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCalculateAuto();
                }}
                size="small"
                sx={{ flex: 1, minWidth: 280 }}
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
                onClick={handleCalculateAuto}
                disabled={autoLoading || !autoHandle.trim()}
                startIcon={autoLoading ? <CircularProgress size={18} /> : <CalculateRoundedIcon />}
                sx={{ height: 40, px: 3 }}
              >
                {autoLoading ? 'Fetching Profile…' : 'Fetch Profile'}
              </Button>
            </Box>
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
                      {(autoResult.profile.fullName ?? autoResult.instagramHandle).charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {autoResult.profile.fullName || `@${autoResult.instagramHandle}`}
                        </Typography>
                        {autoResult.profile.isVerified && (
                          <VerifiedRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
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
                          sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5, whiteSpace: 'pre-line' }}
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
                          value: autoResult.followersCount ? autoResult.followersCount.toLocaleString() : '—',
                        },
                        {
                          label: 'Following',
                          value: autoResult.followingCount ? autoResult.followingCount.toLocaleString() : '—',
                        },
                        {
                          label: 'Total Posts',
                          value: autoResult.profile.totalPosts ? autoResult.profile.totalPosts.toLocaleString() : '—',
                        },
                      ].map((item) => (
                        <Box key={item.label} sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Button
                      variant="outlined"
                      startIcon={<SwapHorizRoundedIcon />}
                      onClick={handleTransferToManual}
                      sx={{ height: 40 }}
                    >
                      Load into Manual Calc
                    </Button>

                    <Button
                      variant="contained"
                      startIcon={<PersonAddAlt1RoundedIcon />}
                      onClick={() => handleOpenAssignDialog('auto')}
                      sx={{ height: 40 }}
                    >
                      Assign to Influencer
                    </Button>
                  </Box>
                </Paper>
              )}

              {/* Commercial Fee Input for Auto Mode */}
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
                      size="small"
                      fullWidth
                      helperText="Enter commercial fee to compute Pre-Eval CPV"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CurrencyRupeeRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                      Pre-Evaluation CPV = Reel Fee ÷ Committed Views (Median of 10 Reels)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      Calculated CPV:{' '}
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: autoCpv ? theme.palette.tokens.positiveText : theme.palette.tokens.textSecondary,
                        }}
                      >
                        {autoCpv ? `₹${autoCpv.toFixed(2)} / view` : 'Enter fee above'}
                      </Typography>
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* 3 Result Metric Cards for Auto Mode */}
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
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.accentText }}>
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
                      {autoResult.engagementRate.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                      [(Likes + Comments) ÷ {autoResult.posts.length} Posts] ÷ Followers × 100
                    </Typography>
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
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.purpleText }}>
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
                      {autoCommittedViews > 0 ? `${autoCommittedViews.toLocaleString()} views` : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                      Median of latest {autoReelViews.length} reel views
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
                    <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText }}>
                      PRE-EVAL CPV (COST PER VIEW)
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: autoCpv ? theme.palette.tokens.positiveText : theme.palette.tokens.textSecondary,
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
                      Analyzed Posts ({autoResult.posts.length})
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                      Latest {autoResult.posts.length} posts retrieved by publish date. Committed views is calculated from the median of reel views.
                    </Typography>
                  </Box>

                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 720 }}>
                      <TableHead sx={{ backgroundColor: theme.palette.tokens.fieldBg }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 48, textAlign: 'center' }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Post</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Likes</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Comments</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Views</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>ER %</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {autoResult.posts.map((post, index) => {
                          const isReel = post.mediaKind === 'REEL' || post.mediaKind === 'VIDEO';
                          return (
                            <TableRow key={post.shortcode ?? index} hover>
                              <TableCell align="center" sx={{ fontWeight: 600, color: theme.palette.tokens.textSecondary }}>
                                {index + 1}
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
                                      color: isReel ? theme.palette.tokens.purpleText : theme.palette.tokens.accentText,
                                    }}
                                  >
                                    {isReel ? <MovieCreationRoundedIcon /> : <CollectionsRoundedIcon />}
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
                                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                                      >
                                        View post
                                        <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                                      </Link>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>

                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {new Date(post.takenAt).toLocaleDateString()}
                              </TableCell>

                              <TableCell>
                                <Chip
                                  label={post.mediaKind}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: isReel ? theme.palette.tokens.purpleText : theme.palette.tokens.accentText,
                                    color: isReel ? theme.palette.tokens.purpleText : theme.palette.tokens.accentText,
                                  }}
                                />
                              </TableCell>

                              <TableCell align="right">{post.likes.toLocaleString()}</TableCell>
                              <TableCell align="right">{post.comments.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                {post.views === null ? '—' : post.views.toLocaleString()}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.tokens.accentText }}>
                                {post.engagementRate.toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </>
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* BULK PASTE HELPER DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Bulk Paste {bulkTargetField === 'views' ? 'Reel Views' : bulkTargetField === 'likes' ? 'Likes' : 'Comments'}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            Paste numbers from a spreadsheet column or comma/space-separated text (e.g. 45k, 32k, 18k, 25k...)
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
            <TextField
              multiline
              rows={6}
              placeholder="Paste numbers here (e.g. 45000, 32000, 28000, 51000... or 45k 32k 28k)"
              value={bulkInputText}
              onChange={(e) => setBulkInputText(e.target.value)}
              fullWidth
              autoFocus
            />

            {bulkInputText.trim() && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.accentText }}>
                  Preview ({parseNumberList(bulkInputText).length} numbers recognized):
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                  {parseNumberList(bulkInputText)
                    .map((n) => n.toLocaleString())
                    .join(', ') || 'No valid numbers found'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setBulkDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyBulkData}
            disabled={parseNumberList(bulkInputText).length === 0}
          >
            Apply to Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* ASSIGN ER TO INFLUENCER DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
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
                backgroundColor: theme.palette.tokens.accentBg,
                color: theme.palette.tokens.accentText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonAddAlt1RoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Assign Engagement Rate to Influencer
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Save calculated ER metrics to influencer profile and active campaign pre-evaluations.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            {/* Target Influencer Selection */}
            <Autocomplete
              options={influencersList}
              getOptionLabel={(option) =>
                option.instagram ? `${option.name} (@${option.instagram})` : option.name
              }
              value={selectedInfluencer}
              onChange={(_, newValue) => {
                setSelectedInfluencerId(newValue?.id || '');
                setSelectedCampaignId('');
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Target Influencer *"
                  placeholder="Search influencer roster..."
                  size="small"
                  helperText={
                    selectedInfluencer
                      ? `Selected: ${selectedInfluencer.name} (${selectedInfluencer.followers?.toLocaleString() || 0} followers)`
                      : 'Choose an influencer from your roster to assign the ER value to'
                  }
                />
              )}
            />

            {/* Campaign Selection (Optional) */}
            {campaignsList.length > 0 && (
              <FormControl size="small" fullWidth>
                <InputLabel id="dialog-campaign-select-label">Assign to Campaign (Optional Pre-Evaluation)</InputLabel>
                <Select
                  labelId="dialog-campaign-select-label"
                  label="Assign to Campaign (Optional Pre-Evaluation)"
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>None (Save to Influencer Profile Only)</em>
                  </MenuItem>
                  {campaignsList.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Metric Summary Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Metrics To Be Saved & Assigned
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Engagement Rate (ER%)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.tokens.accentText }}>
                    {assigningSource === 'manual'
                      ? `${effectiveManual.erPercent.toFixed(2)}%`
                      : `${(autoResult?.engagementRate || 0).toFixed(2)}%`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Committed Views (Median)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.tokens.purpleText }}>
                    {assigningSource === 'manual'
                      ? `${effectiveManual.committedViews.toLocaleString()} views`
                      : `${(autoCommittedViews || 0).toLocaleString()} views`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Followers Count
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {assigningSource === 'manual'
                      ? manualFollowersNum > 0
                        ? manualFollowersNum.toLocaleString()
                        : 'Not specified'
                      : autoResult?.followersCount
                        ? autoResult.followersCount.toLocaleString()
                        : manualFollowersNum > 0
                          ? manualFollowersNum.toLocaleString()
                          : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Commercial Fee
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {assigningSource === 'manual'
                      ? manualCommercialFeeNum > 0
                        ? `₹${manualCommercialFeeNum.toLocaleString()}`
                        : 'Not specified'
                      : autoCommercialFeeNum > 0
                        ? `₹${autoCommercialFeeNum.toLocaleString()}`
                        : manualCommercialFeeNum > 0
                          ? `₹${manualCommercialFeeNum.toLocaleString()}`
                          : 'Not specified'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setAssignDialogOpen(false)} disabled={assignERMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignToInfluencer}
            disabled={!selectedInfluencerId || assignERMutation.isPending}
            startIcon={assignERMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon />}
          >
            {assignERMutation.isPending ? 'Assigning...' : 'Confirm & Assign ER'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};
