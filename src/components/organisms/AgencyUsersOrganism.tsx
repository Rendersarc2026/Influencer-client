import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { apiClient, useAgencyUsers, useSetUserBlocked } from '@api';
import { UserResponse, UserStatusFilter, PaginatedResult } from '@contracts';
import { useAuth, useDebouncedSearch, useToast, useViewFilters, useTableExport } from '@hooks';
import { ExcelColumnConfig } from '@utils';

interface UserRowActionsProps {
  row: UserResponse;
  currentUserId?: string;
  onToggleBlock: (row: UserResponse, blocked: boolean) => void;
  onMessage: (row: UserResponse) => void;
}

const UserRowActions: React.FC<UserRowActionsProps> = ({
  row,
  currentUserId,
  onToggleBlock,
  onMessage,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isSelf = row.id === currentUserId;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            border: `1px solid ${open ? theme.palette.primary.main : theme.palette.tokens.divider}`,
            backgroundColor: open ? theme.palette.tokens.fieldBg : theme.palette.tokens.surface,
            borderRadius: `${theme.customRadii.inner}px`,
            p: 0.75,
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: theme.palette.tokens.fieldBg,
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <MoreVertRoundedIcon fontSize="small" sx={{ color: theme.palette.tokens.textPrimary }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              border: `1px solid ${theme.palette.tokens.divider}`,
              minWidth: 210,
              padding: '6px',
              mt: 0.75,
              boxShadow:
                '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onMessage(row);
          }}
          disabled={isSelf}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textSecondary, minWidth: 'auto' }}>
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Message User"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {!row.isActive ? (
          <MenuItem
            onClick={() => {
              handleClose();
              onToggleBlock(row, false);
            }}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.tokens.positive,
              '&:hover': { backgroundColor: 'rgba(34, 197, 94, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.tokens.positive, minWidth: 'auto' }}>
              <LockOpenRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Reactivate Account"
              primaryTypographyProps={{
                fontSize: '13px',
                fontWeight: 500,
                color: theme.palette.tokens.positive,
              }}
            />
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleClose();
              onToggleBlock(row, true);
            }}
            disabled={isSelf}
            sx={{
              fontSize: '13px',
              fontWeight: 500,
              py: 0.85,
              px: 1.25,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              color: theme.palette.tokens.negative,
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: 'auto' }}>
              <BlockRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={isSelf ? 'Cannot deactivate own account' : 'Deactivate Account'}
              primaryTypographyProps={{
                fontSize: '13px',
                fontWeight: 500,
                color: isSelf ? theme.palette.tokens.textSecondary : theme.palette.tokens.negative,
              }}
            />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export const AgencyUsersOrganism: React.FC = () => {
  const navigate = useNavigate();
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
  const { debounced: debouncedSearch, pending: searchPending } = useDebouncedSearch(search, 300);

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
      showSuccess(blocked ? 'User account deactivated.' : 'User account reactivated.');
      setPendingBlock(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          `Failed to ${blocked ? 'deactivate' : 'reactivate'} user.`,
      );
    }
  };

  const columns: Array<DataTableColumn<UserResponse>> = [
    {
      id: 'user',
      header: 'User Name',
      type: 'entity',
      accessor: (row) => row.profile?.fullName || row.profile?.displayName || row.email,
      iconAccessor: (row) => row.profile?.avatarUrl ?? row.influencer?.avatarUrl ?? null,
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
        if (row.roleCode === 'BRAND')
          return row.brandName ? `Brand: ${row.brandName}` : 'Brand Client';
        if (row.roleCode === 'INFLUENCER') return 'Influencer Studio';
        return '—';
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
      header: 'Created Date (DD/MM/YYYY)',
      type: 'date',
      accessor: (row) => new Date(row.createdOn).toLocaleDateString('en-IN'),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <UserRowActions
          row={row}
          currentUserId={user?.id}
          onToggleBlock={(r, blocked) => setPendingBlock({ user: r, blocked })}
          onMessage={(r) => {
            const type = r.roleCode === 'BRAND' ? 'BRAND' : 'INFLUENCER';
            navigate(`/agency/chats?participantId=${r.id}&type=${type}`);
          }}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<UserResponse[]> => {
    const res = await apiClient.get<PaginatedResult<UserResponse>>('/agency/users', {
      params: {
        roleCode: activeRolePill !== 'ALL' ? activeRolePill : undefined,
        excludeRoleCodes: activeRolePill === 'ALL' ? ['AGENCY'] : undefined,
        search: debouncedSearch.trim() || undefined,
        status: statusFilter === 'ACTIVE' ? undefined : statusFilter,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, exportPdf, isExporting } = useTableExport({
    filename: 'platform_users',
    sheetName: 'Users',
    columns: columns as Array<ExcelColumnConfig<UserResponse>>,
    rows: users,
    onExportAll: handleExportAll,
  });

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
          onExport={exportExcel}
          onExportPdf={exportPdf}
          isExporting={isExporting}
          exportDisabled={totalUsers === 0}
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
          isFetching={usersFetching || searchPending}
          onRowClick={(row) => setSelectedUser(row)}
          fillHeight
        />
      </Box>

      {/* Confirm Deactivate / Reactivate */}
      <ConfirmDialog
        open={Boolean(pendingBlock)}
        title={pendingBlock?.blocked ? 'Deactivate User?' : 'Reactivate User?'}
        body={
          pendingBlock?.blocked
            ? 'This account will immediately lose access to every platform interface.'
            : 'This account will be able to sign in again immediately.'
        }
        confirmText={pendingBlock?.blocked ? 'Deactivate User' : 'Reactivate User'}
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
        badge={selectedUser?.isActive ? 'ACTIVE' : 'DEACTIVATED'}
        avatarText={selectedUser?.profile?.fullName || selectedUser?.email}
        avatarUrl={
          selectedUser?.profile?.avatarUrl || selectedUser?.influencer?.avatarUrl || undefined
        }
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
                  value: selectedUser.isActive ? 'Active' : 'Deactivated',
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
