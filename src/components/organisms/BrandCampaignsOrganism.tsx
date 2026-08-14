import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { useBrandCampaigns } from '@api';
import { CampaignResponse } from '@contracts';
import { useAuth } from '@hooks';

export const BrandCampaignsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: campaigns = [], isLoading } = useBrandCampaigns();

  const [activePill, setActivePill] = useState('ALL');
  const [search, setSearch] = useState('');

  const filterPills = [
    { id: 'ALL', label: 'All Campaigns', count: campaigns.length },
    { id: 'ACTIVE', label: 'Active', count: campaigns.filter((c) => c.status === 'ACTIVE').length },
    {
      id: 'COMPLETED',
      label: 'Completed',
      count: campaigns.filter((c) => c.status === 'COMPLETED').length,
    },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesPill = activePill === 'ALL' || c.status === activePill;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesPill && matchesSearch;
  });

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
          View Creators
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Brand Campaigns"
      subtitle="Campaign rosters and creator deliverables managed by your agency partner"
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activePill}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search campaigns by name..."
        />

        <DataTable<CampaignResponse>
          columns={columns}
          rows={filteredCampaigns}
          loading={isLoading}
          onRowClick={(row) => navigate(`/brand/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
