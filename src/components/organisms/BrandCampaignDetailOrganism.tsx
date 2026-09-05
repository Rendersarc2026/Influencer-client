import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import PercentRoundedIcon from '@mui/icons-material/PercentRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  DataTable,
  DataTableColumn,
  CommentDialog,
  ConfirmDialog,
  FilterBar,
  OverviewDrawer,
} from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import {
  useBrandCampaign,
  useBrandCampaignInfluencers,
  useBrandDecision,
  useCreateOrFindChat,
  apiClient,
} from '@api';
import {
  BrandMapperResponse,
  BrandDecisionRequest,
  BrandStatusCode,
  CampaignStatusCode,
  MetricResponse,
  PaginatedResult,
} from '@contracts';
import { useAuth, useDebouncedSearch, useToast, useViewFilters } from '@hooks';
import {
  safeExternalUrl,
  exportBrandCampaignPerformanceReport,
  exportBrandCampaignPerformanceReportPdf,
} from '@utils';

interface BrandRowActionsProps {
  row: BrandMapperResponse;
  onApprove: (mapperId: string) => void;
  onRemoveApproval: (mapperId: string) => void;
  onSendRemarks: (mapperId: string) => void;
  onReject: (mapperId: string) => void;
  onViewDossier: (row: BrandMapperResponse) => void;
  /** An approval can only be taken back while the campaign is still a draft. */
  campaignIsDraft: boolean;
  loading?: boolean;
}

const BrandRowActions: React.FC<BrandRowActionsProps> = ({
  row,
  onApprove,
  onRemoveApproval,
  onSendRemarks,
  onReject,
  onViewDossier,
  campaignIsDraft,
  loading = false,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAnchorEl(null);
  };

  const isApproved = row.brandStatus === BrandStatusCode.APPROVED;
  const isRejected = row.brandStatus === BrandStatusCode.REJECTED;
  const isPendingReview = row.brandStatus === BrandStatusCode.PENDING_REVIEW;

  // Straight off `nextBrandStatus`: CORRECTION_REQUESTED / NOT_VISIBLE are
  // waiting on the agency, so the brand has no move in either. Offering these
  // anyway meant a menu item that always failed with an invalid-transition
  // error.
  const canApprove = isPendingReview || isRejected;
  const canReject = isPendingReview;
  const canRequestCorrection = isPendingReview || isRejected;
  // APPROVED -> PENDING_REVIEW exists, but only while the campaign is a draft:
  // once it is live the creator is briefed against the agreed rate and the
  // server refuses the transition, so do not offer it.
  const canRemoveApproval = isApproved && campaignIsDraft;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* 1. Three-dot More Menu Button */}
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            border: `1px solid ${open ? theme.palette.primary.main : theme.palette.tokens.divider}`,
            backgroundColor: open ? theme.palette.tokens.fieldBg : theme.palette.tokens.surface,
            borderRadius: `${theme.customRadii.inner}px`,
            p: 0.75,
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: theme.palette.tokens.fieldBg,
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <MoreVertRoundedIcon fontSize="small" sx={{ color: theme.palette.tokens.textPrimary }} />
        </IconButton>
      </Tooltip>

      {/* 2. Actions Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              border: `1px solid ${theme.palette.tokens.divider}`,
              minWidth: 230,
              padding: '6px',
              mt: 0.75,
              boxShadow:
                '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
            },
          },
        }}
      >
        {/* --- SECTION 1: Decision Actions --- */}

        {/* Approved and the campaign has gone live: the decision is locked, so
            say so rather than showing an empty menu where the actions were. */}
        {isApproved && !campaignIsDraft && (
          <MenuItem
            disabled
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              opacity: 1,
              color: theme.palette.tokens.positiveText,
              '&.Mui-disabled': { opacity: 1 },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.tokens.positive, minWidth: 'auto' }}>
              <CheckCircleRoundedIcon fontSize="small" />
            </ListItemIcon>
            Approved — rate is final
          </MenuItem>
        )}

        {/* Remove Approval — the way back out, while the campaign is a draft */}
        {canRemoveApproval && (
          <MenuItem
            onClick={(e) => {
              handleClose(e);
              onRemoveApproval(row.id);
            }}
            disabled={loading}
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.warning.dark,
              '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.warning.main, minWidth: 'auto' }}>
              <UndoRoundedIcon fontSize="small" />
            </ListItemIcon>
            Remove Approval
          </MenuItem>
        )}

        {/* Approve Proposal */}
        {canApprove && !isRejected && (
          <MenuItem
            onClick={(e) => {
              handleClose(e);
              onApprove(row.id);
            }}
            disabled={loading}
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.tokens.positiveText,
              '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.tokens.positive, minWidth: 'auto' }}>
              <CheckCircleRoundedIcon fontSize="small" />
            </ListItemIcon>
            Approve Influencer
          </MenuItem>
        )}

        {/* Re-Approve Proposal (when rejected) */}
        {canApprove && isRejected && (
          <MenuItem
            onClick={(e) => {
              handleClose(e);
              onApprove(row.id);
            }}
            disabled={loading}
            sx={{
              fontSize: '13px',
              fontWeight: 600,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.primary.main,
              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 'auto' }}>
              <CheckCircleRoundedIcon fontSize="small" />
            </ListItemIcon>
            Re-Approve Influencer
          </MenuItem>
        )}

        {/* Send Remarks & Feedback */}
        {canRequestCorrection && (
          <MenuItem
            onClick={(e) => {
              handleClose(e);
              onSendRemarks(row.id);
            }}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.warning.dark,
              '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.warning.main, minWidth: 'auto' }}>
              <EditNoteRoundedIcon fontSize="small" />
            </ListItemIcon>
            Send Remarks & Feedback
          </MenuItem>
        )}

        {/* Reject Proposal */}
        {canReject && (
          <MenuItem
            onClick={(e) => {
              handleClose(e);
              onReject(row.id);
            }}
            disabled={loading}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.tokens.negative,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: theme.palette.tokens.negative,
              },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: 'auto' }}>
              <CancelRoundedIcon fontSize="small" />
            </ListItemIcon>
            Reject Proposal
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5, borderColor: 'rgba(0, 0, 0, 0.06)' }} />

        {/* --- SECTION 2: Evaluation & Details --- */}

        {/* View Full Dossier */}
        <MenuItem
          onClick={(e) => {
            handleClose(e);
            onViewDossier(row);
          }}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textSecondary, minWidth: 'auto' }}>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          View Full Pre-Evaluation
        </MenuItem>
      </Menu>
    </Box>
  );
};

