import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn, FilterBar, SubmitRateDialog } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import {
  useInfluencerAssignments,
  useInfluencerDashboardSummary,
  useSubmitInfluencerRate,
  apiClient,
} from '@api';
import {
  InfluencerMapperResponse,
  SubmitRateRequest,
  RateStatusEnum,
  PaginatedResult,
} from '@contracts';
import {
  useAuth,
  useDebouncedSearch,
  useEnumPills,
  useToast,
  useViewFilters,
  usePillCode,
} from '@hooks';
import { formatCurrency } from '@utils';

export const InfluencerHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    activePill,
    setActivePill,
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('influencerHome');
  const { debounced: debouncedSearch, pending: searchPending } = useDebouncedSearch(search, 300);
  const rateStatusFilter = usePillCode(activePill, RateStatusEnum);

  const {
    data: assignmentsData,
    isLoading: isTableLoading,
    isFetching,
  } = useInfluencerAssignments({
    rateStatus: rateStatusFilter,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  // Counted and summed in Postgres. The tiles used to be derived from a second,
  // unpaginated fetch of every assignment this creator has ever been given.
  const { data: summary, isLoading: isSummaryLoading } = useInfluencerDashboardSummary();

  const assignments = assignmentsData?.items || [];
  const totalAssignments = assignmentsData?.total ?? assignments.length;

  const submitRateMutation = useSubmitInfluencerRate();

  const [activeRateDialogMapper, setActiveRateDialogMapper] =
    useState<InfluencerMapperResponse | null>(null);

  // The set comes from the registry; only the wording is creator-facing. This
  // also restores REVISION_REQUESTED, which the hardcoded list omitted — a
  // creator whose rate was sent back had no way to filter for it.
  const filterPills = useEnumPills('RATE_STATUS', 'All Briefs', {
    PENDING_SUBMISSION: 'Action Required',
    SUBMITTED: 'Under Review',
    REVISION_REQUESTED: 'Needs Revision',
    AGENCY_APPROVED: 'Approved',
  });

  const handleSubmitRate = async (mapperId: string, data: SubmitRateRequest) => {
    try {
      await submitRateMutation.mutateAsync({ mapperId, data });
      showSuccess('Commercial quote submitted for agency review.');
      setActiveRateDialogMapper(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to submit quote.',
      );
    }
  };

  const columns: Array<DataTableColumn<InfluencerMapperResponse>> = [
    {
      id: 'campaign',
      header: 'Campaign Assignment',
      type: 'entity',
      accessor: (row) =>
        row.campaignName || row.campaign?.name || `Campaign #${row.campaignId.slice(0, 8)}`,
      subAccessor: (row) => {
        const parts: string[] = [];
        if (row.brandName) parts.push(row.brandName);
        if (row.deliverables) parts.push(row.deliverables);
        return parts.length > 0 ? parts.join(' · ') : 'Deliverables in brief';
      },
    },
    {
      id: 'rateStatus',
      header: 'Agency Status',
      type: 'custom',
      accessor: 'rateStatus',
      statusCategory: 'RATE_STATUS',
      render: (row) => <StatusChip category="RATE_STATUS" code={row.rateStatus} />,
    },
    {
      id: 'influencerRate',
      header: 'My Commercial Quote',
      type: 'custom',
      accessor: 'influencerRate',
      render: (row) =>
        row.influencerRate !== null ? (
          <MoneyText amount={row.influencerRate} currency={row.currency} variant="body2" />
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setActiveRateDialogMapper(row);
            }}
          >
            Quote Rate
          </Button>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/influencer/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          View Details
        </Button>
      ),
    },
  ];

  const handleExportAll = async (): Promise<InfluencerMapperResponse[]> => {
    const res = await apiClient.get<PaginatedResult<InfluencerMapperResponse>>(
      '/influencer/assignments',
      {
        params: {
          rateStatus: rateStatusFilter,
          search: debouncedSearch.trim() || undefined,
        },
      },
    );
    return res.data.items || [];
  };

  return (
    <DashboardLayout
      title="Fetch Dashboard"
      subtitle="Campaign assignments, commercial rate cards, and delivery milestones"
      navItems={navConfig.INFLUENCER}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Influencer',
        email: user?.email,
        roleCode: 'INFLUENCER',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      {/* 1. Four Metric Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} alignItems="stretch">
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Active Campaigns"
            value={summary?.totalAssignments ?? 0}
            loading={isSummaryLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Invited & active briefs"
            onClick={() => navigate('/influencer/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Pending Rates"
            value={summary?.pendingRates ?? 0}
            loading={isSummaryLoading}
            icon={<EditNoteRoundedIcon fontSize="small" />}
            subtitle="Quotes requested"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Approved Deals"
            value={summary?.approvedRates ?? 0}
            loading={isSummaryLoading}
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            subtitle="Confirmed bookings"
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Earned"
            value={formatCurrency(summary?.totalEarnings ?? 0)}
            loading={isSummaryLoading}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle="From collaborations"
          />
        </Grid>
      </Grid>

      {/* 2. Current Campaign Assignments Section */}
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionHeading
          title="Current Campaign Assignments"
          subtitle="Submit your commercial rate and track agency approval status"
        />

        <FilterBar
          searchPlaceholder="Search assignments..."
          searchValue={search}
          onSearchChange={setSearch}
          pills={filterPills}
          activePillId={activePill}
          onPillChange={(pill) => {
            setActivePill(pill);
            setPage(0);
          }}
        />

        <DataTable<InfluencerMapperResponse>
          columns={columns}
          rows={assignments}
          totalRows={totalAssignments}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={isTableLoading}
          isFetching={isFetching || searchPending}
          exportFilename="current_campaign_assignments"
          exportSheetName="Assignments"
          onExportAll={handleExportAll}
          onRowClick={(row) => navigate(`/influencer/campaigns/${row.id}`)}
        />
      </Box>

      {/* Submit / Revise Rate Dialog */}
      {activeRateDialogMapper && (
        <SubmitRateDialog
          open={Boolean(activeRateDialogMapper)}
          mapperId={activeRateDialogMapper.id}
          campaignName={
            activeRateDialogMapper.campaignName ||
            activeRateDialogMapper.campaign?.name ||
            `Campaign #${activeRateDialogMapper.campaignId.slice(0, 8)}`
          }
          deliverables={activeRateDialogMapper.deliverables || undefined}
          currentRate={activeRateDialogMapper.influencerRate}
          loading={submitRateMutation.isPending}
          onSubmit={handleSubmitRate}
          onClose={() => setActiveRateDialogMapper(null)}
        />
      )}
    </DashboardLayout>
  );
};
