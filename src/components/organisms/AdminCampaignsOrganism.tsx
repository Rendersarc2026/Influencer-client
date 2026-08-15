import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { SectionHeading } from '@atoms';
import { useAdminCampaigns, useAdminBrands } from '@api';
import { CampaignResponse } from '@contracts';
import { useAuth, useDebounce } from '@hooks';

export const AdminCampaignsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [activePill, setActivePill] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: campaignsData, isLoading: campaignsLoading } = useAdminCampaigns({
    status: activePill !== 'ALL' ? activePill : undefined,
    brandId: selectedBrand || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: brandsData } = useAdminBrands();

  const campaigns = campaignsData?.items || [];
  const totalCampaigns = campaignsData?.total ?? campaigns.length;
  const brands = brandsData?.items || [];

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

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Campaign Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => {
        const brand = brands.find((b) => b.id === row.brandId);
        return brand ? brand.name : 'Platform Brand';
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
          onClick={() => navigate(`/admin/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Platform Campaigns"
      subtitle="Overview of all campaigns, creator rosters, and deliverables across platform brands"
      navItems={navConfig.ADMIN}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Super Administrator',
        email: user?.email,
        roleCode: 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <SectionHeading
          title="All Campaigns"
          subtitle="System-wide campaigns registry"
        />

        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={handlePillChange}
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search campaigns by name..."
          selectOptions={brandOptions}
          selectedOption={selectedBrand}
          onSelectChange={handleBrandChange}
          selectLabel="Filter by Brand"
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
          fillHeight
        />
      </Box>
    </DashboardLayout>
  );
};
