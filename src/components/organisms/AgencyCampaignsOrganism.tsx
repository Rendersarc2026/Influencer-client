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
import { useAuth, useDebounce } from '@hooks';

export const AgencyCampaignsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [activePill, setActivePill] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: campaignsData, isLoading: campaignsLoading } = useAgencyCampaigns({
    status: activePill !== 'ALL' ? activePill : undefined,
    brandId: selectedBrand || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: brandsData } = useAgencyBrands();

  const campaigns = campaignsData?.items || [];
  const totalCampaigns = campaignsData?.total ?? campaigns.length;
  const brands = brandsData?.items || [];

  const createCampaignMutation = useCreateCampaign();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filterPills = [
    { id: 'ALL', label: 'All Campaigns' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  const brandOptions = [
    { value: '', label: 'All Brands' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ];

  const handlePillChange = (pillId: string) => {
    setActivePill(pillId);
    setPage(0);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const handleBrandChange = (val: string) => {
    setSelectedBrand(val);
    setPage(0);
  };

  const handleCreateCampaign = async (data: CreateCampaignRequest) => {
    await createCampaignMutation.mutateAsync(data);
    setCreateDialogOpen(false);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={handlePillChange}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search campaigns..."
          selectOptions={brandOptions}
          selectedOption={selectedBrand}
          onSelectChange={handleBrandChange}
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
