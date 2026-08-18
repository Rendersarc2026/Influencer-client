import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { useAgencyUsers, useSetUserBlocked } from '@api';
import { UserResponse, UserStatusFilter } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

export const AgencyUsersOrganism: React.FC = () => {
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
  } = useViewFilters('agencyUsers');
  const debouncedSearch = useDebounce(search, 300);

  // Empty persisted state means nobody has touched the dropdown yet, which the
  // list has always treated as active-only.
  const statusFilter = (selectedSelect || 'ACTIVE') as UserStatusFilter;

  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useAgencyUsers({
    roleCode: activeRolePill !== 'ALL' ? activeRolePill : undefined,
    excludeRoleCodes: activeRolePill === 'ALL' ? ['AGENCY'] : undefined,
    search: debouncedSearch.trim() || undefined,
    // Omitted on ACTIVE so the key still hashes to the boot-prefetched entry —
    // active-only is what the server already defaults to.
    status: statusFilter === 'ACTIVE' ? undefined : statusFilter,
    page: page + 1,
    limit: rowsPerPage,
  });

  const users = usersData?.items || [];
  const totalUsers = usersData?.total ?? users.length;

  const setBlockedMutation = useSetUserBlocked();

  /** The account a block/unblock is being confirmed for, and which way. */
  const [pendingBlock, setPendingBlock] = useState<{ user: UserResponse; blocked: boolean } | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const filterPills = [
    { id: 'ALL', label: 'All Users' },
    { id: 'BRAND', label: 'Brand' },
    { id: 'INFLUENCER', label: 'Influencer' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Deactivated' },
    { value: 'ALL', label: 'Active + Deactivated' },
  ];

  const handleConfirmBlock = async () => {
    if (!pendingBlock) return;
    const { user: target, blocked } = pendingBlock;
    try {
      await setBlockedMutation.mutateAsync({ id: target.id, blocked });
      showSuccess(blocked ? 'User account blocked.' : 'User account unblocked.');
      setPendingBlock(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          `Failed to ${blocked ? 'block' : 'unblock'} user.`,
      );
    }
  };

  const columns: Array<DataTableColumn<UserResponse>> = [
    {
      id: 'user',
      header: 'User Name',
      type: 'entity',
      accessor: (row) => row.profile?.fullName || row.profile?.displayName || row.email,
      subAccessor: (row) => row.email,
    },
    {
      id: 'role',
      header: 'Role',
      type: 'text',
      accessor: (row) => (row.roleCode === 'INFLUENCER' ? 'Influencer' : 'Brand'),
    },
    {
      id: 'organization',
      header: 'Assigned Org',
      type: 'text',
      accessor: (row) => {
        if (row.roleCode === 'BRAND') return row.brandName ? `Brand: ${row.brandName}` : 'Brand Client';
        if (row.roleCode === 'INFLUENCER') return 'Influencer Studio';
        return '—';
      },
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: (row) => (row.isActive ? 'ACTIVE' : 'BLOCKED'),
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
          {!row.isActive ? (
            <Tooltip title="Unblock User">
              <IconButton size="small" onClick={() => setPendingBlock({ user: row, blocked: false })}>
                <LockOpenRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : // Blocking your own account revokes your session on the next
          // request, so the operator is thrown back to the login screen
          // mid-action. The server rejects it too — this just keeps the
          // control from looking available.
          row.id === user?.id ? (
            <Tooltip title="You cannot block your own account">
              <span>
                <IconButton size="small" disabled>
                  <BlockRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Block User">
              <IconButton
                size="small"
                onClick={() => setPendingBlock({ user: row, blocked: true })}
                sx={{ '&:hover': { color: theme.palette.tokens.negative } }}
              >
                <BlockRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="All Users"
      subtitle="View platform accounts and manage user access"
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          pills={filterPills}
          activePillId={activeRolePill}
          onPillChange={(pill) => {
            setActiveRolePill(pill);
            setPage(0);
          }}
          searchValue={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(0);
          }}
          searchPlaceholder="Search"
          selectOptions={statusOptions}
          selectedOption={statusFilter}
          onSelectChange={(sel) => {
            setSelectedSelect(sel);
            setPage(0);
          }}
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

      {/* Confirm Block / Unblock */}
      <ConfirmDialog
        open={Boolean(pendingBlock)}
        title={pendingBlock?.blocked ? 'Block User?' : 'Unblock User?'}
        body={
          pendingBlock?.blocked
            ? 'This account will immediately lose access to every platform interface.'
            : 'This account will be able to sign in again immediately.'
        }
        confirmText={pendingBlock?.blocked ? 'Block User' : 'Unblock User'}
        variant={pendingBlock?.blocked ? 'destructive' : 'neutral'}
        loading={setBlockedMutation.isPending}
        onConfirm={handleConfirmBlock}
        onCancel={() => setPendingBlock(null)}
      />

      {/* User Account Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.profile?.fullName || selectedUser?.email || 'User Account'}
        subtitle={`Role: ${selectedUser?.roleCode || 'USER'}`}
        badge={selectedUser?.isActive ? 'ACTIVE' : 'BLOCKED'}
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
                  value: selectedUser.isActive ? 'Active' : 'Blocked',
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
                      value: selectedUser.agencyName || 'None (Global/Direct)',
                    },
                    {
                      label: 'Brand Account',
                      value: selectedUser.brandName || 'None (Global/Direct)',
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
