import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { StatusChip } from '@atoms';
import { apiClient, useInfluencerCampaigns } from '@api';
import {
  CampaignResponse,
  CampaignStatusEnum,
  CampaignStatusCode,
  PaginatedResult,
} from '@contracts';
import { useAuth, useDebouncedSearch, useViewFilters, usePillCode, useTableExport } from '@hooks';
import { safeExternalUrl, ExcelColumnConfig } from '@utils';

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
  const { debounced: debouncedSearch, pending: searchPending } = useDebouncedSearch(search, 300);
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
      subAccessor: (row) =>
        row.brandName ? `Brand: ${row.brandName}` : row.description || 'Campaign Brief',
    },
    {
      id: 'status',
      header: 'Campaign Status',
      type: 'custom',
      render: (row) => <StatusChip category="CAMPAIGN_STATUS" code={row.status} />,
    },
    {
      id: 'timeline',
      header: 'Timeline & Schedule (DD/MM/YYYY)',
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
      render: (row) => {
        // Gate on the sanitised value, not the raw one: a brief URL stored as
        // `javascript:` must render as plain text, not as an inert-looking
        // button that still carries the payload.
        const briefHref = safeExternalUrl(row.briefUrl);
        return briefHref ? (
          <Button
            component="a"
            size="small"
            variant="text"
            href={briefHref}
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
        );
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
          onClick={() => navigate(`/influencer/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          View Details
        </Button>
      ),
    },
  ];

  const handleExportAll = async (): Promise<CampaignResponse[]> => {
    const res = await apiClient.get<PaginatedResult<CampaignResponse>>('/influencer/campaigns', {
      params: {
        status: statusFilter,
        search: debouncedSearch.trim() || undefined,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, exportPdf, isExporting } = useTableExport({
    filename: 'my_campaign_assignments',
    sheetName: 'Assignments',
    columns: columns as Array<ExcelColumnConfig<CampaignResponse>>,
    rows: campaigns,
    onExportAll: handleExportAll,
  });

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        {/* Filter Bar */}
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
          onExport={exportExcel}
          onExportPdf={exportPdf}
          isExporting={isExporting}
          exportDisabled={totalCampaigns === 0}
        />

        {/* Campaigns Table */}
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
            isFetching={isFetching || searchPending}
            fillHeight
            onRowClick={(row) => navigate(`/influencer/campaigns/${row.id}`)}
          />
        </Box>
      </Box>
    </DashboardLayout>
  );
};
