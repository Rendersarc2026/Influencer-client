import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn, FilterBar } from '@molecules';
import { StatusChip } from '@atoms';
import { useInfluencerCampaigns } from '@api';
import { CampaignResponse, CampaignStatusEnum, CampaignStatusCode } from '@contracts';
import { useAuth, useDebounce, useViewFilters, usePillCode } from '@hooks';

export const InfluencerCampaignsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const {
    activePill,
    setActivePill,
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('influencerCampaigns');
  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = usePillCode(activePill, CampaignStatusEnum);

  const {
    data: campaignsData,
    isLoading,
    isFetching,
  } = useInfluencerCampaigns({
    status: statusFilter,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const campaigns = campaignsData?.items || [];
  const totalCampaigns = campaignsData?.total ?? campaigns.length;

  const activeCount = campaigns.filter((c) => c?.status === CampaignStatusCode.ACTIVE).length;
  const completedCount = campaigns.filter((c) => c?.status === CampaignStatusCode.COMPLETED).length;

  // Pill ids are status codes, the same as the ones useEnumPills emits — the
  // filter is sent as a code, so a symbolic id here would simply never match.
  const filterPills = [
    { id: 'ALL', label: 'All Campaigns' },
    { id: String(CampaignStatusCode.ACTIVE), label: 'Current & Active' },
    { id: String(CampaignStatusCode.COMPLETED), label: 'Campaign History' },
    { id: String(CampaignStatusCode.DRAFT), label: 'Draft / Scheduled' },
  ];

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'campaign',
      header: 'Campaign & Brand',
      type: 'entity',
      accessor: (row) => row.name,
      subAccessor: (row) => (row.brandName ? `Brand: ${row.brandName}` : row.description || 'Campaign Brief'),
    },
    {
      id: 'status',
      header: 'Campaign Status',
      type: 'custom',
      render: (row) => <StatusChip category="CAMPAIGN_STATUS" code={row.status} />,
    },
    {
      id: 'timeline',
      header: 'Timeline & Schedule',
      type: 'text',
      accessor: (row) => {
        if (!row.startDate && !row.endDate) return 'Ongoing';
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : 'Start';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN') : 'Open';
        return `${start} — ${end}`;
      },
    },
    {
      id: 'brief',
      header: 'Brief',
      type: 'custom',
      render: (row) =>
        row.briefUrl ? (
          <Button
            size="small"
            variant="text"
            href={row.briefUrl}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<LaunchRoundedIcon fontSize="small" />}
            onClick={(e) => e.stopPropagation()}
            sx={{ textTransform: 'none' }}
          >
            View Brief Doc
          </Button>
        ) : (
          <Box component="span" sx={{ color: 'text.secondary', fontSize: '13px' }}>
            {row.description || 'Deliverables in Assignment'}
          </Box>
        ),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (_row) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/influencer')}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          My Assignment
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="My Campaigns"
      subtitle="Active campaign collaborations, delivery schedules, and completed campaign histories"
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minHeight: 0 }}>
        {/* 1. Summary Metrics */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <MetricCard
              tint="butter"
              title="ACTIVE CAMPAIGNS"
              value={activeCount}
              subtitle="Current live briefs & deliverables"
              icon={<CampaignRoundedIcon fontSize="small" />}
              loading={isLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <MetricCard
              tint="butter"
              title="CAMPAIGN HISTORY"
              value={completedCount}
              subtitle="Completed past collaborations"
              icon={<HistoryRoundedIcon fontSize="small" />}
              loading={isLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <MetricCard
              tint="butter"
              title="TOTAL COLLABORATIONS"
              value={totalCampaigns}
              subtitle="All assigned brand campaigns"
              icon={<CheckCircleRoundedIcon fontSize="small" />}
              loading={isLoading}
            />
          </Grid>
        </Grid>

        {/* 2. Filter Bar */}
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
        />

        {/* 3. Campaigns Table */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataTable<CampaignResponse>
            columns={columns}
            rows={campaigns}
            totalRows={totalCampaigns}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(limit) => {
              setRowsPerPage(limit);
              setPage(0);
            }}
            loading={isLoading}
            isFetching={isFetching}
            fillHeight
            onRowClick={() => navigate('/influencer')}
          />
        </Box>
      </Box>
    </DashboardLayout>
  );
};
