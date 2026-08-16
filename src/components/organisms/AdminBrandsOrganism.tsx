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
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useAdminBrands,
  useAdminAgencies,
  useAdminCreateBrand,
  useAdminUpdateBrand,
  useAdminDeactivateBrand,
} from '@api';
import { BrandResponse } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

export const AdminBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    search,
    setSearch,
    selectedSelect: selectedAgencyFilter,
    setSelectedSelect: setSelectedAgencyFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('adminBrands');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: brandsData,
    isLoading: brandsLoading,
    isFetching: brandsFetching,
  } = useAdminBrands({
    agencyId: selectedAgencyFilter || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: agenciesData } = useAdminAgencies();

  const agencies = agenciesData?.items || [];
  const brands = brandsData?.items || [];
  const totalBrands = brandsData?.total ?? brands.length;

  const createBrandMutation = useAdminCreateBrand();
  const updateBrandMutation = useAdminUpdateBrand();
  const deactivateBrandMutation = useAdminDeactivateBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [deactivateBrandId, setDeactivateBrandId] = useState<string | null>(null);

  const validateEmail = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Must be a valid email address (e.g. manager@brand.com)';
    }
    return '';
  };

  const validatePhone = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    const stripped = trimmed.replace(/[\s()-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(stripped)) {
      return 'Must be a valid phone number (7-15 digits, optional + prefix)';
    }
    return '';
  };

  const agencyFilterOptions = [
    { value: '', label: 'All Agencies' },
    ...agencies.map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleOpenCreate = () => {
    setBrandToEdit(null);
    setName('');
    setIndustry('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (brand: BrandResponse) => {
    setBrandToEdit(brand);
    setName(brand.name);
    setIndustry(brand.industry || '');
    setContactPerson(brand.contactPerson || '');
    setContactEmail(brand.contactEmail || '');
    setContactPhone(brand.contactPhone || '');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setDialogOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setPhoneError('');

    const trimmedName = name.trim();
    const trimmedIndustry = industry.trim();
    const trimmedContactPerson = contactPerson.trim();
    const trimmedContactEmail = contactEmail.trim().toLowerCase();
    const trimmedContactPhone = contactPhone.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError('Brand name is required');
      hasError = true;
    }

    if (!trimmedContactEmail) {
      setEmailError('Email is required');
      hasError = true;
    } else {
      const eErr = validateEmail(trimmedContactEmail);
      if (eErr) {
        setEmailError(eErr);
        hasError = true;
      }
    }

    if (!trimmedContactPhone) {
      setPhoneError('Phone number is required');
      hasError = true;
    } else {
      const pErr = validatePhone(trimmedContactPhone);
      if (pErr) {
        setPhoneError(pErr);
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      if (brandToEdit) {
        await updateBrandMutation.mutateAsync({
          id: brandToEdit.id,
          data: {
            name: trimmedName,
            industry: trimmedIndustry || undefined,
            contactPerson: trimmedContactPerson || undefined,
            contactEmail: trimmedContactEmail || undefined,
            contactPhone: trimmedContactPhone || undefined,
          },
        });
        showSuccess('Brand updated successfully.');
      } else {
        await createBrandMutation.mutateAsync({
          name: trimmedName,
          industry: trimmedIndustry || undefined,
          contactPerson: trimmedContactPerson || undefined,
          contactEmail: trimmedContactEmail,
          contactPhone: trimmedContactPhone,
        });
        showSuccess('Brand created successfully.');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj?.response?.data?.message || errorObj?.message || 'Failed to save brand.';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      }
      showError(msg);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateBrandId) return;
    try {
      await deactivateBrandMutation.mutateAsync(deactivateBrandId);
      showSuccess('Brand deactivated successfully.');
      setDeactivateBrandId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to deactivate brand.',
      );
    }
  };

  const columns: Array<DataTableColumn<BrandResponse>> = [
    {
      id: 'name',
      header: 'Brand Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) =>
        `${row.industry || 'General Brand'}${row.contactEmail ? ` • Email: ${row.contactEmail}` : ''}${row.contactPhone ? ` • Phone: ${row.contactPhone}` : ''}`,
    },
    {
      id: 'agency',
      header: 'Assigned Agency',
      type: 'text',
      accessor: (row) => {
        // A brand may be managed by several agencies at once.
        const names = row.agencyIds
          .map((id) => agencies.find((a) => a.id === id)?.name)
          .filter(Boolean);
        return names.length ? names.join(', ') : 'Direct Account';
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
          <Tooltip title="Edit Brand">
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
      subtitle="Client brand portfolios — agencies pick these up the first time they run a campaign"
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          selectOptions={agencyFilterOptions}
          selectedOption={selectedAgencyFilter}
          onSelectChange={setSelectedAgencyFilter}
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
          isFetching={brandsFetching}
          onRowClick={(row) => setSelectedBrand(row)}
          fillHeight
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
              subtitle="Brand profile — an agency picks it up the first time it runs a campaign under it"
            />
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                label="Brand Name *"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                error={Boolean(nameError)}
                helperText={nameError}
                placeholder="e.g. SkinGlo D2C"
                fullWidth
              />

              <TextField
                label="Industry Category"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Beauty & Wellness"
                fullWidth
              />

              <TextField
                label="Contact Person Name"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Jane Smith - Brand Lead"
                fullWidth
              />

              <TextField
                label="Login / Contact Email *"
                value={contactEmail}
                onChange={(e) => {
                  const val = e.target.value;
                  setContactEmail(val);
                  if (emailError) {
                    if (!val.trim()) setEmailError('Email is required');
                    else setEmailError(validateEmail(val));
                  }
                }}
                onBlur={() => {
                  if (!contactEmail.trim()) {
                    setEmailError('Email is required');
                  } else {
                    setEmailError(validateEmail(contactEmail));
                  }
                }}
                error={Boolean(emailError)}
                helperText={
                  emailError || 'Required: Brand manager will use this email address to log in'
                }
                placeholder="e.g. manager@brand.com"
                fullWidth
              />

              <TextField
                label="Contact Phone *"
                value={contactPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  setContactPhone(val);
                  if (phoneError) {
                    if (!val.trim()) setPhoneError('Phone number is required');
                    else setPhoneError(validatePhone(val));
                  }
                }}
                onBlur={() => {
                  if (!contactPhone.trim()) {
                    setPhoneError('Phone number is required');
                  } else {
                    setPhoneError(validatePhone(contactPhone));
                  }
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || 'Required: the brand manager\u2019s direct line'}
                placeholder="e.g. +91 9876543210"
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
                !contactEmail.trim() ||
                !contactPhone.trim() ||
                Boolean(emailError) ||
                Boolean(phoneError) ||
                createBrandMutation.isPending ||
                updateBrandMutation.isPending
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

      {/* Brand Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedBrand)}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand?.name || 'Brand Overview'}
        subtitle={
          selectedBrand
            ? `Managing Agency: ${agencies.find((a) => a.id === selectedBrand.agencyIds?.[0])?.name || 'Direct / Platform'}`
            : undefined
        }
        badge={selectedBrand?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        avatarText={selectedBrand?.name}
        highlights={
          selectedBrand
            ? [
                {
                  label: 'Industry',
                  value: selectedBrand.industry || 'General',
                  tint: 'mint',
                },
                {
                  label: 'Location',
                  value: selectedBrand.city || 'Not specified',
                  tint: 'sky',
                },
              ]
            : []
        }
        sections={
          selectedBrand
            ? [
                {
                  title: 'Brand Information',
                  fields: [
                    { label: 'Brand Name', value: selectedBrand.name },
                    {
                      label: 'Managing Agency',
                      value: agencies.find((a) => a.id === selectedBrand.agencyIds?.[0])?.name || 'Direct / Platform',
                    },
                    { label: 'Brand ID', value: selectedBrand.id, copyable: true },
                    { label: 'Status', value: selectedBrand.isActive ? 'Active' : 'Archived', isStatus: true },
                    {
                      label: 'Created On',
                      value: new Date(selectedBrand.createdOn).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    },
                  ],
                },
                {
                  title: 'Contact Details',
                  fields: [
                    { label: 'Contact Email', value: selectedBrand.contactEmail, copyable: true },
                    { label: 'Contact Phone', value: selectedBrand.contactPhone || '—' },
                    {
                      label: 'Official Website',
                      value: selectedBrand.website || '—',
                      isLink: Boolean(selectedBrand.website),
                      href: selectedBrand.website || undefined,
                    },
                  ],
                },
                {
                  title: 'Details',
                  fields: [
                    { label: 'Industry', value: selectedBrand.industry || '—' },
                    { label: 'Address', value: selectedBrand.address || '—' },
                    { label: 'City', value: selectedBrand.city || '—' },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedBrand
            ? [
                {
                  label: 'Edit Brand',
                  onClick: () => {
                    const br = selectedBrand;
                    setSelectedBrand(null);
                    handleOpenEdit(br);
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
