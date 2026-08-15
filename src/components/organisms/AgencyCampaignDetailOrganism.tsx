import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  DataTable,
  DataTableColumn,
  ApproveRateDialog,
  RecordMetricsDialog,
  CommentDialog,
  ConfirmDialog,
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
} from '@api';
import { AgencyMapperResponse, RecordMetricRequest } from '@contracts';
import { useAuth, useDebounce } from '@hooks';
import { safeUrl } from '@utils';

export const AgencyCampaignDetailOrganism: React.FC = () => {
  const theme = useTheme();
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: campaign, isLoading: campaignLoading } = useAgencyCampaign(campaignId);
  const { data: brandsData } = useAgencyBrands();
  const brands = brandsData?.items || [];
  const { data: mappersData, isLoading: mappersLoading } = useCampaignInfluencers(campaignId, {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const mappers = mappersData?.items || [];
  const totalMappers = mappersData?.total ?? mappers.length;

  // Mutations
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
  const [metricsDialogMapper, setMetricsDialogMapper] = useState<AgencyMapperResponse | null>(null);
  const [deleteDialogMapper, setDeleteDialogMapper] = useState<AgencyMapperResponse | null>(null);

  const brand = brands.find((b) => b.id === campaign?.brandId);

  // 1. Handle Approve Rate (sends { mapperId, margin } only)
  const handleApproveRate = async (mapperId: string, margin: number) => {
    await approveRateMutation.mutateAsync({ mapperId, margin });
    setApproveDialogMapper(null);
  };

  // 2. Handle Request Rate Revision (sends { comment } only)
  const handleRequestRevision = async (comment: string) => {
    if (!revisionDialogMapper) return;
    await requestRevisionMutation.mutateAsync({
      mapperId: revisionDialogMapper.id,
      comment,
    });
    setRevisionDialogMapper(null);
  };

  // 3. Handle Submit to Brand Review
  const handleSubmitForBrandReview = async (mapperId: string) => {
    await submitBrandReviewMutation.mutateAsync(mapperId);
  };

  // 4. Handle Record Metric
  const handleRecordMetric = async (mapperId: string, data: RecordMetricRequest) => {
    await recordMetricMutation.mutateAsync({ mapperId, data });
    setMetricsDialogMapper(null);
  };

  // 5. Handle Remove Influencer
  const handleRemoveInfluencer = async () => {
    if (!deleteDialogMapper) return;
    await removeInfluencerMutation.mutateAsync(deleteDialogMapper.id);
    setDeleteDialogMapper(null);
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
      render: (row) => <StatusChip status={row.rateStatus} />,
    },
    {
      id: 'brandStatus',
      header: 'Brand Status',
      type: 'custom',
      render: (row) => <StatusChip status={row.brandStatus} />,
    },
    {
      id: 'actions',
      header: 'Workflow Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {/* If rate is submitted by influencer: Approve or Request Revision */}
          {row.rateStatus === 'SUBMITTED' && (
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
                Approve
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
          {row.rateStatus === 'AGENCY_APPROVED' && !row.budgetVisible && (
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
      title={campaign?.name || 'Campaign Detail'}
      subtitle={brand ? `Brand: ${brand.name}` : 'Campaign overview & rates'}
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon fontSize="small" />}
            onClick={() => navigate('/agency/campaigns')}
          >
            Campaigns
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddRoundedIcon fontSize="small" />}
            onClick={() => navigate(`/agency/campaigns/${campaignId}/add`)}
          >
            Add Influencers
          </Button>
        </Box>
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
        }}
      >
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h2">{campaign?.name}</Typography>
              {campaign?.status && <StatusChip status={campaign.status} />}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              Client Brand:{' '}
              <Box
                component="span"
                sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
              >
                {brand?.name || 'Brand Account'}
              </Box>
            </Typography>
          </Box>

          {safeUrl(campaign?.briefUrl) && (
            <Button
              variant="outlined"
              size="small"
              href={safeUrl(campaign?.briefUrl) as string}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<LaunchRoundedIcon fontSize="small" />}
            >
              Open Campaign Brief
            </Button>
          )}
        </Box>

        {campaign?.description && (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mb: 2 }}>
            {campaign.description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 4,
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
              CREATORS ASSIGNED
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
              Add Creator
            </Button>
          }
        />

        <FilterBar
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          searchPlaceholder="Search influencers or deliverables..."
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
        />
      </Box>

      {/* Approve Rate Dialog */}
      {approveDialogMapper && (
        <ApproveRateDialog
          open={Boolean(approveDialogMapper)}
          mapperId={approveDialogMapper.id}
          influencerName={approveDialogMapper.influencerName}
          influencerRate={approveDialogMapper.influencerRate || 0}
          currency={approveDialogMapper.currency}
          loading={approveRateMutation.isPending}
          onApprove={handleApproveRate}
          onClose={() => setApproveDialogMapper(null)}
        />
      )}

      {/* Request Revision Comment Dialog */}
      <CommentDialog
        open={Boolean(revisionDialogMapper)}
        title="Request Rate Revision"
        subtitle="Explain the reason or requested target rate to the creator"
        confirmText="Send Revision Request"
        loading={requestRevisionMutation.isPending}
        onConfirm={handleRequestRevision}
        onCancel={() => setRevisionDialogMapper(null)}
      />

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

      {/* Confirm Remove Influencer Dialog */}
      <ConfirmDialog
        open={Boolean(deleteDialogMapper)}
        title="Remove Influencer from Campaign?"
        body={`Are you sure you want to remove this creator from ${campaign?.name || 'the campaign'}? Any submitted rates or draft workflows will be unassigned.`}
        confirmText="Remove Creator"
        variant="destructive"
        loading={removeInfluencerMutation.isPending}
        onConfirm={handleRemoveInfluencer}
        onCancel={() => setDeleteDialogMapper(null)}
      />
    </DashboardLayout>
  );
};
