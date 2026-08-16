import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import {
  useAdminUsers,
  useAdminAgencies,
  useAdminBrands,
  useAdminDeactivateUser,
} from '@api';
import { UserResponse, UserStatusFilter } from '@contracts';
import { useAuth, useDebounce, useEnumPills, useToast, useViewFilters } from '@hooks';

export const AdminUsersOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    activePill: activeRolePill,
    setActivePill: setActiveRolePill,
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    selectedSelect,
    setSelectedSelect,
  } = useViewFilters('adminUsers');
  const debouncedSearch = useDebounce(search, 300);

  // Empty persisted state means nobody has touched the dropdown yet, which the
  // list has always treated as active-only.
  const statusFilter = (selectedSelect || 'ACTIVE') as UserStatusFilter;

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useAdminUsers({
    roleCode: activeRolePill !== 'ALL' ? activeRolePill : undefined,
    search: debouncedSearch.trim() || undefined,
    // Omitted on ACTIVE so the key still hashes to the boot-prefetched entry —
    // active-only is what the server already defaults to.
    status: statusFilter === 'ACTIVE' ? undefined : statusFilter,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: agenciesData } = useAdminAgencies();
  const { data: brandsData } = useAdminBrands();

  const users = usersData?.items || [];
  const totalUsers = usersData?.total ?? users.length;
  const agencies = agenciesData?.items || [];
  const brands = brandsData?.items || [];

  const deactivateUserMutation = useAdminDeactivateUser();

  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const filterPills = useEnumPills('ROLE', 'All Users', { INFLUENCER: 'Creator' });

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Deactivated' },
    { value: 'ALL', label: 'Active + Deactivated' },
  ];

  const handleConfirmDeactivate = async () => {
    if (!deactivateUserId) return;
    try {
      await deactivateUserMutation.mutateAsync(deactivateUserId);
      showSuccess('User account deactivated successfully.');
      setDeactivateUserId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to deactivate user.',
      );
    }
  };

  const columns: Array<DataTableColumn<UserResponse>> = [
    {
      id: 'user',
      header: 'User Account',
      type: 'entity',
      accessor: (row) => row.profile?.fullName || row.email,
      subAccessor: (row) => row.email,
    },
    {
      id: 'role',
      header: 'Role',
      type: 'text',
      accessor: (row) => row.roleCode,
    },
    {
      id: 'organization',
      header: 'Assigned Org',
      type: 'text',
      accessor: (row) => {
        if (row.roleCode === 'AGENCY' && row.agencyId) {
          const agency = agencies.find((a) => a.id === row.agencyId);
          return agency ? `Agency: ${agency.name}` : 'Agency Tenant';
        }
        if (row.roleCode === 'BRAND' && row.brandId) {
          const brand = brands.find((b) => b.id === row.brandId);
          return brand ? `Brand: ${brand.name}` : 'Brand Tenant';
        }
        if (row.roleCode === 'INFLUENCER') return 'Creator Studio';
        return 'System Operator';
      },
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: (row) => (row.isActive ? 'ACTIVE' : 'DEACTIVATED'),
    },
    {
      id: 'createdOn',
      header: 'Created Date',
      type: 'text',
      accessor: (row) => new Date(row.createdOn).toLocaleDateString('en-IN'),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {row.isActive &&
            // Deactivating your own account revokes your session on the next
            // request, so the operator is thrown back to the login screen
            // mid-action. The server rejects it too — this just keeps the
            // control from looking available.
            (row.id === user?.id ? (
              <Tooltip title="You cannot deactivate your own account">
                <span>
                  <IconButton size="small" disabled>
                    <BlockRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="Deactivate User">
                <IconButton
                  size="small"
                  onClick={() => setDeactivateUserId(row.id)}
                  sx={{ '&:hover': { color: theme.palette.tokens.negative } }}
                >
                  <BlockRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="User Accounts"
      subtitle="Role administration and organization user accounts"
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activeRolePill}
          onPillChange={setActiveRolePill}
          searchValue={search}
          onSearchChange={setSearch}
          selectOptions={statusOptions}
          selectedOption={statusFilter}
          onSelectChange={setSelectedSelect}
          selectLabel="Account Status"
        />

        <DataTable<UserResponse>
          columns={columns}
          rows={users}
          totalRows={totalUsers}
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
          fillHeight
        />
      </Box>

      {/* Confirm Deactivation */}
      <ConfirmDialog
        open={Boolean(deactivateUserId)}
        title="Deactivate User?"
        body="Are you sure you want to deactivate this user account? The user will immediately lose access to all platform interfaces."
        confirmText="Deactivate User"
        variant="destructive"
        loading={deactivateUserMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateUserId(null)}
      />

      {/* User Account Overview Drawer */}
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
                    {
                      label: 'Agency Tenant',
                      // Falls back to a generic label rather than the raw uuid
                      // when the tenant is not on the currently loaded page.
                      value: selectedUser.agencyId
                        ? agencies.find((a) => a.id === selectedUser.agencyId)?.name ||
                          'Agency Tenant'
                        : 'None (Global/Direct)',
                    },
                    {
                      label: 'Brand Account',
                      value: selectedUser.brandId
                        ? brands.find((b) => b.id === selectedUser.brandId)?.name || 'Brand Account'
                        : 'None (Global/Direct)',
                    },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedUser
            ? [
                {
                  label: 'Copy Email',
                  onClick: () => {
                    navigator.clipboard.writeText(selectedUser.email);
                    showSuccess('Email copied to clipboard');
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
