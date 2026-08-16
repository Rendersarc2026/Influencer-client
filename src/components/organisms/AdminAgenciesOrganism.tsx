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
import { useAdminAgencies, useCreateAgency, useUpdateAgency, useDeactivateAgency } from '@api';
import { AgencyResponse } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import { capitalizeWords } from '@utils';

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
  const [selectedAgency, setSelectedAgency] = useState<AgencyResponse | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deactivateAgencyId, setDeactivateAgencyId] = useState<string | null>(null);

  const validateSlug = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Slug is required';
    }
    if (/\s/.test(val)) {
      return 'Spaces are not allowed in slugs (use hyphens instead, e.g. "my-agency")';
    }
    if (/[A-Z]/.test(val)) {
      return 'Only lowercase letters are allowed';
    }
    if (/[^a-z0-9-]/.test(val)) {
      return 'Only lowercase letters, numbers, and hyphens (-) are allowed';
    }
    if (val.startsWith('-') || val.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }
    if (/--/.test(val)) {
      return 'Consecutive hyphens (--) are not allowed';
    }
    if (val.length > 80) {
      return 'Slug must be at most 80 characters';
    }
    return '';
  };

  const validateEmail = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Must be a valid email address (e.g. lead@agency.com)';
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

  const [nameError, setNameError] = useState('');
  const [slugError, setSlugError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const generateSlug = (val: string): string =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleOpenCreate = () => {
    setAgencyToEdit(null);
    setName('');
    setSlug('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setNameError('');
    setSlugError('');
    setEmailError('');
    setPhoneError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (agency: AgencyResponse) => {
    setAgencyToEdit(agency);
    setName(agency.name);
    setSlug(agency.slug);
    setContactPerson(agency.contactPerson || '');
    setContactEmail(agency.contactEmail || '');
    setContactPhone(agency.contactPhone || '');
    setNameError('');
    setSlugError('');
    setEmailError('');
    setPhoneError('');
    setDialogOpen(true);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setSlugError('');
    setEmailError('');
    setPhoneError('');

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedContactPerson = contactPerson.trim();
    const trimmedContactEmail = contactEmail.trim().toLowerCase();
    const trimmedContactPhone = contactPhone.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError('Agency name is required');
      hasError = true;
    }

    const sError = validateSlug(trimmedSlug);
    if (sError) {
      setSlugError(sError);
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

    if (trimmedContactPhone) {
      const pErr = validatePhone(trimmedContactPhone);
      if (pErr) {
        setPhoneError(pErr);
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      if (agencyToEdit) {
        await updateAgencyMutation.mutateAsync({
          id: agencyToEdit.id,
          data: {
            name: trimmedName,
            slug: trimmedSlug,
            contactPerson: trimmedContactPerson || undefined,
            contactEmail: trimmedContactEmail || undefined,
            contactPhone: trimmedContactPhone || undefined,
          },
        });
        showSuccess('Agency updated successfully.');
      } else {
        await createAgencyMutation.mutateAsync({
          name: trimmedName,
          slug: trimmedSlug,
          contactEmail: trimmedContactEmail,
          contactPerson: trimmedContactPerson || undefined,
          contactPhone: trimmedContactPhone || undefined,
        });
        showSuccess('Agency created successfully.');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          data?: { message?: string; code?: string };
        };
        message?: string;
      };
      const msg = errorObj?.response?.data?.message || errorObj?.message || 'Failed to save agency.';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      } else if (
        errorObj?.response?.data?.code === 'ALREADY_EXISTS' ||
        msg.toLowerCase().includes('slug')
      ) {
        setSlugError(msg);
      }
      showError(msg);
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
      subAccessor: (row) =>
        `Slug: ${row.slug}${row.contactEmail ? ` • Email: ${row.contactEmail}` : ''}${row.contactPhone ? ` • Phone: ${row.contactPhone}` : ''}`,
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
          onRowClick={(row) => setSelectedAgency(row)}
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
                  const val = capitalizeWords(e.target.value);
                  setName(val);
                  if (nameError && val.trim()) setNameError('');
                  if (!agencyToEdit) {
                    const autoSlug = generateSlug(val);
                    setSlug(autoSlug);
                    setSlugError(validateSlug(autoSlug));
                  }
                }}
                error={Boolean(nameError)}
                helperText={nameError}
                placeholder="e.g. Omnicom Media Group"
                fullWidth
              />

              <TextField
                label="Agency Slug *"
                value={slug}
                onChange={(e) => {
                  const raw = e.target.value;
                  setSlug(raw);
                  setSlugError(validateSlug(raw));
                }}
                error={Boolean(slugError)}
                helperText={
                  slugError ||
                  'URL-safe identifier: lowercase letters, numbers, and hyphens only (e.g. "omnicom-media"). No spaces allowed.'
                }
                placeholder="e.g. omnicom-media"
                fullWidth
              />

              <TextField
                label="Contact Person Name"
                value={contactPerson}
                onChange={(e) => setContactPerson(capitalizeWords(e.target.value))}
                placeholder="e.g. John Doe - Managing Director"
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
                  emailError || 'Required: Agency manager will use this email address to log in'
                }
                placeholder="e.g. lead@agency.com"
                fullWidth
              />

              <TextField
                label="Contact Phone"
                value={contactPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  setContactPhone(val);
                  if (phoneError) setPhoneError(validatePhone(val));
                }}
                onBlur={() => {
                  if (contactPhone.trim()) {
                    setPhoneError(validatePhone(contactPhone));
                  }
                }}
                error={Boolean(phoneError)}
                helperText={phoneError}
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
                !slug.trim() ||
                Boolean(nameError) ||
                Boolean(slugError) ||
                Boolean(emailError) ||
                Boolean(phoneError) ||
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

      {/* Agency Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedAgency)}
        onClose={() => setSelectedAgency(null)}
        title={selectedAgency?.name || 'Agency Overview'}
        subtitle={selectedAgency ? `Slug: /${selectedAgency.slug}` : undefined}
        badge={selectedAgency?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        avatarText={selectedAgency?.name}
        highlights={
          selectedAgency
            ? [
                {
                  label: 'City',
                  value: selectedAgency.city || 'Not specified',
                  tint: 'mint',
                },
                {
                  label: 'GST Number',
                  value: selectedAgency.gstNumber || 'Not provided',
                  tint: 'sky',
                },
              ]
            : []
        }
        sections={
          selectedAgency
            ? [
                {
                  title: 'Agency Identity',
                  fields: [
                    { label: 'Agency Name', value: selectedAgency.name },
                    { label: 'Slug Identifier', value: selectedAgency.slug, copyable: true },
                    { label: 'Tenant Status', value: selectedAgency.isActive ? 'Active' : 'Archived', isStatus: true },
                    {
                      label: 'Created On',
                      value: new Date(selectedAgency.createdOn).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    },
                  ],
                },
                {
                  title: 'Contact Information',
                  fields: [
                    { label: 'Contact Person', value: selectedAgency.contactPerson || '—' },
                    { label: 'Contact Email', value: selectedAgency.contactEmail, copyable: true },
                    { label: 'Contact Phone', value: selectedAgency.contactPhone || '—' },
                    {
                      label: 'Official Website',
                      value: selectedAgency.website || '—',
                      isLink: Boolean(selectedAgency.website),
                      href: selectedAgency.website || undefined,
                    },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedAgency
            ? [
                {
                  label: 'Edit Agency',
                  onClick: () => {
                    const ag = selectedAgency;
                    setSelectedAgency(null);
                    handleOpenEdit(ag);
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
