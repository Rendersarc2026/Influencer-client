import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Avatar from '@mui/material/Avatar';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  DataTable,
  DataTableColumn,
  ApproveRateDialog,
  EditPreEvalDialog,
  RecordMetricsDialog,
  CommentDialog,
  ConfirmDialog,
  EditCampaignDialog,
  OverviewDrawer,
} from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { FilterBar } from '@molecules';
import {
  useAgencyCampaign,
  useCampaignInfluencers,
  useApproveRate,
  useRequestRevision,
  useSubmitForBrandReview,
  useRevertApproval,
  useRecordMetric,
  useRemoveInfluencerFromCampaign,
  useUpdateCampaign,
  useUpdatePreEval,
  apiClient,
} from '@api';
import {
  AgencyMapperResponse,
  RecordMetricRequest,
  MetricResponse,
  CampaignStatus,
  CampaignStatusCode,
  CampaignStatusName,
  RateStatusCode,
  BrandStatusCode,
  UpdateCampaignRequest,
  UpdatePreEvalRequest,
  ApprovalActionName,
  PaginatedResult,
} from '@contracts';
import { useAuth, useDebounce, useTableExport, useToast, useViewFilters } from '@hooks';
import {
  safeExternalUrl,
  humanizeCode,
  exportCampaignPerformanceReport,
  ExcelColumnConfig,
} from '@utils';

interface RowActionsProps {
  row: AgencyMapperResponse;
  campaignStatus?: CampaignStatus;
  onSetPriceApprove: (row: AgencyMapperResponse) => void;
  onApproveRate: (row: AgencyMapperResponse) => void;
  onRevise: (row: AgencyMapperResponse) => void;
  onEditMargin: (row: AgencyMapperResponse) => void;
  onRevertApproval: (row: AgencyMapperResponse) => void;
  onSendToBrand: (mapperId: string) => void;
  onEditPreEval: (row: AgencyMapperResponse) => void;
  onRecordMetrics: (row: AgencyMapperResponse) => void;
  onMessage: (influencerId: string) => void;
  onDelete: (row: AgencyMapperResponse) => void;
}

