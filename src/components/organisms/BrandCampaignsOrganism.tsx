import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { useBrandCampaigns } from '@api';
import { CampaignResponse, CampaignStatusEnum } from '@contracts';
import { useAuth, useDebounce, useEnumOptions, useViewFilters, usePillCode } from '@hooks';

export const BrandCampaignsOrganism: React.FC = () => {
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
  } = useViewFilters('brandCampaigns');
  const debouncedSearch = useDebounce(search, 300);
  const statusFilter = usePillCode(activePill, CampaignStatusEnum);

  const {
    data: campaignsData,
    isLoading,
    isFetching,
  } = useBrandCampaigns({
    status: statusFilter,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const campaigns = campaignsData?.items || [];
  const totalCampaigns = campaignsData?.total ?? campaigns.length;

  // A brand never sees a draft or cancelled campaign, so those two statuses are
  // dropped rather than offered as filters that can only ever return nothing.
  const campaignStatuses = useEnumOptions('CAMPAIGN_STATUS');
  const filterPills = [
    { id: 'ALL', label: 'All Campaigns' },
    ...campaignStatuses
      .filter((s) => s.value === 'ACTIVE' || s.value === 'COMPLETED')
      .map((s) => ({ id: String(s.code), label: s.label })),
  ];

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Campaign Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => row.description || 'Campaign deliverables',
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: 'status',
    },
    {
      id: 'timeline',
      header: 'Timeline',
      type: 'text',
      accessor: (row) => {
        if (!row.startDate && !row.endDate) return 'Active';
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : 'Start';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN') : 'Open';
        return `${start} — ${end}`;
      },
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
          onClick={() => navigate(`/brand/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          View Influencers
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Brand Campaigns"
      subtitle="Campaign rosters and influencer deliverables managed by your agency partner"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
        />

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
          exportFilename="brand_campaigns"
          exportSheetName="Campaigns"
          onRowClick={(row) => navigate(`/brand/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
