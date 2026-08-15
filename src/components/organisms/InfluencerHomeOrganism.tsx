import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn, FilterBar, SubmitRateDialog } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { useInfluencerAssignments, useSubmitInfluencerRate } from '@api';
import { InfluencerMapperResponse, SubmitRateRequest } from '@contracts';
import { useAuth, useDebounce, useEnumPills, useToast, useViewFilters } from '@hooks';

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
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: assignmentsData,
    isLoading,
    isFetching,
  } = useInfluencerAssignments({
    rateStatus: activePill !== 'ALL' ? activePill : undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const assignments = assignmentsData?.items || [];
  const totalAssignments = assignmentsData?.total ?? assignments.length;

  const submitRateMutation = useSubmitInfluencerRate();

  const [activeRateDialogMapper, setActiveRateDialogMapper] =
    useState<InfluencerMapperResponse | null>(null);

  const pendingRatesCount = assignments.filter(
    (a) => a?.rateStatus === 'PENDING_SUBMISSION' || a?.rateStatus === 'REVISION_REQUESTED',
  ).length;
  const approvedCount = assignments.filter((a) => a?.rateStatus === 'AGENCY_APPROVED').length;

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
      accessor: (row) => `Campaign #${row.campaignId.slice(0, 8)}`,
      subAccessor: (row) => row.deliverables || 'Deliverables in brief',
    },
    {
      id: 'rateStatus',
      header: 'Rate Status',
      type: 'custom',
      render: (row) => <StatusChip status={row.rateStatus} />,
    },
    {
      id: 'influencerRate',
      header: 'My Commercial Quote',
      type: 'custom',
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

  return (
    <DashboardLayout
      title="Creator Studio"
      subtitle="Campaign assignments, commercial rate cards, and delivery milestones"
      navItems={navConfig.INFLUENCER}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Creator',
        email: user?.email,
        roleCode: 'INFLUENCER',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      {/* 1. Four Metric Cards */}
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="lavender"
            title="Active Campaigns"
            value={assignments.length}
            loading={isLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Invited & assigned briefs"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Awaiting My Rate"
            value={pendingRatesCount}
            loading={isLoading}
            icon={<EditNoteRoundedIcon fontSize="small" />}
            deltaLabel="quotes needed"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="mint"
            title="Approved Deals"
            value={approvedCount}
            loading={isLoading}
            icon={<CheckCircleRoundedIcon fontSize="small" />}
            subtitle="Agency approved rates"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="sky"
            title="Total Earned (MTD)"
            value="₹2.45L"
            icon={<MonetizationOnRoundedIcon fontSize="small" />}
            delta={24.0}
            deltaLabel="from completed deliverables"
          />
        </Grid>
      </Grid>

      {/* 2. Assignments Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionHeading
          title="Current Campaign Assignments"
          subtitle="Submit your commercial rate and track agency approval status"
        />

        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
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
          loading={isLoading}
          isFetching={isFetching}
          onRowClick={(row) => navigate(`/influencer/campaigns/${row.id}`)}
        />
      </Box>

      {/* Submit / Revise Rate Dialog */}
      {activeRateDialogMapper && (
        <SubmitRateDialog
          open={Boolean(activeRateDialogMapper)}
          mapperId={activeRateDialogMapper.id}
          campaignName={`Campaign #${activeRateDialogMapper.campaignId.slice(0, 8)}`}
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
