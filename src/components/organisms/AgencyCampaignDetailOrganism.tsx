import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
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
} from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { FilterBar } from '@molecules';
import {
  useAgencyCampaign,
  useAgencyBrands,
  useCampaignInfluencers,
  useApproveRate,
  useRequestRevision,
  useSubmitForBrandReview,
  useRecordMetric,
  useRemoveInfluencerFromCampaign,
  useUpdateCampaign,
  useUpdatePreEval,
} from '@api';
import {
  AgencyMapperResponse,
  RecordMetricRequest,
  CampaignStatus,
  CampaignStatusCode,
  CampaignStatusName,
  RateStatusCode,
  UpdateCampaignRequest,
  UpdatePreEvalRequest,
} from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import { safeUrl, humanizeCode } from '@utils';

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

  const {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyCampaignDetail');
  const debouncedSearch = useDebounce(search, 300);

  const { data: campaign, isLoading: campaignLoading } = useAgencyCampaign(campaignId);
  const { data: brandsData } = useAgencyBrands();
  const brands = brandsData?.items || [];
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

  // Mutations
  const updateCampaignMutation = useUpdateCampaign();
  const updatePreEvalMutation = useUpdatePreEval(campaignId);
  const approveRateMutation = useApproveRate(campaignId);
  const requestRevisionMutation = useRequestRevision(campaignId);
  const submitBrandReviewMutation = useSubmitForBrandReview(campaignId);
  const recordMetricMutation = useRecordMetric(campaignId);
  const removeInfluencerMutation = useRemoveInfluencerFromCampaign(campaignId);

  // Dialog states
  const [approveDialogMapper, setApproveDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [revisionDialogMapper, setRevisionDialogMapper] = useState<AgencyMapperResponse | null>(
    null,
  );
  const [preEvalDialogMapper, setPreEvalDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [metricsDialogMapper, setMetricsDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [deleteDialogMapper, setDeleteDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [editCampaignOpen, setEditCampaignOpen] = useState(false);

  const brand = brands.find((b) => b.id === campaign?.brandId);

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

  const columns: Array<DataTableColumn<AgencyMapperResponse>> = [
    {
      id: 'influencer',
      header: 'Influencer',
      type: 'entity',
      accessor: (row) => row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`,
      subAccessor: (row) => row.deliverables || 'Deliverables pending',
    },
    {
      id: 'influencerRate',
      header: 'Influencer Rate',
      type: 'custom',
      render: (row) =>
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
      render: (row) =>
        row.margin !== null ? (
          <MoneyText
            amount={row.margin}
            currency={row.currency}
            variant="body2"
            color={theme.palette.tokens.accentText}
          />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            —
          </Typography>
        ),
    },
    {
      id: 'clientRate',
      header: 'Client Rate',
      type: 'custom',
      render: (row) =>
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
      header: 'Rate Status',
      type: 'custom',
      render: (row) => <StatusChip category="RATE_STATUS" code={row.rateStatus} />,
    },
    {
      id: 'brandStatus',
      header: 'Brand Status',
      type: 'custom',
      render: (row) => <StatusChip category="BRAND_STATUS" code={row.brandStatus} />,
    },
    {
      id: 'actions',
      header: 'Workflow Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {/* If rate is pending submission: agency can set price & margin to approve and send to brand */}
          {row.rateStatus === RateStatusCode.PENDING_SUBMISSION && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircleRoundedIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation();
                setApproveDialogMapper(row);
              }}
            >
              Set Price & Approve
            </Button>
          )}

          {/* If rate is submitted by influencer: Approve or Request Revision */}
          {row.rateStatus === RateStatusCode.SUBMITTED && (
            <>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setApproveDialogMapper(row);
                }}
              >
                Approve Rate
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RateReviewRoundedIcon fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setRevisionDialogMapper(row);
                }}
              >
                Revise
              </Button>
            </>
          )}

          {/* If approved by agency and not yet visible: Submit to Brand */}
          {row.rateStatus === RateStatusCode.AGENCY_APPROVED && !row.budgetVisible && (
            <Tooltip title="Send approved client rate for brand approval">
              <Button
                variant="outlined"
                size="small"
                startIcon={<SendRoundedIcon fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmitForBrandReview(row.id);
                }}
              >
                Send to Brand
              </Button>
            </Tooltip>
          )}

          {/* Edit Pre-Evaluation Details */}
          <Tooltip title="Edit Pre-Evaluation Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setPreEvalDialogMapper(row);
              }}
            >
              <TuneRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Record Deliverable Metrics */}
          <Tooltip title="Record Reach & Engagements">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMetricsDialogMapper(row);
              }}
            >
              <InsightsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Message Influencer */}
          <Tooltip title="Message Influencer">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(
                  `/agency/chats?participantId=${row.influencerId}&type=INFLUENCER&campaignId=${campaignId}`,
                );
              }}
              sx={{
                color: theme.palette.tokens.textSecondary,
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              <ChatBubbleOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Remove Influencer */}
          <Tooltip title="Remove Influencer from Campaign">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogMapper(row);
              }}
              sx={{ '&:hover': { color: theme.palette.tokens.negative } }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout
      title={campaign?.name || 'Campaign Management'}
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
        <Button
          variant="contained"
          startIcon={<PersonAddRoundedIcon fontSize="small" />}
          onClick={() => navigate(`/agency/campaigns/${campaignId}/add`)}
        >
          Add Influencers
        </Button>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
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
                    onClick={() =>
                      navigate(
                        `/agency/chats?participantId=${brand.id}&type=BRAND&campaignId=${campaignId}`,
                      )
                    }
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
              startIcon={<EditRoundedIcon fontSize="small" />}
              onClick={() => setEditCampaignOpen(true)}
              disabled={campaignLoading}
              sx={{ height: 34, fontSize: '13px', fontWeight: 600 }}
            >
              Edit Campaign
            </Button>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={campaign?.status ?? CampaignStatusCode.DRAFT}
                onChange={(e) => handleUpdateCampaignStatus(Number(e.target.value) as CampaignStatus)}
                disabled={updateCampaignMutation.isPending}
                sx={{
                  height: 34,
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: `${theme.customRadii.inner}px`,
                }}
              >
                <MenuItem value={CampaignStatusCode.DRAFT}>Draft</MenuItem>
                <MenuItem value={CampaignStatusCode.ACTIVE}>Active</MenuItem>
                <MenuItem value={CampaignStatusCode.COMPLETED}>Completed</MenuItem>
                <MenuItem value={CampaignStatusCode.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>

            {safeUrl(campaign?.briefUrl) && (
              <Button
                variant="outlined"
                size="small"
                href={safeUrl(campaign?.briefUrl) as string}
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
          subtitle="Submitted rates, agency margin approvals, and brand visibility"
          action={
            <Button
              variant="outlined"
              size="small"
              startIcon={<PersonAddRoundedIcon fontSize="small" />}
              onClick={() => navigate(`/agency/campaigns/${campaignId}/add`)}
            >
              Add Influencer
            </Button>
          }
        />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
        />

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
          loading={mappersLoading || campaignLoading}
          isFetching={mappersFetching}
        />
      </Box>

      {/* Approve Rate Dialog */}
      {approveDialogMapper && (
        <ApproveRateDialog
          open={Boolean(approveDialogMapper)}
          mapperId={approveDialogMapper.id}
          influencerName={approveDialogMapper.influencerName}
          influencerRate={approveDialogMapper.influencerRate}
          currency={approveDialogMapper.currency}
          initialDeliverables={approveDialogMapper.deliverables}
          initialPreEvalEr={approveDialogMapper.preEvalEr}
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
    </DashboardLayout>
  );
};