const RowActions: React.FC<RowActionsProps> = ({
  row,
  campaignStatus,
  onSetPriceApprove,
  onApproveRate,
  onRevise,
  onEditMargin,
  onRevertApproval,
  onSendToBrand,
  onEditPreEval,
  onRecordMetrics,
  onMessage,
  onDelete,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isCampaignCompleted = campaignStatus === CampaignStatusCode.COMPLETED;
  const isBrandApproved = row.brandStatus === BrandStatusCode.APPROVED;
  const hasCommercialActions =
    !isBrandApproved &&
    (row.rateStatus === RateStatusCode.PENDING_SUBMISSION ||
      row.rateStatus === RateStatusCode.REVISION_REQUESTED ||
      row.rateStatus === RateStatusCode.SUBMITTED ||
      row.rateStatus === RateStatusCode.AGENCY_APPROVED);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* 1. More Menu Button */}
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
        onClose={handleClose}
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
        {/* --- SECTION 1: Commercial & Workflow Progression --- */}

        {/* Set Price & Approve (Pending submission or revision requested) */}
        {!isBrandApproved &&
          (row.rateStatus === RateStatusCode.PENDING_SUBMISSION ||
            row.rateStatus === RateStatusCode.REVISION_REQUESTED) && (
            <MenuItem
              onClick={() => {
                handleClose();
                onSetPriceApprove(row);
              }}
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
              Set Price & Approve
            </MenuItem>
          )}

        {/* Approve Rate (Submitted quote) */}
        {!isBrandApproved && row.rateStatus === RateStatusCode.SUBMITTED && (
          <MenuItem
            onClick={() => {
              handleClose();
              onApproveRate(row);
            }}
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
            Approve Rate
          </MenuItem>
        )}

        {/* Send to Brand (Approved, not yet sent) */}
        {!isBrandApproved &&
          row.rateStatus === RateStatusCode.AGENCY_APPROVED &&
          !row.budgetVisible && (
            <MenuItem
              onClick={() => {
                handleClose();
                onSendToBrand(row.id);
              }}
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
                <SendRoundedIcon fontSize="small" />
              </ListItemIcon>
              Send to Brand
            </MenuItem>
          )}

        {/* Edit Agency Margin */}
        {!isBrandApproved && row.rateStatus === RateStatusCode.AGENCY_APPROVED && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEditMargin(row);
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
              <EditRoundedIcon fontSize="small" />
            </ListItemIcon>
            Edit Agency Margin
          </MenuItem>
        )}

        {/* Request Rate Revision */}
        {!isBrandApproved &&
          (row.rateStatus === RateStatusCode.SUBMITTED ||
            row.rateStatus === RateStatusCode.AGENCY_APPROVED) && (
            <MenuItem
              onClick={() => {
                handleClose();
                onRevise(row);
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
                <RateReviewRoundedIcon fontSize="small" />
              </ListItemIcon>
              Request Rate Revision
            </MenuItem>
          )}

        {/* Revert Rate Approval */}
        {!isBrandApproved && row.rateStatus === RateStatusCode.AGENCY_APPROVED && (
          <MenuItem
            onClick={() => {
              handleClose();
              onRevertApproval(row);
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
              color: theme.palette.warning.main,
              '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.warning.main, minWidth: 'auto' }}>
              <UndoRoundedIcon fontSize="small" />
            </ListItemIcon>
            Revert Rate Approval
          </MenuItem>
        )}

        {hasCommercialActions && <Divider sx={{ my: 0.5, borderColor: 'rgba(0, 0, 0, 0.06)' }} />}

        {/* --- SECTION 2: Details & Deliverables Management --- */}

        {/* Pre-Evaluation Details */}
        {!isCampaignCompleted && (
          <MenuItem
            onClick={() => {
              handleClose();
              onEditPreEval(row);
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
              <TuneRoundedIcon fontSize="small" />
            </ListItemIcon>
            Pre-Evaluation Details
          </MenuItem>
        )}

        {/* Record Post-Evaluation Performance */}
        <MenuItem
          onClick={() => {
            handleClose();
            onRecordMetrics(row);
          }}
          sx={{
            fontSize: '13px',
            fontWeight: isCampaignCompleted ? 600 : 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            ...(isCampaignCompleted
              ? {
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  color: theme.palette.primary.main,
                }
              : {}),
            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.12)' },
          }}
        >
          <ListItemIcon
            sx={{
              color: isCampaignCompleted
                ? theme.palette.primary.main
                : theme.palette.tokens.textSecondary,
              minWidth: 'auto',
            }}
          >
            <InsightsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Record Post-Evaluation Performance
        </MenuItem>

        {/* Message Influencer */}
        <MenuItem
          onClick={() => {
            handleClose();
            onMessage(row.influencerId);
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
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          Message Influencer
        </MenuItem>

        {/* --- SECTION 3: Destructive Actions --- */}

        {/* Remove from Campaign */}
        {!isCampaignCompleted && (
          <>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(0, 0, 0, 0.06)' }} />
            <MenuItem
              onClick={() => {
                handleClose();
                onDelete(row);
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
                color: theme.palette.tokens.negative,
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: theme.palette.tokens.negative,
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: 'auto' }}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </ListItemIcon>
              Remove from Campaign
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

interface AgencyCampaignDetailOrganismProps {
  campaignId?: string;
}

export const AgencyCampaignDetailOrganism: React.FC<AgencyCampaignDetailOrganismProps> = ({
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
    useViewFilters('agencyCampaignDetail');
  const debouncedSearch = useDebounce(search, 300);

  const { data: campaign, isLoading: campaignLoading } = useAgencyCampaign(campaignId);
  const {
    data: mappersData,
    isLoading: mappersLoading,
    isFetching: mappersFetching,
  } = useCampaignInfluencers(campaignId, {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const mappers = mappersData?.items || [];
  const totalMappers = mappersData?.total ?? mappers.length;

  /**
   * A campaign may only go Active or Completed once the brand has approved the
   * whole roster — the server refuses otherwise. Two limit-1 reads answer it
   * without paging: the roster size, and how much of it is approved. The list
   * above cannot stand in for the first, because a search narrows its total.
   */
  const { data: rosterCount } = useCampaignInfluencers(campaignId, { page: 1, limit: 1 });
  const { data: approvedCount } = useCampaignInfluencers(campaignId, {
    page: 1,
    limit: 1,
    brandStatus: BrandStatusCode.APPROVED,
  });
  const rosterSize = rosterCount?.total ?? 0;
  const awaitingBrandApproval = rosterSize - (approvedCount?.total ?? 0);
  const rosterFullyApproved = rosterSize > 0 && awaitingBrandApproval === 0;

  // Mutations
  const updateCampaignMutation = useUpdateCampaign();
  const updatePreEvalMutation = useUpdatePreEval(campaignId);
  const approveRateMutation = useApproveRate(campaignId);
  const requestRevisionMutation = useRequestRevision(campaignId);
  const submitBrandReviewMutation = useSubmitForBrandReview(campaignId);
  const revertApprovalMutation = useRevertApproval(campaignId);
  const recordMetricMutation = useRecordMetric(campaignId);
  const removeInfluencerMutation = useRemoveInfluencerFromCampaign(campaignId);

  // Dialog states
  const [overviewDrawerMapper, setOverviewDrawerMapper] = useState<AgencyMapperResponse | null>(
    null,
  );
  const [approveDialogMapper, setApproveDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [revisionDialogMapper, setRevisionDialogMapper] = useState<AgencyMapperResponse | null>(
    null,
  );
  const [revertDialogMapper, setRevertDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [preEvalDialogMapper, setPreEvalDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [metricsDialogMapper, setMetricsDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [selectInfluencerForMetricsOpen, setSelectInfluencerForMetricsOpen] = useState(false);
  const [deleteDialogMapper, setDeleteDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [editCampaignOpen, setEditCampaignOpen] = useState(false);

  // The campaign row carries its brand's id and name, which is all this screen
  // shows. It used to fetch the agency's whole brand list to look them up.
  const brand = campaign?.brandId ? { id: campaign.brandId, name: campaign.brandName ?? '' } : null;

  // 0. Handle Update Campaign Details & Status
  const handleEditCampaign = async (data: UpdateCampaignRequest) => {
    if (!campaignId) return;
    try {
      await updateCampaignMutation.mutateAsync({
        id: campaignId,
        data,
      });
      showSuccess('Campaign details updated successfully.');
      setEditCampaignOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to update campaign details.',
      );
    }
  };

  const handleUpdatePreEval = async (mapperId: string, data: UpdatePreEvalRequest) => {
    try {
      await updatePreEvalMutation.mutateAsync({ mapperId, data });
      showSuccess('Pre-evaluation details updated successfully.');
      setPreEvalDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to update pre-evaluation details.',
      );
    }
  };

  const handleUpdateCampaignStatus = async (newStatus: CampaignStatus) => {
    if (!campaignId) return;
    try {
      await updateCampaignMutation.mutateAsync({
        id: campaignId,
        data: { status: newStatus },
      });
      showSuccess(
        `Campaign status updated to ${humanizeCode(CampaignStatusName[newStatus] || String(newStatus))}.`,
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to update campaign status.',
      );
    }
  };

  // 1. Handle Approve Rate (sends { mapperId, margin, influencerRate, ...preEval })
  const handleApproveRate = async (
    mapperId: string,
    params: {
      margin: number;
      influencerRate?: number;
      committedViews?: number;
      preEvalEr?: number;
      reachFromRegion?: string;
      brandFit?: string;
      deliverables?: string;
    },
  ) => {
    try {
      await approveRateMutation.mutateAsync({ mapperId, ...params });
      showSuccess('Influencer commercial rate approved and submitted for brand review.');
      setApproveDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to approve rate.',
      );
    }
  };

  // 2. Handle Request Rate Revision (sends { comment } only)
  const handleRequestRevision = async (comment: string) => {
    if (!revisionDialogMapper) return;
    try {
      await requestRevisionMutation.mutateAsync({
        mapperId: revisionDialogMapper.id,
        comment,
      });
      showSuccess('Revision request sent to influencer.');
      setRevisionDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to request revision.',
      );
    }
  };

  // 3. Handle Submit to Brand Review
  const handleSubmitForBrandReview = async (mapperId: string) => {
    try {
      await submitBrandReviewMutation.mutateAsync(mapperId);
      showSuccess('Submitted to brand for review.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to submit for brand review.',
      );
    }
  };

  // 4. Handle Record Metric
  const handleRecordMetric = async (mapperId: string, data: RecordMetricRequest) => {
    try {
      await recordMetricMutation.mutateAsync({ mapperId, data });
      showSuccess('Deliverable metrics recorded successfully.');
      setMetricsDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to record metrics.',
      );
    }
  };

  // 5. Handle Remove Influencer
  const handleRemoveInfluencer = async () => {
    if (!deleteDialogMapper) return;
    try {
      await removeInfluencerMutation.mutateAsync(deleteDialogMapper.id);
      showSuccess('Influencer removed from campaign.');
      setDeleteDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to remove influencer.',
      );
    }
  };

  // 6. Handle Revert Approval
  const handleRevertApproval = async () => {
    if (!revertDialogMapper) return;
    try {
      await revertApprovalMutation.mutateAsync({ mapperId: revertDialogMapper.id });
      showSuccess(
        `Rate approval reverted for ${revertDialogMapper.influencerName || 'influencer'}. Status returned to Submitted.`,
      );
      setRevertDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to revert rate approval.',
      );
    }
  };

  // 7. Handle Download Full Performance & Post-Eval Report
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const handleDownloadPerformanceReport = async () => {
    if (!campaign || isDownloadingReport) return;
    try {
      setIsDownloadingReport(true);
      // 1. Fetch all mappers for this campaign without pagination
      const mappersRes = await apiClient.get<PaginatedResult<AgencyMapperResponse>>(
        `/agency/campaigns/${campaignId}/influencers`,
      );
      const allMappers = mappersRes.data.items || [];

      // 2. Fetch recorded post-eval metrics for each mapper in parallel
      const metricsPromises = allMappers.map(async (m) => {
        try {
          const res = await apiClient.get<MetricResponse[]>(`/agency/mappers/${m.id}/metrics`);
          return { mapperId: m.id, metrics: res.data || [] };
        } catch {
          return { mapperId: m.id, metrics: [] };
        }
      });

      const metricsResults = await Promise.all(metricsPromises);
      const metricsByMapperId: Record<string, MetricResponse[]> = {};
      for (const item of metricsResults) {
        metricsByMapperId[item.mapperId] = item.metrics;
      }

      // 3. Export structured multi-sheet Excel workbook
      const brandName = campaign.brandName || 'Brand Partner';

      await exportCampaignPerformanceReport({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          brandName,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        },
        mappers: allMappers,
        metricsByMapperId,
      });

      showSuccess('Campaign post-evaluation performance report downloaded.');
    } catch (err) {
      console.error('Failed to export performance report:', err);
      showError('Failed to generate performance report.');
    } finally {
      setIsDownloadingReport(false);
    }
  };

  const columns: Array<DataTableColumn<AgencyMapperResponse>> = [
    {
      id: 'influencer',
      header: 'Influencer',
      type: 'custom',
      minWidth: 200,
      accessor: (row: AgencyMapperResponse) =>
        row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`,
      subAccessor: (row: AgencyMapperResponse) => {
        const parts: string[] = [];
        if (row.deliverables) parts.push(row.deliverables);
        if (row.preEvalEr) parts.push(`${row.preEvalEr}% ER`);
        if (row.committedViews) parts.push(`${row.committedViews.toLocaleString()} views`);
        if (row.reachFromRegion) parts.push(`${row.reachFromRegion} reach`);
        return parts.join(' · ');
      },
      render: (row: AgencyMapperResponse) => {
        const parts: string[] = [];
        if (row.deliverables) parts.push(row.deliverables);
        if (row.preEvalEr) parts.push(`${row.preEvalEr}% ER`);
        if (row.committedViews) parts.push(`${row.committedViews.toLocaleString()} views`);
        if (row.reachFromRegion) parts.push(`${row.reachFromRegion} reach`);
        const sub = parts.length > 0 ? parts.join(' · ') : 'Deliverables pending';
        const brandRemark = row.revisionComment || row.lastComment;

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              setOverviewDrawerMapper(row);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              cursor: 'pointer',
              p: '2px 4px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: theme.palette.tokens.fieldBg,
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 750,
                  color: theme.palette.primary.main,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.tokens.textSecondary,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {sub}
              </Typography>
              {row.brandStatus === BrandStatusCode.CORRECTION_REQUESTED && brandRemark && (
                <Box
                  sx={{
                    mt: 0.5,
                    p: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    maxWidth: 240,
                  }}
                >
                  <EditNoteRoundedIcon
                    sx={{ fontSize: 13, color: theme.palette.warning.dark, flexShrink: 0 }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme.palette.warning.dark,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Brand: {brandRemark}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      id: 'influencerRate',
      header: 'Influencer Rate',
      type: 'custom',
      accessor: 'influencerRate',
      render: (row: AgencyMapperResponse) =>
        row.influencerRate !== null ? (
          <MoneyText amount={row.influencerRate} currency={row.currency} variant="body2" />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            Pending quote
          </Typography>
        ),
    },
    {
      id: 'margin',
      header: 'Agency Margin',
      type: 'custom',
      accessor: 'margin',
      render: (row: AgencyMapperResponse) => {
        if (row.margin === null) {
          return (
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              —
            </Typography>
          );
        }

        const isBrandApproved = row.brandStatus === BrandStatusCode.APPROVED;
        if (isBrandApproved) {
          return (
            <MoneyText
              amount={row.margin}
              currency={row.currency}
              variant="body2"
              color={theme.palette.tokens.accentText}
            />
          );
        }

        return (
          <Tooltip title="Click to edit agency margin">
            <Box
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                setApproveDialogMapper(row);
              }}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                p: '2px 6px',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: theme.palette.tokens.fieldBg,
                },
              }}
            >
              <MoneyText
                amount={row.margin}
                currency={row.currency}
                variant="body2"
                color={theme.palette.tokens.accentText}
              />
              <EditRoundedIcon
                sx={{ fontSize: 13, color: theme.palette.tokens.accentText, opacity: 0.7 }}
              />
            </Box>
          </Tooltip>
        );
      },
    },
    {
      id: 'clientRate',
      header: 'Client Rate',
      type: 'custom',
      accessor: 'clientRate',
      render: (row: AgencyMapperResponse) =>
        row.clientRate !== null ? (
          <MoneyText
            amount={row.clientRate}
            currency={row.currency}
            variant="body2"
            color={theme.palette.tokens.positiveText}
          />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            —
          </Typography>
        ),
    },
    {
      id: 'rateStatus',
      header: 'Agency Status',
      type: 'custom',
      accessor: 'rateStatus',
      statusCategory: 'RATE_STATUS',
      render: (row: AgencyMapperResponse) => (
        <StatusChip category="RATE_STATUS" code={row.rateStatus} />
      ),
    },
    {
      id: 'brandStatus',
      header: 'Brand Status',
      type: 'custom',
      accessor: 'brandStatus',
      statusCategory: 'BRAND_STATUS',
      render: (row: AgencyMapperResponse) => (
        <StatusChip category="BRAND_STATUS" code={row.brandStatus} />
      ),
    },
    {
      id: 'actions',
      header: 'Workflow Actions',
      type: 'actions',
      align: 'right',
      render: (row: AgencyMapperResponse) => (
        <RowActions
          row={row}
          campaignStatus={campaign?.status}
          onSetPriceApprove={(r) => setApproveDialogMapper(r)}
          onApproveRate={(r) => setApproveDialogMapper(r)}
          onRevise={(r) => setRevisionDialogMapper(r)}
          onEditMargin={(r) => setApproveDialogMapper(r)}
          onRevertApproval={(r) => setRevertDialogMapper(r)}
          onSendToBrand={(mapperId) => handleSubmitForBrandReview(mapperId)}
          onEditPreEval={(r) => setPreEvalDialogMapper(r)}
          onRecordMetrics={(r) => setMetricsDialogMapper(r)}
          onMessage={(influencerId) =>
            navigate(`/agency/chats?participantId=${influencerId}&type=INFLUENCER`)
          }
          onDelete={(r) => setDeleteDialogMapper(r)}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<AgencyMapperResponse[]> => {
    if (!campaignId) return [];
    const res = await apiClient.get<PaginatedResult<AgencyMapperResponse>>(
      `/agency/campaigns/${campaignId}/influencers`,
      {
        params: {
          search: debouncedSearch.trim() || undefined,
        },
      },
    );
    return res.data.items || [];
  };

  // Two distinct downloads on this page. This one is the table in front of you:
  // the roster with its rates, margins and statuses. The header's Performance
  // Report is the multi-sheet post-evaluation workbook — both buttons used to
  // produce that one, so the table itself could not be exported at all.
  const { exportExcel: exportRoster, isExporting: isExportingRoster } =
    useTableExport<AgencyMapperResponse>({
      filename: `${campaign?.name || 'campaign'}_influencers`,
      sheetName: 'Influencers',
      columns: columns as Array<ExcelColumnConfig<AgencyMapperResponse>>,
      rows: mappers,
      onExportAll: handleExportAll,
    });

  const isDraft = (campaign?.status ?? CampaignStatusCode.DRAFT) === CampaignStatusCode.DRAFT;
  const isCompleted =
    (campaign?.status ?? CampaignStatusCode.DRAFT) === CampaignStatusCode.COMPLETED;
  const canEditCampaign =
    (campaign?.status ?? CampaignStatusCode.DRAFT) === CampaignStatusCode.DRAFT ||
    campaign?.status === CampaignStatusCode.ACTIVE;

  const handleOpenRecordMetrics = () => {
    if (mappers.length === 1) {
      setMetricsDialogMapper(mappers[0]);
    } else if (mappers.length > 1) {
      setSelectInfluencerForMetricsOpen(true);
    } else {
      showError('No assigned influencers in this campaign to record metrics for.');
    }
  };

  return (
    <DashboardLayout
      title="Campaign Details"
      subtitle="Manage assigned influencer rosters, commercial margins, and deliverable approvals"
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Lead',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      breadcrumbs={[{ label: 'Campaigns', path: '/agency/campaigns' }]}
      onBack={() => navigate('/agency/campaigns')}
      backLabel="Back to Campaigns"
      rightAction={
        isDraft ? (
          <Button
            variant="contained"
            startIcon={<PersonAddRoundedIcon fontSize="small" />}
            onClick={() => navigate(`/agency/campaigns/${campaignId}/add`)}
          >
            Add Influencers
          </Button>
        ) : isCompleted ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<InsightsRoundedIcon fontSize="small" />}
            onClick={handleOpenRecordMetrics}
            disabled={campaignLoading || mappers.length === 0}
            sx={{ fontWeight: 700 }}
          >
            Record Post-Evaluation Performance
          </Button>
        ) : undefined
      }
    >
      {/* 1. Campaign Brief Summary Card */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
          // The layout's content body is a fixed-height flex column, so a card
          // left to shrink gets squeezed by the table below it — and MUI's Card
          // clips overflow, which cut the description off mid-line.
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Client Brand:{' '}
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
                >
                  {brand?.name || 'Brand Account'}
                </Box>
              </Typography>
              {brand && (
                <Tooltip title="Message Client Brand">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/agency/chats?participantId=${brand.id}&type=BRAND`)}
                    sx={{
                      p: 0.5,
                      color: theme.palette.tokens.textSecondary,
                      '&:hover': { color: theme.palette.primary.main },
                    }}
                  >
                    <ChatBubbleOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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
              onClick={handleDownloadPerformanceReport}
              disabled={isDownloadingReport || campaignLoading}
              sx={{ height: 34, fontSize: '13px', fontWeight: 600 }}
            >
              {isDownloadingReport ? 'Generating Report...' : 'Download Performance Report'}
            </Button>

            {canEditCampaign && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditRoundedIcon fontSize="small" />}
                onClick={() => setEditCampaignOpen(true)}
                disabled={campaignLoading}
                sx={{ height: 34, fontSize: '13px', fontWeight: 600 }}
              >
                Edit Campaign
              </Button>
            )}

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={campaign?.status ?? CampaignStatusCode.DRAFT}
                onChange={(e) =>
                  handleUpdateCampaignStatus(Number(e.target.value) as CampaignStatus)
                }
                disabled={updateCampaignMutation.isPending}
                sx={{
                  height: 34,
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: `${theme.customRadii.inner}px`,
                }}
              >
                <MenuItem value={CampaignStatusCode.DRAFT}>Draft</MenuItem>
                <MenuItem value={CampaignStatusCode.ACTIVE} disabled={!rosterFullyApproved}>
                  Active
                </MenuItem>
                <MenuItem value={CampaignStatusCode.COMPLETED} disabled={!rosterFullyApproved}>
                  Completed
                </MenuItem>
                <MenuItem value={CampaignStatusCode.CANCELLED}>Cancelled</MenuItem>
              </Select>
              {/* Say why the two are greyed out, rather than leaving a dead option. */}
              {!rosterFullyApproved && (
                <FormHelperText sx={{ fontSize: '11.5px', mx: 0, mt: 0.5 }}>
                  {rosterSize === 0
                    ? 'Assign an influencer before going live'
                    : `${awaitingBrandApproval} of ${rosterSize} awaiting brand approval`}
                </FormHelperText>
              )}
            </FormControl>

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
            pt: 1,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
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
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              INFLUENCERS ASSIGNED
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {mappers.length} Influencers
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 2. Assigned Influencers & Rates DataTable */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionHeading
          title="Assigned Influencers & Rate Pipeline"
          subtitle="Submitted rates, agency margin approvals, and deliverable post-evaluations"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isExportingRoster ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <FileDownloadRoundedIcon fontSize="small" />
                  )
                }
                onClick={() => {
                  void exportRoster();
                }}
                disabled={isExportingRoster || campaignLoading || mappers.length === 0}
              >
                {isExportingRoster ? 'Exporting...' : 'Export Excel'}
              </Button>
              {isDraft && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddRoundedIcon fontSize="small" />}
                  onClick={() => navigate(`/agency/campaigns/${campaignId}/add`)}
                >
                  Add Influencer
                </Button>
              )}
            </Box>
          }
        />

        <FilterBar searchValue={search} onSearchChange={setSearch} />

        <DataTable<AgencyMapperResponse>
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
          onRowClick={(row) => setOverviewDrawerMapper(row)}
          loading={mappersLoading || campaignLoading}
          isFetching={mappersFetching}
        />
      </Box>

      {/* Influencer Overview Drawer */}
      <OverviewDrawer
        open={Boolean(overviewDrawerMapper)}
        onClose={() => setOverviewDrawerMapper(null)}
        title={overviewDrawerMapper?.influencerName || 'Influencer Overview'}
        subtitle={
          overviewDrawerMapper
            ? `${overviewDrawerMapper.category || 'Influencer'} · ${overviewDrawerMapper.region || 'India'}`
            : undefined
        }
        badge={overviewDrawerMapper ? overviewDrawerMapper.rateStatus : undefined}
        badgeCategory="RATE_STATUS"
        avatarText={overviewDrawerMapper?.influencerName}
        highlights={
          overviewDrawerMapper
            ? [
                {
                  label: 'Influencer Rate',
                  value:
                    overviewDrawerMapper.influencerRate !== null
                      ? `₹${overviewDrawerMapper.influencerRate.toLocaleString('en-IN')}`
                      : 'Pending quote',
                  tint: 'sky',
                },
                {
                  label: 'Agency Margin',
                  value:
                    overviewDrawerMapper.margin !== null
                      ? `₹${overviewDrawerMapper.margin.toLocaleString('en-IN')}`
                      : '—',
                  tint: 'lavender',
                },
                {
                  label: 'Client Rate (Billed)',
                  value:
                    overviewDrawerMapper.clientRate !== null
                      ? `₹${overviewDrawerMapper.clientRate.toLocaleString('en-IN')}`
                      : '—',
                  tint: 'mint',
                  sublabel: overviewDrawerMapper.preEvalCpv
                    ? `₹${overviewDrawerMapper.preEvalCpv} CPV`
                    : undefined,
                },
                {
                  label: 'Committed Views',
                  value: overviewDrawerMapper.committedViews
                    ? overviewDrawerMapper.committedViews.toLocaleString()
                    : '—',
                  tint: 'butter',
                },
              ]
            : []
        }
        sections={
          overviewDrawerMapper
            ? [
                {
                  title: 'Influencer Profile & Demographics',
                  fields: [
                    { label: 'Influencer Name', value: overviewDrawerMapper.influencerName },
                    {
                      label: 'Category / Niche',
                      value: overviewDrawerMapper.category || 'General',
                    },
                    {
                      label: 'Region / Location',
                      value: overviewDrawerMapper.region || 'India',
                    },
                    {
                      label: 'Followers Count',
                      value: overviewDrawerMapper.followers
                        ? overviewDrawerMapper.followers.toLocaleString()
                        : '—',
                    },
                    {
                      label: 'Instagram Profile',
                      value: overviewDrawerMapper.instagram || '—',
                      isLink: Boolean(overviewDrawerMapper.instagram),
                      href: safeExternalUrl(overviewDrawerMapper.instagram),
                    },
                    {
                      label: 'YouTube Channel',
                      value: overviewDrawerMapper.youtube || '—',
                      isLink: Boolean(overviewDrawerMapper.youtube),
                      href: safeExternalUrl(overviewDrawerMapper.youtube),
                    },
                  ],
                },
                {
                  title: 'Pre-Evaluation Metrics & Performance',
                  fields: [
                    {
                      label: 'Pre-Eval Engagement Rate (ER)',
                      value:
                        overviewDrawerMapper.preEvalEr !== null &&
                        overviewDrawerMapper.preEvalEr !== undefined
                          ? `${overviewDrawerMapper.preEvalEr}%`
                          : '—',
                    },
                    {
                      label: 'Committed Views Guarantee',
                      value: overviewDrawerMapper.committedViews
                        ? overviewDrawerMapper.committedViews.toLocaleString()
                        : 'Not specified',
                    },
                    {
                      label: 'Pre-Eval Cost Per View (CPV)',
                      value: overviewDrawerMapper.preEvalCpv
                        ? `₹${overviewDrawerMapper.preEvalCpv}`
                        : '—',
                      color: theme.palette.primary.main,
                    },
                    {
                      label: 'Reach from the Region',
                      value: overviewDrawerMapper.reachFromRegion || '—',
                    },
                  ],
                },
                {
                  title: 'Commercials & Deliverables',
                  fields: [
                    {
                      label: 'Deliverables Format',
                      value: overviewDrawerMapper.deliverables || 'Pending agreement',
                      fullWidth: true,
                    },
                    {
                      label: 'Influencer Quoted Rate',
                      value: overviewDrawerMapper.influencerRate,
                      isMoney: true,
                      currency: overviewDrawerMapper.currency || 'INR',
                    },
                    {
                      label: 'Agency Commercial Margin',
                      value: overviewDrawerMapper.margin,
                      isMoney: true,
                      currency: overviewDrawerMapper.currency || 'INR',
                      color: theme.palette.tokens.accentText,
                    },
                    {
                      label: 'Billed to Brand (Client Rate)',
                      value: overviewDrawerMapper.clientRate,
                      isMoney: true,
                      currency: overviewDrawerMapper.currency || 'INR',
                      color: theme.palette.tokens.positiveText,
                    },
                    {
                      label: 'Brand Fit & Qualitative Assessment',
                      value:
                        overviewDrawerMapper.brandFit || 'No qualitative assessment note provided',
                      fullWidth: true,
                    },
                  ],
                },
                ...(overviewDrawerMapper.revisionComment
                  ? [
                      {
                        title: 'Active Brand Remarks & Correction Feedback',
                        fields: [
                          {
                            label: 'Brand Remark',
                            value: overviewDrawerMapper.revisionComment,
                            fullWidth: true,
                            color: theme.palette.warning.dark,
                          },
                        ],
                      },
                    ]
                  : []),
                ...(overviewDrawerMapper.approvalEvents &&
                overviewDrawerMapper.approvalEvents.length > 0
                  ? [
                      {
                        title: 'Workflow History & Comments',
                        fields: overviewDrawerMapper.approvalEvents.map((evt) => ({
                          label: `${new Date(evt.createdOn).toLocaleDateString('en-IN')}: ${humanizeCode(ApprovalActionName[evt.action] || 'Action')}`,
                          value: evt.comment || 'Status updated',
                          fullWidth: true,
                        })),
                      },
                    ]
                  : []),
              ]
            : []
        }
        actions={
          overviewDrawerMapper
            ? [
                ...(isCompleted || overviewDrawerMapper.brandStatus === BrandStatusCode.APPROVED
                  ? [
                      {
                        label: 'Record Post-Evaluation Performance',
                        variant: 'contained' as const,
                        onClick: () => {
                          const row = overviewDrawerMapper;
                          setOverviewDrawerMapper(null);
                          setMetricsDialogMapper(row);
                        },
                      },
                    ]
                  : []),
                ...(overviewDrawerMapper.brandStatus !== BrandStatusCode.APPROVED
                  ? [
                      {
                        label: 'Edit Margin & Commercials',
                        variant: isCompleted ? ('outlined' as const) : ('contained' as const),
                        onClick: () => {
                          const row = overviewDrawerMapper;
                          setOverviewDrawerMapper(null);
                          setApproveDialogMapper(row);
                        },
                      },
                    ]
                  : []),
                {
                  label: 'Message Influencer',
                  variant: 'outlined' as const,
                  onClick: () => {
                    const id = overviewDrawerMapper.influencerId;
                    setOverviewDrawerMapper(null);
                    navigate(`/agency/chats?participantId=${id}&type=INFLUENCER`);
                  },
                },
              ]
            : []
        }
      />

      {/* Select Influencer for Post-Evaluation Performance Modal */}
      <Dialog
        open={selectInfluencerForMetricsOpen}
        onClose={() => setSelectInfluencerForMetricsOpen(false)}
        maxWidth="xs"
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
            Select Influencer
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Choose an assigned influencer to record post-evaluation performance metrics
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {mappers.map((m) => (
              <Box
                key={m.id}
                onClick={() => {
                  setSelectInfluencerForMetricsOpen(false);
                  setMetricsDialogMapper(m);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    backgroundColor: theme.palette.tokens.fieldBg,
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {m.influencerName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {m.influencerName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.tokens.textSecondary,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.deliverables || 'Deliverables assigned'}
                  </Typography>
                </Box>
                <InsightsRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setSelectInfluencerForMetricsOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve / Edit Rate Dialog */}
      {approveDialogMapper && (
        <ApproveRateDialog
          open={Boolean(approveDialogMapper)}
          mapperId={approveDialogMapper.id}
          influencerId={approveDialogMapper.influencerId}
          influencerName={approveDialogMapper.influencerName}
          influencerRate={approveDialogMapper.influencerRate}
          initialMargin={approveDialogMapper.margin}
          isAlreadyApproved={approveDialogMapper.rateStatus === RateStatusCode.AGENCY_APPROVED}
          currency={approveDialogMapper.currency}
          initialDeliverables={approveDialogMapper.deliverables}
          initialPreEvalEr={approveDialogMapper.preEvalEr}
          initialReachFromRegion={approveDialogMapper.reachFromRegion}
          initialBrandFit={approveDialogMapper.brandFit}
          initialCommittedViews={approveDialogMapper.committedViews}
          loading={approveRateMutation.isPending}
          onApprove={handleApproveRate}
          onClose={() => setApproveDialogMapper(null)}
        />
      )}

      {/* Request Revision Comment Dialog */}
      <CommentDialog
        open={Boolean(revisionDialogMapper)}
        title="Request Rate Revision"
        subtitle="Explain the reason or requested target rate to the influencer"
        confirmText="Send Revision Request"
        loading={requestRevisionMutation.isPending}
        onConfirm={handleRequestRevision}
        onCancel={() => setRevisionDialogMapper(null)}
      />

      {/* Edit Pre-Evaluation Dialog */}
      {preEvalDialogMapper && (
        <EditPreEvalDialog
          open={Boolean(preEvalDialogMapper)}
          mapper={preEvalDialogMapper}
          loading={updatePreEvalMutation.isPending}
          onSubmit={handleUpdatePreEval}
          onClose={() => setPreEvalDialogMapper(null)}
        />
      )}

      {/* Record Metrics Dialog */}
      {metricsDialogMapper && (
        <RecordMetricsDialog
          open={Boolean(metricsDialogMapper)}
          mapperId={metricsDialogMapper.id}
          influencerName={metricsDialogMapper.influencerName}
          loading={recordMetricMutation.isPending}
          onSubmit={handleRecordMetric}
          onClose={() => setMetricsDialogMapper(null)}
        />
      )}

      {/* Edit Campaign Details Dialog */}
      <EditCampaignDialog
        open={editCampaignOpen}
        campaign={campaign || null}
        loading={updateCampaignMutation.isPending}
        onSubmit={handleEditCampaign}
        onClose={() => setEditCampaignOpen(false)}
      />

      {/* Confirm Remove Influencer Dialog */}
      <ConfirmDialog
        open={Boolean(deleteDialogMapper)}
        title="Remove Influencer from Campaign?"
        body={`Are you sure you want to remove this influencer from ${campaign?.name || 'the campaign'}? Any submitted rates or draft workflows will be unassigned.`}
        confirmText="Remove Influencer"
        variant="destructive"
        loading={removeInfluencerMutation.isPending}
        onConfirm={handleRemoveInfluencer}
        onCancel={() => setDeleteDialogMapper(null)}
      />

      {/* Confirm Revert Approval Dialog */}
      <ConfirmDialog
        open={Boolean(revertDialogMapper)}
        title="Revert Rate Approval?"
        body={`Are you sure you want to revert the rate approval for ${revertDialogMapper?.influencerName || 'this influencer'}? The rate status will return to Submitted, unlocking the quote and resetting brand visibility.`}
        confirmText="Revert Approval"
        variant="destructive"
        loading={revertApprovalMutation.isPending}
        onConfirm={handleRevertApproval}
        onCancel={() => setRevertDialogMapper(null)}
      />
    </DashboardLayout>
  );
};
