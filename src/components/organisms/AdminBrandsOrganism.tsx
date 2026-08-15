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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useAdminBrands,
  useAdminAgencies,
  useAdminCreateBrand,
  useAdminUpdateBrand,
  useAdminDeactivateBrand,
} from '@api';
import { BrandResponse } from '@contracts';
import { useAuth, useDebounce } from '@hooks';

export const AdminBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: brandsData, isLoading: brandsLoading } = useAdminBrands({
    agencyId: selectedAgencyFilter || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: agenciesData } = useAdminAgencies();

  const brands = brandsData?.items || [];
  const totalBrands = brandsData?.total ?? brands.length;
  const agencies = agenciesData?.items || [];

  const createBrandMutation = useAdminCreateBrand();
  const updateBrandMutation = useAdminUpdateBrand();
  const deactivateBrandMutation = useAdminDeactivateBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [deactivateBrandId, setDeactivateBrandId] = useState<string | null>(null);

  const agencyFilterOptions = [
    { value: '', label: 'All Agencies' },
    ...agencies.map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  const handleAgencyFilterChange = (val: string) => {
    setSelectedAgencyFilter(val);
    setPage(0);
  };

  const handleOpenCreate = () => {
    setBrandToEdit(null);
    setName('');
    setIndustry('');
    setAgencyId(agencies.length > 0 ? agencies[0].id : '');
    setDialogOpen(true);
  };

  const handleOpenEdit = (brand: BrandResponse) => {
    setBrandToEdit(brand);
    setName(brand.name);
    setIndustry(brand.industry || '');
    setAgencyId(brand.agencyId);
    setDialogOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (brandToEdit) {
      await updateBrandMutation.mutateAsync({
        id: brandToEdit.id,
        data: {
          name: name.trim(),
          industry: industry.trim() || undefined,
          agencyId: agencyId || undefined,
        },
      });
    } else {
      await createBrandMutation.mutateAsync({
        name: name.trim(),
        industry: industry.trim() || undefined,
        agencyId: agencyId || undefined,
      });
    }
    setDialogOpen(false);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateBrandId) return;
    await deactivateBrandMutation.mutateAsync(deactivateBrandId);
    setDeactivateBrandId(null);
  };

  const columns: Array<DataTableColumn<BrandResponse>> = [
    {
      id: 'name',
      header: 'Brand Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => row.industry || 'General Consumer Brand',
    },
    {
      id: 'agency',
      header: 'Assigned Agency',
      type: 'text',
      accessor: (row) => {
        const agency = agencies.find((a) => a.id === row.agencyId);
        return agency ? agency.name : 'Direct Account';
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
          <Tooltip title="Edit Brand & Agency Assignment">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.isActive && (
            <Tooltip title="Deactivate Brand">
              <IconButton
                size="small"
                onClick={() => setDeactivateBrandId(row.id)}
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
      title="Brands Management"
      subtitle="Client brand portfolios and agency tenant assignments"
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
          Create Brand
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search brands by name or category..."
          selectOptions={agencyFilterOptions}
          selectedOption={selectedAgencyFilter}
          onSelectChange={handleAgencyFilterChange}
          selectLabel="Agency"
        />

        <DataTable<BrandResponse>
          columns={columns}
          rows={brands}
          totalRows={totalBrands}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={brandsLoading}
        />
      </Box>

      {/* Create / Edit Brand Dialog */}
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
        <form onSubmit={handleSaveBrand}>
          <DialogTitle sx={{ pb: 1 }}>
            <SectionHeading
              title={brandToEdit ? 'Edit Brand' : 'Create Brand'}
              subtitle="Brand profile and agency assignment"
            />
          </DialogTitle>

          <DialogContent sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Assign to Agency *"
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                fullWidth
              >
                {agencies.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Brand Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SkinGlo D2C"
                fullWidth
                autoFocus
              />

              <TextField
                label="Industry Category"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Beauty & Wellness"
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
              disabled={
                !name.trim() || createBrandMutation.isPending || updateBrandMutation.isPending
              }
              sx={{ minWidth: 120 }}
            >
              {createBrandMutation.isPending || updateBrandMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Save Brand'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Deactivation */}
      <ConfirmDialog
        open={Boolean(deactivateBrandId)}
        title="Deactivate Brand?"
        body="Are you sure you want to deactivate this brand? Active campaigns and deliverable workflows under this brand will be suspended."
        confirmText="Deactivate Brand"
        variant="destructive"
        loading={deactivateBrandMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateBrandId(null)}
      />
    </DashboardLayout>
  );
};