interface BrandCampaignDetailOrganismProps {
  campaignId?: string;
}

export const BrandCampaignDetailOrganism: React.FC<BrandCampaignDetailOrganismProps> = ({
  campaignId: propCampaignId,
}) => {
  const theme = useTheme();
  const { id: routeCampaignId = '' } = useParams<{ id: string }>();
  const campaignId = propCampaignId || routeCampaignId;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { search, setSearch, page, setPage, rowsPerPage, setRowsPerPage } =
    useViewFilters('brandCampaignDetail');
  const { debounced: debouncedSearch, pending: searchPending } = useDebouncedSearch(search, 300);

  const { data: campaign, isLoading: campaignLoading } = useBrandCampaign(campaignId);

  /**
   * Every brand decision that walks something backwards is gated on the campaign
   * still being a draft. Once it is Active the roster is briefed against agreed
   * rates, and the server refuses the transition anyway.
   */
  const campaignIsDraft = Number(campaign?.status) === CampaignStatusCode.DRAFT;
  const {
    data: mappersData,
    isLoading: mappersLoading,
    isFetching: mappersFetching,
  } = useBrandCampaignInfluencers(campaignId, {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const mappers = useMemo(() => mappersData?.items || [], [mappersData?.items]);
  const totalMappers = mappersData?.total ?? mappers.length;

  const brandDecisionMutation = useBrandDecision(campaignId);
  const createChatMutation = useCreateOrFindChat();

  const handleMessageAgency = async () => {
    try {
      const chat = await createChatMutation.mutateAsync({
        campaignId,
      });
      navigate(`/brand/chats?chatId=${chat.id}`);
    } catch {
      navigate('/brand/chats');
    }
  };

  // Pre-configured remarks & feedback templates for fast brand decisions
  const CORRECTION_SUGGESTIONS = [
    'Price is too high, previously we did at a lower price',
    'Please renegotiate commercial rate to fit our allocated budget',
    'Deliverables need adjustment (e.g. 1 Reel + 3 Stories)',
    'Committed view guarantee is below benchmark for this price point',
    'Please propose an alternative creator in this category',
  ];

  const REJECTION_SUGGESTIONS = [
    'Commercial rate exceeds our maximum campaign budget',
    'Creator style & audience aesthetic does not align with campaign brief',
    'Audience demographic mismatch for targeted regional market',
    'Recent engagement metrics are below brand threshold',
  ];

  // Dialog state for Reject / Request Correction / Remarks
  const [activeDialog, setActiveDialog] = useState<{
    mapperId: string;
    action: 'REJECT' | 'REQUEST_CORRECTION';
    title: string;
    subtitle: string;
    confirmText: string;
    suggestions?: string[];
  } | null>(null);

  // Detailed Influencer Pre-Eval Drawer/Modal State
  const [selectedInfluencer, setSelectedInfluencer] = useState<BrandMapperResponse | null>(null);

  /**
   * Approval commits the brand to the price it is looking at, and the agency is
   * blocked from reverting its own rate approval underneath it. It can be taken
   * back only while the campaign is a draft — see the revoke dialog below — so
   * this asks before committing rather than acting on a single menu click.
   */
  const [approveDialogMapper, setApproveDialogMapper] = useState<BrandMapperResponse | null>(null);

  /** Taking an approval back, which returns the row to the brand's own queue. */
  const [revokeDialogMapper, setRevokeDialogMapper] = useState<BrandMapperResponse | null>(null);

  const handleOpenApprove = (mapperId: string) => {
    const mapper = mappers.find((m) => m.id === mapperId);
    if (mapper) setApproveDialogMapper(mapper);
  };

  const handleConfirmApprove = async () => {
    if (!approveDialogMapper) return;
    const decision: BrandDecisionRequest = {
      action: 'APPROVE',
    };
    try {
      await brandDecisionMutation.mutateAsync({
        mapperId: approveDialogMapper.id,
        decision,
      });
      setApproveDialogMapper(null);
      showSuccess('Influencer commercial proposal approved.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to approve proposal.',
      );
    }
  };

  const handleOpenRemoveApproval = (mapperId: string) => {
    const mapper = mappers.find((m) => m.id === mapperId);
    if (mapper) setRevokeDialogMapper(mapper);
  };

  const handleConfirmRemoveApproval = async () => {
    if (!revokeDialogMapper) return;
    const decision: BrandDecisionRequest = {
      action: 'REVOKE_APPROVAL',
    };
    try {
      await brandDecisionMutation.mutateAsync({
        mapperId: revokeDialogMapper.id,
        decision,
      });
      setRevokeDialogMapper(null);
      showSuccess('Approval removed. This creator is back in your pending review list.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to remove approval.',
      );
    }
  };

  // 2. Reject Action (opens dialog)
  const handleOpenReject = (mapperId: string) => {
    setActiveDialog({
      mapperId,
      action: 'REJECT',
      title: 'Reject Influencer Proposal',
      subtitle: 'Provide the reason for rejecting this creator from the campaign roster',
      confirmText: 'Confirm Rejection',
      suggestions: REJECTION_SUGGESTIONS,
    });
  };

  // 3. Request Correction / Send Remarks Action (opens dialog)
  const handleOpenCorrection = (mapperId: string) => {
    setActiveDialog({
      mapperId,
      action: 'REQUEST_CORRECTION',
      title: 'Send Remarks & Feedback to Agency',
      subtitle:
        'Specify required commercial targets, price adjustments, or deliverable changes for your agency',
      confirmText: 'Send Remarks to Agency',
      suggestions: CORRECTION_SUGGESTIONS,
    });
  };

  // Dialog submit handler (comment is required for REJECT and REQUEST_CORRECTION)
  const handleDialogSubmit = async (comment: string) => {
    if (!activeDialog || !comment.trim()) return;
    const decision: BrandDecisionRequest = {
      action: activeDialog.action,
      comment: comment.trim(),
    };
    try {
      await brandDecisionMutation.mutateAsync({
        mapperId: activeDialog.mapperId,
        decision,
      });
      showSuccess(
        activeDialog.action === 'REJECT'
          ? 'Influencer proposal rejected.'
          : 'Correction request sent to agency.',
      );
      setActiveDialog(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to submit decision.',
      );
    }
  };

  // -------------------------------------------------------------
  // KPI Metrics Calculations
  // -------------------------------------------------------------
  const summaryKpis = useMemo(() => {
    let totalCommittedViews = 0;
    let totalClientRate = 0;
    let totalEr = 0;
    let erCount = 0;

    mappers.forEach((m) => {
      if (m.committedViews) totalCommittedViews += m.committedViews;
      if (m.clientRate) totalClientRate += m.clientRate;
      if (m.preEvalEr) {
        totalEr += m.preEvalEr;
        erCount += 1;
      }
    });

    const avgEr = erCount > 0 ? (totalEr / erCount).toFixed(2) : '—';
    const avgCpv =
      totalCommittedViews > 0 && totalClientRate > 0
        ? (totalClientRate / totalCommittedViews).toFixed(2)
        : '—';

    return {
      totalInfluencers: totalMappers,
      totalCommittedViews,
      totalClientRate,
      avgEr,
      avgCpv,
    };
  }, [mappers, totalMappers]);

  // -------------------------------------------------------------
  // 13 Base Pre-Evaluation Columns
  // -------------------------------------------------------------
  const columns: Array<DataTableColumn<BrandMapperResponse>> = [
    // 1. Sr No
    {
      id: 'srNo',
      header: 'Sr No',
      type: 'index',
      align: 'center',
      width: 70,
      minWidth: 70,
    },
    // 2. Region
    {
      id: 'region',
      header: 'Region',
      type: 'custom',
      minWidth: 110,
      accessor: (row) => row.region || 'India',
      render: (row) => (
        <Chip
          label={row.region || 'India'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: theme.palette.tokens.fieldBg,
            color: theme.palette.tokens.textPrimary,
          }}
        />
      ),
    },
    // 3. Username
    {
      id: 'username',
      header: 'Username',
      type: 'custom',
      minWidth: 160,
      accessor: (row) => row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`,
      render: (row) => (
        <Box
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInfluencer(row);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            p: '2px 4px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: theme.palette.tokens.fieldBg,
            },
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`}
            </Typography>
            {row.instagram && (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
              >
                @
                {row.instagram
                  .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
                  .replace(/\/$/, '')}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    // 4. Influencer Link
    {
      id: 'influencerLink',
      header: 'Influencer Link',
      type: 'custom',
      align: 'center',
      minWidth: 120,
      accessor: (row) => row.instagram || row.youtube || '—',
      render: (row) => {
        const link = row.instagram || row.youtube;
        if (!link) {
          return (
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              —
            </Typography>
          );
        }
        const isInstagram = Boolean(row.instagram);
        return (
          <Tooltip title={isInstagram ? 'Open Instagram Profile' : 'Open YouTube Channel'}>
            <IconButton
              component={Link}
              href={safeExternalUrl(link)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: isInstagram ? '#E1306C' : '#FF0000',
                backgroundColor: theme.palette.tokens.fieldBg,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {isInstagram ? <InstagramIcon fontSize="small" /> : <YouTubeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        );
      },
    },
    // 5. Category
    {
      id: 'category',
      header: 'Category',
      type: 'custom',
      minWidth: 120,
      accessor: (row) => row.category || 'General',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: theme.palette.tokens.textPrimary }}
        >
          {row.category || 'General'}
        </Typography>
      ),
    },
    // 6. Followers
    {
      id: 'followers',
      header: 'Followers',
      type: 'custom',
      align: 'right',
      minWidth: 110,
      accessor: 'followers',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.followers ? row.followers.toLocaleString() : '—'}
        </Typography>
      ),
    },
    // 7. Deliverables
    {
      id: 'deliverables',
      header: 'Deliverables',
      type: 'custom',
      minWidth: 180,
      accessor: 'deliverables',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.deliverables || 'Pending'}
        </Typography>
      ),
    },
    // 8. Final Commercials (Billed Client Rate)
    {
      id: 'clientRate',
      header: 'Final Commercials',
      type: 'custom',
      align: 'right',
      minWidth: 140,
      accessor: 'clientRate',
      render: (row) =>
        row.clientRate !== null ? (
          <MoneyText amount={row.clientRate} currency={row.currency} variant="body2" />
        ) : (
          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Pending Agency Rate
          </Typography>
        ),
    },
    // Status
    {
      id: 'status',
      header: 'Status',
      type: 'custom',
      align: 'center',
      minWidth: 150,
      accessor: 'brandStatus',
      statusCategory: 'BRAND_STATUS',
      render: (row) => <StatusChip category="BRAND_STATUS" code={row.brandStatus} />,
    },

    // Workflow Actions
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      minWidth: 160,
      render: (row) => (
        <BrandRowActions
          row={row}
          onApprove={handleOpenApprove}
          onRemoveApproval={handleOpenRemoveApproval}
          onSendRemarks={handleOpenCorrection}
          onReject={handleOpenReject}
          onViewDossier={setSelectedInfluencer}
          campaignIsDraft={campaignIsDraft}
          loading={brandDecisionMutation.isPending}
        />
      ),
    },
  ];

  // Post-evaluation report, offered once the campaign is Completed.
  const isCompleted = Number(campaign?.status) === CampaignStatusCode.COMPLETED;
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportMenuAnchor, setReportMenuAnchor] = useState<null | HTMLElement>(null);

  const handleDownloadPerformanceReport = async (format: 'excel' | 'pdf') => {
    setReportMenuAnchor(null);
    if (!campaign || isDownloadingReport) return;
    try {
      setIsDownloadingReport(true);

      // Both reads at once: the roster and every recorded post-evaluation of
      // this campaign. The metrics arrive from one campaign-scoped endpoint
      // rather than one request per creator, so the report costs two round
      // trips regardless of how many creators the campaign has.
      const [mappersRes, metricsRes] = await Promise.all([
        apiClient.get<PaginatedResult<BrandMapperResponse>>(
          `/brand/campaigns/${campaignId}/influencers`,
        ),
        apiClient.get<MetricResponse[]>(`/brand/campaigns/${campaignId}/metrics`),
      ]);

      const allMappers = mappersRes.data.items || [];

      const metricsByMapperId: Record<string, MetricResponse[]> = {};
      for (const metric of metricsRes.data || []) {
        (metricsByMapperId[metric.mapperId] ||= []).push(metric);
      }

      // Both writers render the same built model, so the workbook and the PDF
      // always carry the same numbers.
      const exportReport =
        format === 'pdf'
          ? exportBrandCampaignPerformanceReportPdf
          : exportBrandCampaignPerformanceReport;

      await exportReport({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          brandName: campaign.brandName,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
        mappers: allMappers,
        metricsByMapperId,
      });

      showSuccess(
        `Campaign performance report downloaded as ${format === 'pdf' ? 'PDF' : 'Excel'}.`,
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to generate performance report.',
      );
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const handleExportAll = async (): Promise<BrandMapperResponse[]> => {
    if (!campaignId) return [];
    const res = await apiClient.get<PaginatedResult<BrandMapperResponse>>(
      `/brand/campaigns/${campaignId}/influencers`,
      {
        params: {
          search: debouncedSearch.trim() || undefined,
        },
      },
    );
    return res.data.items || [];
  };

  return (
    <DashboardLayout
      title="Campaign Details"
      subtitle="Review influencer pre-evaluations, audience metrics, and commercial rates"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      breadcrumbs={[{ label: 'Campaigns', path: '/brand/campaigns' }]}
      onBack={() => navigate('/brand/campaigns')}
      backLabel="Back to Campaigns"
    >
      {/* 1. Campaign Brief & Timeline Card */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}
            >
              <Typography variant="h2">{campaign?.name}</Typography>
              {campaign?.status && <StatusChip category="CAMPAIGN_STATUS" code={campaign.status} />}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              Partner Agency Managed Campaign · Pre-Evaluation & Roster Approval
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                createChatMutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <ChatBubbleOutlineRoundedIcon fontSize="small" />
                )
              }
              onClick={handleMessageAgency}
              disabled={createChatMutation.isPending}
              sx={{ height: 34, fontSize: '13px', fontWeight: 600 }}
            >
              {createChatMutation.isPending ? 'Connecting...' : 'Message Agency'}
            </Button>

            {safeExternalUrl(campaign?.briefUrl) && (
              <Button
                variant="outlined"
                size="small"
                href={safeExternalUrl(campaign?.briefUrl) as string}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<LaunchRoundedIcon fontSize="small" />}
                sx={{ height: 34, fontSize: '13px', fontWeight: 600 }}
              >
                Open Campaign Brief
              </Button>
            )}
          </Box>
        </Box>

        {campaign?.description && (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mb: 2 }}>
            {campaign.description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 2.5, sm: 4 },
            pt: 1.5,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', fontWeight: 600 }}
            >
              TIMELINE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {campaign?.startDate
                ? new Date(campaign.startDate).toLocaleDateString('en-IN')
                : 'TBD'}{' '}
              — {campaign?.endDate ? new Date(campaign.endDate).toLocaleDateString('en-IN') : 'TBD'}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', fontWeight: 600 }}
            >
              TOTAL INFLUENCERS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {totalMappers} {totalMappers === 1 ? 'Creator' : 'Creators'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 2. KPI Pre-Evaluation Metric Summary Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
          flexShrink: 0,
        }}
      >
        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VisibilityRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
            >
              Total Committed Views
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {summaryKpis.totalCommittedViews > 0
                ? summaryKpis.totalCommittedViews.toLocaleString()
                : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PercentRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
            >
              Avg Pre-Eval ER %
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {summaryKpis.avgEr !== '—' ? `${summaryKpis.avgEr}%` : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUpRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
            >
              Avg Pre-Eval CPV
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
              {summaryKpis.avgCpv !== '—' ? `₹${summaryKpis.avgCpv}` : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MonetizationOnRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}
            >
              Total Commercial Budget
            </Typography>
            <MoneyText
              amount={summaryKpis.totalClientRate}
              currency="INR"
              variant="h3"
              color={theme.palette.tokens.positiveText}
            />
          </Box>
        </Card>
      </Box>

      {/* 3. 13-Column Pre-Evaluation Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flexShrink: 0 }}>
        <SectionHeading
          title="Influencer Deliverables & Commercial Proposals"
          subtitle="Creator profiles, deliverables, and commercial rates. Click on any row to view full pre-evaluation metrics and dossier."
          action={
            isCompleted ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    isDownloadingReport ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <AssessmentRoundedIcon fontSize="small" />
                    )
                  }
                  endIcon={!isDownloadingReport && <ExpandMoreRoundedIcon fontSize="small" />}
                  onClick={(e) => setReportMenuAnchor(e.currentTarget)}
                  // `totalMappers` counts the current search, while the report
                  // always covers the whole roster — so an empty search result
                  // must not read as an empty campaign.
                  disabled={
                    isDownloadingReport ||
                    campaignLoading ||
                    (!debouncedSearch.trim() && totalMappers === 0)
                  }
                >
                  {isDownloadingReport ? 'Generating...' : 'Download Report'}
                </Button>
                <Menu
                  anchorEl={reportMenuAnchor}
                  open={Boolean(reportMenuAnchor)}
                  onClose={() => setReportMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem onClick={() => handleDownloadPerformanceReport('excel')}>
                    <ListItemIcon>
                      <TableChartRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    Excel (.xlsx)
                  </MenuItem>
                  <MenuItem onClick={() => handleDownloadPerformanceReport('pdf')}>
                    <ListItemIcon>
                      <PictureAsPdfRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    PDF (.pdf)
                  </MenuItem>
                </Menu>
              </>
            ) : undefined
          }
        />

        <FilterBar searchValue={search} onSearchChange={setSearch} />

        <DataTable<BrandMapperResponse>
          columns={columns}
          rows={mappers}
          totalRows={totalMappers}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          onRowClick={(row) => setSelectedInfluencer(row)}
          loading={mappersLoading || campaignLoading}
          isFetching={mappersFetching || searchPending}
          exportFilename={`${campaign?.name || 'campaign'}_influencer_proposals`}
          exportSheetName="Proposals"
          onExportAll={handleExportAll}
          fillHeight={false}
          minHeight={360}
        />
      </Box>

      {/* 4. Full Influencer Pre-Evaluation Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedInfluencer)}
        onClose={() => setSelectedInfluencer(null)}
        title={selectedInfluencer?.influencerName || 'Influencer Overview'}
        subtitle={
          selectedInfluencer
            ? `${selectedInfluencer.category || 'Creator'} · ${selectedInfluencer.region || 'India'}`
            : undefined
        }
        badge={selectedInfluencer ? selectedInfluencer.brandStatus : undefined}
        badgeCategory="BRAND_STATUS"
        avatarText={selectedInfluencer?.influencerName}
        highlights={
          selectedInfluencer
            ? [
                {
                  label: 'Follower Reach',
                  value: selectedInfluencer.followers
                    ? selectedInfluencer.followers.toLocaleString()
                    : '—',
                  tint: 'sky',
                },
                {
                  label: 'Pre-Eval ER %',
                  value:
                    selectedInfluencer.preEvalEr !== null &&
                    selectedInfluencer.preEvalEr !== undefined
                      ? `${selectedInfluencer.preEvalEr}%`
                      : '—',
                  tint: 'lavender',
                },
                {
                  label: 'Committed Views',
                  value: selectedInfluencer.committedViews
                    ? selectedInfluencer.committedViews.toLocaleString()
                    : '—',
                  tint: 'butter',
                },
                {
                  label: 'Final Commercials',
                  value:
                    selectedInfluencer.clientRate !== null
                      ? `₹${selectedInfluencer.clientRate.toLocaleString('en-IN')}`
                      : 'Pending',
                  tint: 'mint',
                  sublabel: selectedInfluencer.preEvalCpv
                    ? `₹${selectedInfluencer.preEvalCpv} CPV`
                    : undefined,
                },
              ]
            : []
        }
        sections={
          selectedInfluencer
            ? [
                {
                  title: 'Creator Profile & Demographics',
                  fields: [
                    { label: 'Influencer Name', value: selectedInfluencer.influencerName },
                    { label: 'Category / Niche', value: selectedInfluencer.category || 'General' },
                    {
                      label: 'Region / Location',
                      value: selectedInfluencer.region || 'India',
                    },
                    {
                      label: 'Followers Count',
                      value: selectedInfluencer.followers
                        ? selectedInfluencer.followers.toLocaleString()
                        : '—',
                    },
                    {
                      label: 'Instagram Profile',
                      value: selectedInfluencer.instagram || '—',
                      isLink: Boolean(selectedInfluencer.instagram),
                      href: safeExternalUrl(selectedInfluencer.instagram),
                    },
                    {
                      label: 'YouTube Channel',
                      value: selectedInfluencer.youtube || '—',
                      isLink: Boolean(selectedInfluencer.youtube),
                      href: safeExternalUrl(selectedInfluencer.youtube),
                    },
                  ],
                },
                {
                  title: 'Pre-Evaluation Metrics & Performance',
                  fields: [
                    {
                      label: 'Pre-Eval Engagement Rate (ER)',
                      value:
                        selectedInfluencer.preEvalEr !== null &&
                        selectedInfluencer.preEvalEr !== undefined
                          ? `${selectedInfluencer.preEvalEr}%`
                          : '—',
                    },
                    {
                      label: 'Committed Views Guarantee',
                      value: selectedInfluencer.committedViews
                        ? selectedInfluencer.committedViews.toLocaleString()
                        : 'Not specified',
                    },
                    {
                      label: 'Pre-Eval Cost Per View (CPV)',
                      value: selectedInfluencer.preEvalCpv
                        ? `₹${selectedInfluencer.preEvalCpv}`
                        : '—',
                      color: theme.palette.primary.main,
                    },
                    {
                      label: 'Reach from the Region',
                      value: selectedInfluencer.reachFromRegion || '—',
                    },
                  ],
                },
                {
                  title: 'Commercial Deliverables & Scope',
                  fields: [
                    {
                      label: 'Deliverables Format',
                      value: selectedInfluencer.deliverables || 'Pending agreement',
                      fullWidth: true,
                    },
                    {
                      label: 'Final Commercial Price',
                      value: selectedInfluencer.clientRate,
                      isMoney: true,
                      currency: selectedInfluencer.currency || 'INR',
                      color: theme.palette.tokens.positiveText,
                    },
                    {
                      label: 'Brand Fit & Qualitative Assessment',
                      value:
                        selectedInfluencer.brandFit || 'No qualitative assessment note provided',
                      fullWidth: true,
                    },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedInfluencer
            ? [
                ...(selectedInfluencer.brandStatus !== BrandStatusCode.APPROVED
                  ? [
                      {
                        label:
                          selectedInfluencer.brandStatus === BrandStatusCode.REJECTED
                            ? 'Re-Approve Proposal'
                            : 'Approve Proposal',
                        variant: 'contained' as const,
                        color: 'primary' as const,
                        onClick: () => {
                          const id = selectedInfluencer.id;
                          setSelectedInfluencer(null);
                          handleOpenApprove(id);
                        },
                      },
                    ]
                  : []),
                ...(selectedInfluencer.brandStatus === BrandStatusCode.APPROVED && campaignIsDraft
                  ? [
                      {
                        label: 'Remove Approval',
                        variant: 'outlined' as const,
                        color: 'warning' as const,
                        onClick: () => {
                          const id = selectedInfluencer.id;
                          setSelectedInfluencer(null);
                          handleOpenRemoveApproval(id);
                        },
                      },
                    ]
                  : []),
                {
                  label:
                    selectedInfluencer.brandStatus === BrandStatusCode.CORRECTION_REQUESTED
                      ? 'Update Remarks'
                      : 'Send Remarks / Correct',
                  variant: 'outlined' as const,
                  color: 'warning' as const,
                  onClick: () => {
                    const id = selectedInfluencer.id;
                    setSelectedInfluencer(null);
                    handleOpenCorrection(id);
                  },
                },
                ...(selectedInfluencer.brandStatus !== BrandStatusCode.REJECTED
                  ? [
                      {
                        label: 'Reject Proposal',
                        variant: 'outlined' as const,
                        color: 'error' as const,
                        onClick: () => {
                          const id = selectedInfluencer.id;
                          setSelectedInfluencer(null);
                          handleOpenReject(id);
                        },
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      {/* 5. CommentDialog for Reject / Request Correction / Remarks */}
      {activeDialog && (
        <CommentDialog
          open={Boolean(activeDialog)}
          title={activeDialog.title}
          subtitle={activeDialog.subtitle}
          confirmText={activeDialog.confirmText}
          loading={brandDecisionMutation.isPending}
          variant={activeDialog.action === 'REJECT' ? 'destructive' : 'neutral'}
          suggestions={activeDialog.suggestions}
          onConfirm={handleDialogSubmit}
          onCancel={() => setActiveDialog(null)}
        />
      )}

      {/* 6. Approval confirmation — the decision that cannot be undone */}
      <ConfirmDialog
        open={Boolean(approveDialogMapper)}
        title="Approve this commercial proposal?"
        body={
          <Box>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              You are approving <strong>{approveDialogMapper?.influencerName}</strong> for this
              campaign at the rate below.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 2,
                p: 1.5,
                mb: 1.5,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                border: `1px solid ${theme.palette.tokens.divider}`,
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Agreed rate
              </Typography>
              {approveDialogMapper?.clientRate !== null &&
              approveDialogMapper?.clientRate !== undefined ? (
                <MoneyText
                  amount={approveDialogMapper.clientRate}
                  currency={approveDialogMapper.currency}
                  variant="h3"
                />
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Not quoted
                </Typography>
              )}
            </Box>

            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              {campaignIsDraft
                ? 'Once approved, the rate is locked and the agency cannot revert it. While this campaign is still a draft you can take the approval back from the row menu; once it goes Active that is no longer possible.'
                : 'This is final. Once approved, the rate cannot be changed, the agency cannot revert it, and this creator cannot be rejected or sent back for correction. Send remarks instead if anything still needs to change.'}
            </Typography>
          </Box>
        }
        confirmText="Approve at this rate"
        cancelText="Cancel"
        loading={brandDecisionMutation.isPending}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveDialogMapper(null)}
      />

      {/* 7. Removing an approval — only reachable while the campaign is a draft */}
      <ConfirmDialog
        open={Boolean(revokeDialogMapper)}
        title="Remove this approval?"
        body={
          <Box>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              <strong>{revokeDialogMapper?.influencerName}</strong> goes back to Pending Review and
              your approval of this rate is withdrawn.
            </Typography>

            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              You can approve, reject or send remarks again afterwards. This is only possible while
              the campaign is a draft — the agency is notified, and the campaign cannot be marked
              Active until every assigned creator is approved again.
            </Typography>
          </Box>
        }
        confirmText="Remove approval"
        cancelText="Keep approval"
        loading={brandDecisionMutation.isPending}
        onConfirm={handleConfirmRemoveApproval}
        onCancel={() => setRevokeDialogMapper(null)}
      />
    </DashboardLayout>
  );
};
