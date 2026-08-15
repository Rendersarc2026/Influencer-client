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
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog } from '@molecules';
import { SectionHeading } from '@atoms';
import { useAdminAgencies, useCreateAgency, useUpdateAgency, useDeactivateAgency } from '@api';
import { AgencyResponse } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

export const AdminAgenciesOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('adminAgencies');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: agenciesData,
    isLoading,
    isFetching,
  } = useAdminAgencies({
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const agencies = agenciesData?.items || [];
  const totalAgencies = agenciesData?.total ?? agencies.length;

  const createAgencyMutation = useCreateAgency();
  const updateAgencyMutation = useUpdateAgency();
  const deactivateAgencyMutation = useDeactivateAgency();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [agencyToEdit, setAgencyToEdit] = useState<AgencyResponse | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [deactivateAgencyId, setDeactivateAgencyId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setAgencyToEdit(null);
    setName('');
    setSlug('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (agency: AgencyResponse) => {
    setAgencyToEdit(agency);
    setName(agency.name);
    setSlug(agency.slug);
    setDialogOpen(true);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      if (agencyToEdit) {
        await updateAgencyMutation.mutateAsync({
          id: agencyToEdit.id,
          data: { name: name.trim(), slug: slug.trim() },
        });
        showSuccess('Agency updated successfully.');
      } else {
        await createAgencyMutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim(),
        });
        showSuccess('Agency created successfully.');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to save agency.');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateAgencyId) return;
    try {
      await deactivateAgencyMutation.mutateAsync(deactivateAgencyId);
      showSuccess('Agency deactivated successfully.');
      setDeactivateAgencyId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to deactivate agency.',
      );
    }
  };

  const columns: Array<DataTableColumn<AgencyResponse>> = [
    {
      id: 'name',
      header: 'Agency Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => `Slug: ${row.slug}`,
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
          <Tooltip title="Edit Agency">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.isActive && (
            <Tooltip title="Deactivate Agency">
              <IconButton
                size="small"
                onClick={() => setDeactivateAgencyId(row.id)}
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
      title="Agencies Management"
      subtitle="Configure partner agencies, manage tenant slugs, and tenant activation"
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
          Create Agency
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
        />

        <DataTable<AgencyResponse>
          columns={columns}
          rows={agencies}
          totalRows={totalAgencies}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={isLoading}
          isFetching={isFetching}
          fillHeight
        />
      </Box>

      {/* Create / Edit Agency Dialog */}
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
        <form onSubmit={handleSaveAgency}>
          <DialogTitle sx={{ pb: 1 }}>
            <SectionHeading
              title={agencyToEdit ? 'Edit Agency' : 'Create Agency'}
              subtitle="Agency tenant organisation parameters"
            />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Agency Name *"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!agencyToEdit) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }
                }}
                placeholder="e.g. Omnicom Media Group"
                fullWidth
              />

              <TextField
                label="Agency Slug *"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. omnicom-media"
                fullWidth
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ gap: 1 }}>
            <Button variant="outlined" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                !name.trim() ||
                !slug.trim() ||
                createAgencyMutation.isPending ||
                updateAgencyMutation.isPending
              }
              sx={{ minWidth: 120 }}
            >
              {createAgencyMutation.isPending || updateAgencyMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Save Agency'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Deactivation */}
      <ConfirmDialog
        open={Boolean(deactivateAgencyId)}
        title="Deactivate Agency?"
        body="Are you sure you want to deactivate this agency tenant? All associated brands and users will have their access suspended."
        confirmText="Deactivate Agency"
        variant="destructive"
        loading={deactivateAgencyMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateAgencyId(null)}
      />
    </DashboardLayout>
  );
};
