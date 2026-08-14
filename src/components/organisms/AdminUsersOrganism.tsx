import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useAdminUsers,
  useAdminAgencies,
  useAdminBrands,
  useAdminCreateUser,
  useAdminDeactivateUser,
  useAdminResendInvite,
} from '@api';
import { UserResponse, RoleCode, CreateUserRequest } from '@contracts';
import { useAuth } from '@hooks';

export const AdminUsersOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: agencies = [] } = useAdminAgencies();
  const { data: brands = [] } = useAdminBrands();

  const createUserMutation = useAdminCreateUser();
  const deactivateUserMutation = useAdminDeactivateUser();
  const resendInviteMutation = useAdminResendInvite();

  const [activeRolePill, setActiveRolePill] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState<RoleCode>('AGENCY');
  const [orgId, setOrgId] = useState('');
  const [phone, setPhone] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const filterPills = [
    { id: 'ALL', label: 'All Users', count: users.length },
    { id: 'ADMIN', label: 'Admin', count: users.filter((u) => u.roleCode === 'ADMIN').length },
    { id: 'AGENCY', label: 'Agency', count: users.filter((u) => u.roleCode === 'AGENCY').length },
    { id: 'BRAND', label: 'Brand', count: users.filter((u) => u.roleCode === 'BRAND').length },
    {
      id: 'INFLUENCER',
      label: 'Creator',
      count: users.filter((u) => u.roleCode === 'INFLUENCER').length,
    },
  ];

  const filteredUsers = users.filter((u) => {
    const matchesRole = activeRolePill === 'ALL' || u.roleCode === activeRolePill;
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.profile?.fullName && u.profile.fullName.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEmail('');
    setRoleCode('AGENCY');
    setOrgId(agencies.length > 0 ? agencies[0].id : '');
    setPhone('');
    setDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !roleCode) return;

    const payload: CreateUserRequest = {
      email: email.trim(),
      roleCode,
      phone: phone.trim() || undefined,
      agencyId: roleCode === 'AGENCY' ? orgId || undefined : undefined,
      brandId: roleCode === 'BRAND' ? orgId || undefined : undefined,
    };

    await createUserMutation.mutateAsync(payload);
    setDialogOpen(false);
  };

  const handleResendInvite = async (userEmail: string) => {
    await resendInviteMutation.mutateAsync(userEmail);
    setInviteSuccessMsg(`Login invite code resent to ${userEmail}`);
    setTimeout(() => setInviteSuccessMsg(''), 4000);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateUserId) return;
    await deactivateUserMutation.mutateAsync(deactivateUserId);
    setDeactivateUserId(null);
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
      accessor: (row) => (row.isActive ? 'ACTIVE' : 'ARCHIVED'),
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
          <Tooltip title="Resend Login Invite OTP">
            <IconButton size="small" onClick={() => handleResendInvite(row.email)}>
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.isActive && (
            <Tooltip title="Deactivate User">
              <IconButton
                size="small"
                onClick={() => setDeactivateUserId(row.id)}
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
      title="User Accounts"
      subtitle="Role administration, organization mappings, and invite provisioning"
      navItems={navConfig.ADMIN}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Platform Administrator',
        email: user?.email,
        roleCode: 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={handleOpenCreate}
        >
          Provision User
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {inviteSuccessMsg && (
          <Box
            sx={{
              padding: '12px 18px',
              backgroundColor: theme.palette.tints.mint,
              borderRadius: `${theme.customRadii.inner}px`,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: theme.palette.tokens.positiveText, fontWeight: 600 }}
            >
              {inviteSuccessMsg}
            </Typography>
          </Box>
        )}

        <FilterBar
          pills={filterPills}
          activePillId={activeRolePill}
          onPillChange={setActiveRolePill}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search users by name or email..."
        />

        <DataTable<UserResponse> columns={columns} rows={filteredUsers} loading={usersLoading} />
      </Box>

      {/* Provision User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              padding: '12px',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <form onSubmit={handleCreateUser}>
          <DialogTitle sx={{ pb: 1 }}>
            <SectionHeading
              title="Provision User Account"
              subtitle="Invite user by email, assign system role and tenant organization"
            />
          </DialogTitle>

          <DialogContent sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@organization.com"
                fullWidth
                autoFocus
              />

              <TextField
                select
                label="Assigned Role *"
                value={roleCode}
                onChange={(e) => {
                  const r = e.target.value as RoleCode;
                  setRoleCode(r);
                  if (r === 'AGENCY') setOrgId(agencies[0]?.id || '');
                  if (r === 'BRAND') setOrgId(brands[0]?.id || '');
                }}
                fullWidth
              >
                <MenuItem value="ADMIN">ADMIN (System Administrator)</MenuItem>
                <MenuItem value="AGENCY">AGENCY (Agency Manager)</MenuItem>
                <MenuItem value="BRAND">BRAND (Brand Manager)</MenuItem>
                <MenuItem value="INFLUENCER">INFLUENCER (Creator)</MenuItem>
              </TextField>

              {roleCode === 'AGENCY' && (
                <TextField
                  select
                  label="Assign to Agency *"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  fullWidth
                >
                  {agencies.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {roleCode === 'BRAND' && (
                <TextField
                  select
                  label="Assign to Brand *"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  fullWidth
                >
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                fullWidth
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ pt: 3, pb: 1, px: 2, gap: 1 }}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!email.trim() || createUserMutation.isPending}
              sx={{ minWidth: 140 }}
            >
              {createUserMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Send Invite'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
    </DashboardLayout>
  );
};
