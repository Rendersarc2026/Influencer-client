import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn } from '@molecules';
import { SectionHeading } from '@atoms';
import { useAdminAgencies, useAdminBrands, useAdminUsers, useAgencyCampaigns } from '@api';
import { UserResponse } from '@contracts';
import { useAuth } from '@hooks';

export const AdminHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: agencies = [], isLoading: agenciesLoading } = useAdminAgencies();
  const { data: brands = [], isLoading: brandsLoading } = useAdminBrands();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: campaigns = [], isLoading: campaignsLoading } = useAgencyCampaigns();

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;

  const columns: Array<DataTableColumn<UserResponse>> = [
    {
      id: 'email',
      header: 'User Account',
      type: 'entity',
      accessor: 'email',
      subAccessor: (row) => row.roleCode,
    },
    {
      id: 'role',
      header: 'Platform Role',
      type: 'text',
      accessor: 'roleCode',
    },
    {
      id: 'status',
      header: 'Account Status',
      type: 'status',
      accessor: (row) => (row.isActive ? 'ACTIVE' : 'ARCHIVED'),
    },
    {
      id: 'createdOn',
      header: 'Joined',
      type: 'text',
      accessor: (row) => new Date(row.createdOn).toLocaleDateString('en-IN'),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: () => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/admin/users')}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Platform Administration"
      subtitle="System oversight, multi-tenant agency & brand accounts, user role access"
      navItems={navConfig.ADMIN}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Platform Administrator',
        email: user?.email,
        roleCode: 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      {/* 1. Four Overview Metric Cards */}
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="lavender"
            title="Managed Agencies"
            value={agenciesLoading ? '—' : agencies.length}
            icon={<BusinessRoundedIcon fontSize="small" />}
            subtitle="Active agency tenants"
            onClick={() => navigate('/admin/agencies')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="mint"
            title="Client Brands"
            value={brandsLoading ? '—' : brands.length}
            icon={<StorefrontRoundedIcon fontSize="small" />}
            subtitle="Brand accounts"
            onClick={() => navigate('/admin/brands')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Platform Users"
            value={usersLoading ? '—' : users.length}
            icon={<PeopleRoundedIcon fontSize="small" />}
            subtitle="Across all four roles"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="sky"
            title="Active Campaigns"
            value={campaignsLoading ? '—' : activeCampaigns}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Live in market"
          />
        </Grid>
      </Grid>

      {/* 2. Recent Platform Users Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionHeading
          title="Recent User Accounts"
          subtitle="Provisioned users across agencies, brands, and creator studios"
          action={
            <Button
              variant="text"
              onClick={() => navigate('/admin/users')}
              endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
            >
              View All Users
            </Button>
          }
        />

        <DataTable<UserResponse>
          columns={columns}
          rows={users.slice(0, 5)}
          loading={usersLoading}
        />
      </Box>
    </DashboardLayout>
  );
};
