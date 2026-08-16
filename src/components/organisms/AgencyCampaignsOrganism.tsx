import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, CreateCampaignDialog } from '@molecules';
import { useAgencyCampaigns, useAgencyBrands, useCreateCampaign } from '@api';
import { CampaignResponse, CreateCampaignRequest } from '@contracts';
import { useAuth, useDebounce, useEnumPills, useToast, useViewFilters } from '@hooks';

export const AgencyCampaignsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    activePill,
    setActivePill,
    search,
    setSearch,
    selectedSelect: selectedBrand,
    setSelectedSelect: setSelectedBrand,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyCampaigns');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
  } = useAgencyCampaigns({
    status: activePill !== 'ALL' ? activePill : undefined,
    brandId: selectedBrand || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  // This agency's own brands, which is every brand it can reach. The
  // create-campaign picker is fed from the same list, and many campaigns may
  // run under one brand.
  const { data: brandsData } = useAgencyBrands();

  const campaigns = campaignsData?.items || [];
  const totalCampaigns = campaignsData?.total ?? campaigns.length;
  const brands = brandsData?.items || [];

  const createCampaignMutation = useCreateCampaign();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Driven by the enum_code registry, so a status added by a migration shows up
  // here without an edit — and one that does not exist cannot be filtered for.
  const filterPills = useEnumPills('CAMPAIGN_STATUS', 'All Campaigns');

  const brandOptions = [
    { value: '', label: 'All Brands' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ];

  const handleCreateCampaign = async (data: CreateCampaignRequest) => {
    try {
      await createCampaignMutation.mutateAsync(data);
      showSuccess('Campaign created successfully.');
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to create campaign.',
      );
    }
  };

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Campaign Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => {
        const brand = brands.find((b) => b.id === row.brandId);
        return brand ? brand.name : 'Client Brand';
      },
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
        if (!row.startDate && !row.endDate) return 'Flexible';
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
          onClick={() => navigate(`/agency/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Campaigns"
      subtitle="Client brand campaigns, creator assignments, and rate approval pipeline"
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
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Campaign
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
          selectOptions={brandOptions}
          selectedOption={selectedBrand}
          onSelectChange={setSelectedBrand}
          selectLabel="Brand"
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
          loading={campaignsLoading}
          isFetching={campaignsFetching}
          fillHeight
          onRowClick={(row) => navigate(`/agency/campaigns/${row.id}`)}
        />
      </Box>

      <CreateCampaignDialog
        open={createDialogOpen}
        brands={brands}
        loading={createCampaignMutation.isPending}
        onSubmit={handleCreateCampaign}
        onClose={() => setCreateDialogOpen(false)}
      />
    </DashboardLayout>
  );
};
