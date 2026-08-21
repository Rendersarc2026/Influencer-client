import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { Pill } from '@atoms';
import { useAuth, useToast } from '@hooks';
import {
  apiClient,
  useAgencyInfluencers,
  useAssignERToInfluencer,
} from '@api';
import {
  safeUrl,
  safeImageUrl,
  calculateMedian,
  calculateEngagementRate,
  calculatePreEvalCpv,
  parseNumberInput,
  validateNumericInput,
  parseAndValidateBulkInput,
  cleanInstagramHandle,
  formatInstagramHandle,
  ManualPostRowData,
} from '@utils';
import type { CalculateERResponse } from '@contracts';

/**
 * The response shape comes from the shared contract rather than a local copy.
 * It used to be hand-duplicated here, which meant every server-side change to
 * the ER payload had to be remembered in three separate files.
 */
type ERResult = CalculateERResponse;

const createInitialRows = (count = 10): ManualPostRowData[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    likes: '',
    comments: '',
    views: '',
  }));

export const AgencyERCalculatorOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
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

  // Assign ER Mutation
  const assignERMutation = useAssignERToInfluencer();

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

  // Assign ER Modal Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogTargetId, setAssignDialogTargetId] = useState<string>('');
  const [assignDialogSource, setAssignDialogSource] = useState<'manual' | 'auto'>('manual');

  // Auto Mode Inputs & State
  const [autoHandle, setAutoHandle] = useState('');
  const [autoCommercialFee, setAutoCommercialFee] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<ERResult | null>(null);
  /** Server error code from the last failed lookup, e.g. NOT_PROFESSIONAL_ACCOUNT. */
  const [autoErrorCode, setAutoErrorCode] = useState<string | null>(null);

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

  const bulkValidation = useMemo(
    () => parseAndValidateBulkInput(bulkInputText),
    [bulkInputText],
  );

  const isCellInvalid = (val: string) => {
    if (!val || val.trim() === '') return false;
    return !validateNumericInput(val).isValid;
  };

  const handleApplyBulkData = () => {
    if (bulkValidation.validValues.length === 0) {
      showError('Please enter at least one valid number before applying to table');
      return;
    }

    if (bulkValidation.hasErrors) {
      showError(`Please fix or remove the ${bulkValidation.invalidCount} invalid entry/entries before applying`);
      return;
    }

    const parsedList = bulkValidation.validValues;

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
    showSuccess(`Applied ${parsedList.length} ${bulkTargetField} values to table`);
  };

  const handleApplyOnlyValidBulkData = () => {
    const parsedList = bulkValidation.validValues;
    if (parsedList.length === 0) {
      showError('No valid numbers to apply');
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
    showSuccess(`Applied ${parsedList.length} valid ${bulkTargetField} values to table`);
  };

  const handleCopySummary = () => {
    const handleLabel = formatInstagramHandle(manualHandle, 'Influencer');

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

  const handleCopyAutoSummary = () => {
    if (!autoResult) return;
    const handleLabel = formatInstagramHandle(autoHandle || autoResult.instagramHandle, 'Influencer');

    const postsCount = autoResult.posts?.length || autoResult.postsCount || 10;
    const totalLikes = autoResult.avgLikes ? autoResult.avgLikes * postsCount : 0;
    const totalComments = autoResult.avgComments ? autoResult.avgComments * postsCount : 0;

    const reportText = `📊 Influencer Evaluation Report: ${handleLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Followers: ${autoResult.followersCount ? autoResult.followersCount.toLocaleString() : 'Not specified'}
• Analyzed Posts: ${postsCount}
• Total Likes: ${totalLikes.toLocaleString()} (Avg: ${autoResult.avgLikes?.toLocaleString() ?? 0}/post)
• Total Comments: ${totalComments.toLocaleString()} (Avg: ${autoResult.avgComments?.toLocaleString() ?? 0}/post)
• Engagement Rate (ER%): ${autoResult.engagementRate.toFixed(2)}%
• Pre-Eval Committed Views: ${autoCommittedViews > 0 ? `${autoCommittedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${autoCommercialFeeNum > 0 ? `₹${autoCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${autoCpv !== null ? `₹${autoCpv.toFixed(2)} / view` : 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formula: ER% = [(Likes + Comments) ÷ Posts] ÷ Followers × 100
Formula: Committed Views = Median of Latest 10 Reel Views
Formula: Pre-Eval CPV = Reel Fee ÷ Committed Views`;

    navigator.clipboard.writeText(reportText);
    showSuccess('Evaluation report copied to clipboard');
  };

  /**
   * Fetches metrics for a handle.
   *
   * `forceRefresh` bypasses the server's 24h stored copy. Results are cached
   * because Instagram's official API allows a limited number of lookups per
   * hour across the whole app, and a creator's trailing-10-post rate barely
   * moves within a day.
   */
  const handleCalculateAuto = async (forceRefresh = false) => {
    const trimmed = autoHandle.trim();
    if (!trimmed) return;

    setAutoLoading(true);
    setAutoResult(null);
    setAutoErrorCode(null);

    try {
      const res = await apiClient.post<ERResult>('/er-calculator', {
        instagramHandle: trimmed,
        ...(forceRefresh ? { forceRefresh: true } : {}),
      });
      setAutoResult(res.data);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string; code?: string } } })
        ?.response?.data;
      setAutoErrorCode(response?.code ?? null);
      showError(response?.message || 'Failed to calculate engagement rate');
    } finally {
      setAutoLoading(false);
    }
  };

  /** Carries the handle into manual entry when Instagram cannot supply it. */
  const handleSwitchToManualEntry = () => {
    setManualHandle(autoHandle.trim());
    setAutoErrorCode(null);
    setManualEntryMode('table');
    setActiveTab('manual');
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

  const openAssignDialog = (source: 'manual' | 'auto' = activeTab) => {
    setAssignDialogSource(source);
    if (selectedInfluencerId) {
      setAssignDialogTargetId(selectedInfluencerId);
    } else {
      const handleToMatch = source === 'manual' ? manualHandle : autoHandle;
      const clean = cleanInstagramHandle(handleToMatch).toLowerCase();
      if (clean) {
        const match = influencersList.find(
          (inf) =>
            (inf.instagram && cleanInstagramHandle(inf.instagram).toLowerCase() === clean) ||
            inf.name.toLowerCase() === handleToMatch.trim().toLowerCase(),
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

  const handleAssignToInfluencer = async (
    source: 'manual' | 'auto' = activeTab,
    targetIdOverride?: string,
  ) => {
    const isManual = source === 'manual';
    const targetInfluencerId = targetIdOverride || selectedInfluencerId;

    if (!targetInfluencerId) {
      openAssignDialog(source);
      return;
    }

    const erValue = isManual ? effectiveManual.erPercent : (autoResult?.engagementRate || 0);
    if (erValue <= 0) {
      showError('Please enter data so ER% is calculated before assigning.');
      return;
    }

    const followers = isManual
      ? manualFollowersNum
      : (autoResult?.followersCount || manualFollowersNum);
    const commFee = isManual ? manualCommercialFeeNum : (autoCommercialFeeNum || manualCommercialFeeNum);
    const committedViews = isManual ? effectiveManual.committedViews : autoCommittedViews;
    const rawHandle = isManual ? manualHandle : (autoHandle || manualHandle);
    const handle = cleanInstagramHandle(rawHandle);

    try {
      const res = await assignERMutation.mutateAsync({
        influencerId: targetInfluencerId,
        engagementRate: Number(erValue.toFixed(2)),
        followersCount: followers > 0 ? followers : undefined,
        commercialFee: commFee > 0 ? commFee : undefined,
        avgViews: committedViews > 0 ? committedViews : undefined,
        avgLikes: isManual
          ? (effectiveManual.avgLikes > 0 ? effectiveManual.avgLikes : undefined)
          : (autoResult?.avgLikes ?? undefined),
        avgComments: isManual
          ? (effectiveManual.avgComments > 0 ? effectiveManual.avgComments : undefined)
          : (autoResult?.avgComments ?? undefined),
        postsCount: isManual
          ? (manualEntryMode === 'table' ? tableData.activeRowsCount : summaryData.postsCount)
          : (autoResult?.postsCount ?? undefined),
        instagramHandle: handle || undefined,
        source: isManual ? 'MANUAL_CALCULATOR' : (autoResult?.source || 'AUTO_FETCH'),
        rawResponse: isManual ? { tableData: manualRows, summaryData } : { autoResult },
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
      title="ER Calculator"
      subtitle="Engagement Rate & Pre-Evaluation Calculator for influencer reach and campaign metrics"
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
      {/* Top Navigation & Mode Switcher */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          flexShrink: 0,
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
              sx={{ height: 32, borderRadius: `${theme.customRadii.pill}px` }}
            >
              Copy Report
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<RefreshRoundedIcon />}
              onClick={handleClearManual}
              sx={{ height: 32, borderRadius: `${theme.customRadii.pill}px` }}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${theme.customSpacing.cardGap}px`, pb: 4 }}>
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
                mb: 2.5,
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
            </Box>

            {/* Influencer Selector & Direct Assign Button Row */}
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 2.5,
              }}
            >
              <Autocomplete
                options={influencersList}
                getOptionLabel={(option) =>
                  option.instagram ? `${option.name} (@${option.instagram})` : option.name
                }
                value={selectedInfluencer}
                onChange={(_, newValue) => {
                  setSelectedInfluencerId(newValue?.id || '');
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Influencer from Roster"
                    placeholder="Search by name or Instagram handle..."
                    size="small"
                    helperText={
                      selectedInfluencer
                        ? `Selected: ${selectedInfluencer.name} • ${selectedInfluencer.followers ? `${selectedInfluencer.followers.toLocaleString()} followers` : 'Followers not set'}`
                        : 'Pick an influencer from your roster to assign the calculated ER %'
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

              <Button
                variant="contained"
                onClick={() => {
                  if (selectedInfluencerId) {
                    handleAssignToInfluencer('manual');
                  } else {
                    openAssignDialog('manual');
                  }
                }}
                disabled={effectiveManual.erPercent <= 0 || assignERMutation.isPending}
                startIcon={
                  assignERMutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckCircleRoundedIcon />
                  )
                }
                sx={{
                  height: 40,
                  whiteSpace: 'nowrap',
                  px: 3,
                  fontWeight: 700,
                  borderRadius: `${theme.customRadii.inner}px`,
                  flexShrink: 0,
                }}
              >
                {assignERMutation.isPending
                  ? 'Assigning...'
                  : selectedInfluencer
                  ? `Assign ER % (${effectiveManual.erPercent.toFixed(2)}%)`
                  : 'Assign ER to Influencer'}
              </Button>
            </Box>

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
                  error={manualFollowers.trim() !== '' && !validateNumericInput(manualFollowers).isValid}
                  size="small"
                  fullWidth
                  helperText={
                    manualFollowers.trim() !== '' && !validateNumericInput(manualFollowers).isValid
                      ? 'Invalid follower count (e.g. 100k or 100000)'
                      : manualFollowersNum > 0
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
                  error={manualCommercialFee.trim() !== '' && !validateNumericInput(manualCommercialFee).isValid}
                  size="small"
                  fullWidth
                  helperText={
                    manualCommercialFee.trim() !== '' && !validateNumericInput(manualCommercialFee).isValid
                      ? 'Invalid fee amount (e.g. 50k or 50000)'
                      : manualCommercialFeeNum > 0
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
                              error={isCellInvalid(manualRows[index]?.likes ?? '')}
                              helperText={isCellInvalid(manualRows[index]?.likes ?? '') ? 'Invalid format' : undefined}
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
                              error={isCellInvalid(manualRows[index]?.comments ?? '')}
                              helperText={isCellInvalid(manualRows[index]?.comments ?? '') ? 'Invalid format' : undefined}
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
                              error={isCellInvalid(manualRows[index]?.views ?? '')}
                              helperText={isCellInvalid(manualRows[index]?.views ?? '') ? 'Invalid format' : undefined}
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
                      error={summaryLikes.trim() !== '' && !validateNumericInput(summaryLikes).isValid}
                      size="small"
                      fullWidth
                      helperText={
                        summaryLikes.trim() !== '' && !validateNumericInput(summaryLikes).isValid
                          ? 'Invalid format (e.g. 45k or 45000)'
                          : summaryData.totalLikes > 0
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
                      error={summaryComments.trim() !== '' && !validateNumericInput(summaryComments).isValid}
                      size="small"
                      fullWidth
                      helperText={
                        summaryComments.trim() !== '' && !validateNumericInput(summaryComments).isValid
                          ? 'Invalid format (e.g. 3.2k or 3200)'
                          : summaryData.totalComments > 0
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
                      error={
                        summaryPostsCount.trim() !== '' &&
                        (!validateNumericInput(summaryPostsCount).isValid || parseNumberInput(summaryPostsCount) <= 0)
                      }
                      size="small"
                      fullWidth
                      helperText={
                        summaryPostsCount.trim() !== '' &&
                        (!validateNumericInput(summaryPostsCount).isValid || parseNumberInput(summaryPostsCount) <= 0)
                          ? 'Must be a positive integer (e.g. 10)'
                          : 'Default is 10 latest posts'
                      }
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField
                      label="Pre-Eval Committed Views"
                      placeholder="e.g. 35000 or 35k"
                      value={summaryCommittedViews}
                      onChange={(e) => setSummaryCommittedViews(e.target.value)}
                      error={summaryCommittedViews.trim() !== '' && !validateNumericInput(summaryCommittedViews).isValid}
                      size="small"
                      fullWidth
                      helperText={
                        summaryCommittedViews.trim() !== '' && !validateNumericInput(summaryCommittedViews).isValid
                          ? 'Invalid format (e.g. 35k or 35000)'
                          : summaryData.committedViews > 0
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
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Shareable summary report & direct ER assignment to roster
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyRoundedIcon />}
                  onClick={handleCopySummary}
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
              {`📊 Influencer Evaluation Report: ${formatInstagramHandle(manualHandle, 'Influencer')}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedInfluencer.name}
                      </Typography>
                      {selectedInfluencer.instagram && (
                        <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
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
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                      {selectedInfluencer.followers ? `${selectedInfluencer.followers.toLocaleString()} followers` : 'Followers not set'}
                      {' • '}Ready to assign calculated ER of {effectiveManual.erPercent.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<SwapHorizRoundedIcon />}
                    onClick={() => openAssignDialog('manual')}
                    sx={{ fontSize: '0.8rem', textTransform: 'none', color: theme.palette.tokens.textSecondary }}
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
                    onClick={() => handleAssignToInfluencer('manual')}
                    disabled={effectiveManual.erPercent <= 0 || assignERMutation.isPending}
                    sx={{ fontWeight: 700 }}
                  >
                    {assignERMutation.isPending ? 'Assigning...' : `Assign ER to ${selectedInfluencer.name}`}
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
                  <PeopleAltRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      No Influencer Linked to this Calculation
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                      Assign this calculated Engagement Rate ({effectiveManual.erPercent.toFixed(2)}%) to an influencer in your roster.
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PeopleAltRoundedIcon />}
                  onClick={() => openAssignDialog('manual')}
                  disabled={effectiveManual.erPercent <= 0}
                  sx={{ fontWeight: 700 }}
                >
                  Select Influencer & Assign ER
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* AUTO INSTAGRAM PROFILE FETCH TAB */}
      {/* ========================================================================= */}
      {activeTab === 'auto' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${theme.customSpacing.cardGap}px`, pb: 4 }}>
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
                onClick={() => handleCalculateAuto()}
                disabled={autoLoading || !autoHandle.trim()}
                startIcon={autoLoading ? <CircularProgress size={18} /> : <CalculateRoundedIcon />}
                sx={{ height: 40, px: 3 }}
              >
                {autoLoading ? 'Fetching Profile…' : 'Fetch Profile'}
              </Button>
              {autoResult && (
                <Tooltip title="Ignore the saved copy and read Instagram again">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={() => handleCalculateAuto(true)}
                      disabled={autoLoading}
                      startIcon={<RefreshRoundedIcon />}
                      sx={{ height: 40 }}
                    >
                      Refresh
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Box>

            {/* Instagram cannot report metrics for personal accounts, so offer
                the only route that works rather than leaving a dead end. */}
            {autoErrorCode === 'NOT_PROFESSIONAL_ACCOUNT' && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: `${theme.customRadii.card}px`,
                  border: `1px solid ${theme.palette.warning.main}`,
                  backgroundColor: `${theme.palette.warning.main}14`,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary }}>
                  <strong>@{autoHandle.trim()}</strong> is not an Instagram Business or Creator
                  account. Instagram does not publish metrics for personal accounts, so they have
                  to be entered by hand.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSwitchToManualEntry}
                  startIcon={<SwapHorizRoundedIcon />}
                  sx={{ mt: 1.5 }}
                >
                  Enter Manually
                </Button>
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
                      startIcon={
                        assignERMutation.isPending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <CheckCircleRoundedIcon />
                        )
                      }
                      onClick={() => {
                        if (selectedInfluencerId) {
                          handleAssignToInfluencer('auto');
                        } else {
                          openAssignDialog('auto');
                        }
                      }}
                      disabled={(autoResult?.engagementRate || 0) <= 0 || assignERMutation.isPending}
                      sx={{ height: 40, fontWeight: 700 }}
                    >
                      {assignERMutation.isPending
                        ? 'Assigning...'
                        : selectedInfluencer
                        ? `Assign ER% (${autoResult?.engagementRate || 0}%)`
                        : 'Assign to Influencer'}
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
                      error={autoCommercialFee.trim() !== '' && !validateNumericInput(autoCommercialFee).isValid}
                      size="small"
                      fullWidth
                      helperText={
                        autoCommercialFee.trim() !== '' && !validateNumericInput(autoCommercialFee).isValid
                          ? 'Invalid fee amount (e.g. 50k or 50000)'
                          : autoCommercialFeeNum > 0
                          ? `Parsed: ₹${autoCommercialFeeNum.toLocaleString()}`
                          : 'Enter commercial fee to compute Pre-Eval CPV'
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
                    {/* Without likes the rate is comments-only, so it is far
                        lower than it should be and not comparable to other
                        creators. Say so rather than let it be read as a score. */}
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
                        ⚠ This creator hides like counts, so this rate reflects comments only and
                        understates their true engagement. Not comparable with other creators.
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

              {/* Auto Mode Evaluation Summary Sheet */}
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
                    <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
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
• Analyzed Posts / Reels: ${autoResult.posts.length}
• Total Likes: ${(autoResult.avgLikes ? autoResult.avgLikes * autoResult.posts.length : 0).toLocaleString()} (Avg: ${autoResult.avgLikes?.toLocaleString() ?? 0}/post)
• Total Comments: ${(autoResult.avgComments ? autoResult.avgComments * autoResult.posts.length : 0).toLocaleString()} (Avg: ${autoResult.avgComments?.toLocaleString() ?? 0}/post)
• Engagement Rate (ER%): ${autoResult.engagementRate.toFixed(2)}%
• Pre-Eval Committed Views: ${autoCommittedViews > 0 ? `${autoCommittedViews.toLocaleString()} views` : 'Not specified'}
• Reel Commercial Fee: ${autoCommercialFeeNum > 0 ? `₹${autoCommercialFeeNum.toLocaleString()}` : 'Not specified'}
• Pre-Eval CPV: ${autoCpv !== null ? `₹${autoCpv.toFixed(2)} / view` : 'Not specified'}`}
                </Box>

                {/* Auto Mode Roster Assignment Link Status Strip */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {selectedInfluencer.name}
                          </Typography>
                          {selectedInfluencer.instagram && (
                            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
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
                        <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                          {selectedInfluencer.followers ? `${selectedInfluencer.followers.toLocaleString()} followers` : 'Followers not set'}
                          {' • '}Ready to assign calculated ER of {autoResult.engagementRate.toFixed(2)}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<SwapHorizRoundedIcon />}
                        onClick={() => openAssignDialog('auto')}
                        sx={{ fontSize: '0.8rem', textTransform: 'none', color: theme.palette.tokens.textSecondary }}
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
                        onClick={() => handleAssignToInfluencer('auto')}
                        disabled={(autoResult?.engagementRate || 0) <= 0 || assignERMutation.isPending}
                        sx={{ fontWeight: 700 }}
                      >
                        {assignERMutation.isPending ? 'Assigning...' : `Assign ER to ${selectedInfluencer.name}`}
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
                      <PeopleAltRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 24 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          No Influencer Linked to this Calculation
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                          Assign this calculated Engagement Rate ({autoResult.engagementRate.toFixed(2)}%) to an influencer in your roster.
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PeopleAltRoundedIcon />}
                      onClick={() => openAssignDialog('auto')}
                      disabled={(autoResult?.engagementRate || 0) <= 0}
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
              error={bulkValidation.hasErrors}
              helperText={
                bulkValidation.hasErrors
                  ? `${bulkValidation.invalidCount} invalid entry/entries detected. Please correct or remove them.`
                  : undefined
              }
              fullWidth
              autoFocus
            />

            {/* Invalid Entries Warning Box */}
            {bulkValidation.hasErrors && (
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: `${theme.palette.error.main}12`,
                  border: `1px solid ${theme.palette.error.main}40`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <WarningAmberRoundedIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {bulkValidation.invalidCount} invalid {bulkValidation.invalidCount === 1 ? 'entry' : 'entries'} found:
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.error.main,
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    backgroundColor: theme.palette.background.paper,
                    p: 1,
                    borderRadius: `${theme.customRadii.inner}px`,
                    mb: 1,
                  }}
                >
                  {bulkValidation.invalidStrings.slice(0, 10).map((s) => `"${s}"`).join(', ')}
                  {bulkValidation.invalidStrings.length > 10 ? ` +${bulkValidation.invalidStrings.length - 10} more` : ''}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                  Please enter valid numbers or shorthand formats (e.g. 45000, 45k, 1.2M, 50,000). Text strings and special characters cannot be assigned as {bulkTargetField}.
                </Typography>
              </Box>
            )}

            {/* Valid Preview Box */}
            {bulkInputText.trim() && bulkValidation.validCount > 0 && (
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: bulkValidation.hasErrors
                    ? theme.palette.tokens.fieldBg
                    : theme.palette.tokens.positiveBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CheckCircleRoundedIcon
                      sx={{
                        color: bulkValidation.hasErrors
                          ? theme.palette.tokens.accentText
                          : theme.palette.tokens.positiveText,
                        fontSize: 16,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: bulkValidation.hasErrors
                          ? theme.palette.tokens.accentText
                          : theme.palette.tokens.positiveText,
                      }}
                    >
                      Recognized {bulkValidation.validCount} valid {bulkValidation.validCount === 1 ? 'number' : 'numbers'}:
                    </Typography>
                  </Box>
                  {bulkValidation.hasErrors && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setBulkInputText(bulkValidation.validValues.join(', '))}
                      sx={{ fontSize: '0.75rem', p: 0, textTransform: 'none' }}
                    >
                      Keep only valid values
                    </Button>
                  )}
                </Box>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', color: theme.palette.tokens.textPrimary, mt: 0.5 }}>
                  {bulkValidation.validValues.map((n) => n.toLocaleString()).join(', ')}
                </Typography>
                {!bulkValidation.hasErrors && (
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5, display: 'block' }}>
                    Will populate Reel 1 to Reel {bulkValidation.validCount} in the {bulkTargetField} column.
                  </Typography>
                )}
              </Box>
            )}

            {bulkInputText.trim() && bulkValidation.validCount === 0 && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                  No valid numbers recognized. Example format: <code>45k, 32k, 18000, 25k</code>
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setBulkDialogOpen(false)}>
            Cancel
          </Button>
          {bulkValidation.hasErrors && bulkValidation.validCount > 0 && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleApplyOnlyValidBulkData}
            >
              Apply Only Valid ({bulkValidation.validCount})
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleApplyBulkData}
            disabled={bulkValidation.validCount === 0 || bulkValidation.hasErrors}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.tokens.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Calculated Metrics ({assignDialogSource === 'manual' ? 'Manual Calc' : 'Auto Fetch'})
                </Typography>
                {getErTierBadge(
                  assignDialogSource === 'manual'
                    ? effectiveManual.erPercent
                    : (autoResult?.engagementRate || 0),
                )}
              </Box>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                    Engagement Rate
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.tokens.accentText }}>
                    {assignDialogSource === 'manual'
                      ? `${effectiveManual.erPercent.toFixed(2)}%`
                      : `${autoResult?.engagementRate?.toFixed(2) || '0.00'}%`}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                    Followers
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {assignDialogSource === 'manual'
                      ? manualFollowersNum > 0
                        ? manualFollowersNum.toLocaleString()
                        : '—'
                      : autoResult?.followersCount
                      ? autoResult.followersCount.toLocaleString()
                      : '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                    Committed Views
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {assignDialogSource === 'manual'
                      ? effectiveManual.committedViews > 0
                        ? effectiveManual.committedViews.toLocaleString()
                        : '—'
                      : autoCommittedViews > 0
                      ? autoCommittedViews.toLocaleString()
                      : '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                    Reel Fee
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {assignDialogSource === 'manual'
                      ? manualCommercialFeeNum > 0
                        ? `₹${manualCommercialFeeNum.toLocaleString()}`
                        : '—'
                      : autoCommercialFeeNum > 0
                      ? `₹${autoCommercialFeeNum.toLocaleString()}`
                      : '—'}
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
                  const { key, ...otherProps } = props;
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...otherProps}
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
                        {option.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                          {option.instagram ? `@${option.instagram}` : 'No Instagram handle'}
                          {option.followers ? ` • ${option.followers.toLocaleString()} followers` : ''}
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
                              <PeopleAltRoundedIcon sx={{ color: theme.palette.tokens.textSecondary, fontSize: 20 }} />
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
                    p: 1.5,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.tokens.positiveBg,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText, display: 'block' }}
                  >
                    Assigning to: {target.name} {target.instagram ? `(@${target.instagram})` : ''}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5, display: 'block' }}>
                    This will persist an engagement calculation record and update the influencer profile's ER metrics in your agency roster.
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
            onClick={() => handleAssignToInfluencer(assignDialogSource, assignDialogTargetId)}
            disabled={
              !assignDialogTargetId ||
              (assignDialogSource === 'manual'
                ? effectiveManual.erPercent
                : (autoResult?.engagementRate || 0)) <= 0 ||
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
