import React, { useState } from 'react';
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
import { MetricCard, DataTable, DataTableColumn, OverviewDrawer } from '@molecules';
import { SectionHeading } from '@atoms';
import { useAdminPlatformStats, useAdminUsers } from '@api';
import { UserResponse } from '@contracts';
import { useAuth } from '@hooks';

export const AdminHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const { data: statsData, isLoading: statsLoading } = useAdminPlatformStats();
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useAdminUsers({
    page: page + 1,
    limit: rowsPerPage,
  });

  const agenciesTotal = statsData?.activeAgencies ?? 0;
  const brandsTotal = statsData?.activeBrands ?? 0;
  const usersTotal = statsData?.activeUsers ?? 0;
  const campaignsTotal = statsData?.activeCampaigns ?? 0;
  const users = usersData?.items || [];

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
            value={agenciesTotal}
            loading={statsLoading}
            icon={<BusinessRoundedIcon fontSize="small" />}
            subtitle="Active agency tenants"
            onClick={() => navigate('/admin/agencies')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="mint"
            title="Client Brands"
            value={brandsTotal}
            loading={statsLoading}
            icon={<StorefrontRoundedIcon fontSize="small" />}
            subtitle="Brand accounts"
            onClick={() => navigate('/admin/brands')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Platform Users"
            value={usersTotal}
            loading={statsLoading}
            icon={<PeopleRoundedIcon fontSize="small" />}
            subtitle="Across all four roles"
            onClick={() => navigate('/admin/users')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="sky"
            title="Active Campaigns"
            value={campaignsTotal}
            loading={statsLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Live in market"
            onClick={() => navigate('/admin/campaigns')}
          />
        </Grid>
      </Grid>

      {/* 2. Recent Platform Users Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionHeading
          title="Recent User Accounts"
          subtitle="Registered users across agencies, brands, and creator studios"
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
          rows={users}
          totalRows={usersTotal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={usersLoading}
          isFetching={usersFetching}
          onRowClick={(row) => setSelectedUser(row)}
        />
      </Box>

      {/* Overview Details Viewer Drawer */}
      <OverviewDrawer
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.profile?.fullName || selectedUser?.email || 'User Account'}
        subtitle={`Role: ${selectedUser?.roleCode || 'USER'}`}
        badge={selectedUser?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        avatarText={selectedUser?.profile?.fullName || selectedUser?.email}
        avatarUrl={selectedUser?.profile?.avatarUrl || undefined}
        highlights={
          selectedUser
            ? [
                {
                  label: 'Platform Role',
                  value: selectedUser.roleCode,
                  tint: 'sky',
                },
                {
                  label: 'Account Status',
                  value: selectedUser.isActive ? 'Active' : 'Archived',
                  tint: selectedUser.isActive ? 'mint' : 'lavender',
                },
              ]
            : []
        }
        sections={
          selectedUser
            ? [
                {
                  title: 'Account Information',
                  fields: [
                    { label: 'Login Email', value: selectedUser.email, copyable: true },
                    { label: 'Platform Role', value: selectedUser.roleCode },
                    { label: 'Phone Number', value: selectedUser.phone || '—' },
                    {
                      label: 'Joined Platform',
                      value: new Date(selectedUser.createdOn).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    },
                  ],
                },
                {
                  title: 'Profile Details',
                  fields: [
                    { label: 'Legal Full Name', value: selectedUser.profile?.fullName || '—' },
                    { label: 'Display Name', value: selectedUser.profile?.displayName || '—' },
                    {
                      label: 'Profile Status',
                      value: selectedUser.profile?.completedOn ? 'Complete' : 'Pending',
                    },
                    {
                      label: 'Biography',
                      value: selectedUser.profile?.bio || 'No bio provided',
                      fullWidth: true,
                    },
                  ],
                },
                {
                  title: 'Tenancy & Association',
                  fields: [
                    // Presence only — this screen does not load the agency and
                    // brand lists, and the raw tenant uuid is not something an
                    // operator can act on. The Users page resolves the names.
                    { label: 'Agency Tenant', value: selectedUser.agencyId ? 'Assigned' : 'None (Global/Direct)' },
                    { label: 'Brand Account', value: selectedUser.brandId ? 'Assigned' : 'None (Global/Direct)' },
                  ],
                },
              ]
            : []
        }
        actions={[
          {
            label: 'Manage in Users',
            onClick: () => {
              setSelectedUser(null);
              navigate('/admin/users');
            },
          },
        ]}
      />
    </DashboardLayout>
  );
};
