import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, CreateBrandDialog } from '@molecules';
import {
  useAgencyBrands,
  useAgencyBrandDirectory,
  useCreateBrand,
  useLinkExistingBrand,
  useUpdateBrand,
} from '@api';
import { BrandResponse, CreateBrandRequest, UpdateBrandRequest } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

/**
 * Which set of brands the table shows. A brand exists once platform-wide and
 * is managed by any number of agencies, so "all brands" is a real view: it is
 * where an agency finds a client somebody else registered and takes it on.
 */
const SCOPE_CLIENTS = 'CLIENTS';
const SCOPE_ALL = 'ALL_BRANDS';

export const AgencyBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    search,
    setSearch,
    activePill,
    setActivePill,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyBrands');
  const debouncedSearch = useDebounce(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);
  /** The row whose link request is in flight, so only that row shows a spinner. */
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // The stored default pill is 'ALL', which is neither of these ids — anything
  // but an explicit "all brands" choice falls back to this agency's own list.
  const scope = activePill === SCOPE_ALL ? SCOPE_ALL : SCOPE_CLIENTS;
  const showingAll = scope === SCOPE_ALL;

  const listParams = {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  };

  // Only the list the filter is showing is fetched — the other would spend a
  // round trip on rows that are not on screen.
  const managedQuery = useAgencyBrands(listParams, { enabled: !showingAll });
  // Paged the same way, so switching tabs does not change how the table reads.
  const directoryQuery = useAgencyBrandDirectory(listParams, { enabled: showingAll });

  const activeQuery = showingAll ? directoryQuery : managedQuery;
  const brands = activeQuery.data?.items || [];
  const totalBrands = activeQuery.data?.total ?? brands.length;

  // The unpaged directory, which the dialog needs whole: it is both the
  // "add existing" picker's options and what the create form checks a typed
  // name against, and neither can work off a single page of results. Fetched
  // only once the dialog is open — nothing on the table itself reads it.
  const { data: fullDirectoryData, isLoading: directoryLoading } = useAgencyBrandDirectory(
    undefined,
    { enabled: dialogOpen },
  );
  const fullDirectory = fullDirectoryData?.items || [];

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const linkBrandMutation = useLinkExistingBrand();

  const isManaged = (brand: BrandResponse) =>
    Boolean(user?.agencyId && brand.agencyIds.includes(user.agencyId));

  const handleOpenCreate = () => {
    setBrandToEdit(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (brand: BrandResponse) => {
    setBrandToEdit(brand);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (
    data: CreateBrandRequest | UpdateBrandRequest,
    brandId?: string,
  ) => {
    try {
      if (brandId) {
        await updateBrandMutation.mutateAsync({ id: brandId, data });
        showSuccess('Brand updated successfully.');
      } else {
        await createBrandMutation.mutateAsync(data as CreateBrandRequest);
        showSuccess('Brand created successfully.');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to save brand.');
    }
  };

  const handleLinkBrand = async (brandId: string, closeDialog: boolean) => {
    setLinkingId(brandId);
    try {
      const brand = await linkBrandMutation.mutateAsync(brandId);
      showSuccess(`${brand.name} added to your client brands.`);
      if (closeDialog) setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add brand.');
    } finally {
      setLinkingId(null);
    }
  };

  const columns: Array<DataTableColumn<BrandResponse>> = [
    {
      id: 'name',
      header: 'Brand Name',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => row.industry || 'General Industry',
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: (row) => (row.isActive ? 'ACTIVE' : 'ARCHIVED'),
    },
    {
      id: 'createdOn',
      header: 'Onboarded',
      type: 'text',
      accessor: (row) => new Date(row.createdOn).toLocaleDateString('en-IN'),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => {
        // In the full directory a row may belong to another agency entirely,
        // so the action there is "take it on", not "edit what you don't manage".
        if (showingAll && !isManaged(row)) {
          return (
            <Button
              size="small"
              variant="outlined"
              startIcon={
                linkingId === row.id ? undefined : <AddBusinessRoundedIcon fontSize="small" />
              }
              disabled={Boolean(linkingId)}
              onClick={() => handleLinkBrand(row.id, false)}
            >
              {linkingId === row.id ? <CircularProgress size={16} color="inherit" /> : 'Add'}
            </Button>
          );
        }

        if (showingAll) {
          return (
            <Button
              size="small"
              variant="text"
              startIcon={<CheckRoundedIcon fontSize="small" />}
              disabled
            >
              Your client
            </Button>
          );
        }

        return (
          <IconButton size="small" onClick={() => handleOpenEdit(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="Managed Brands"
      subtitle="Client brand portfolios and account relationships"
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={handleOpenCreate}
        >
          Add Brand
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          pills={[
            { id: SCOPE_CLIENTS, label: 'My Clients' },
            { id: SCOPE_ALL, label: 'All Brands' },
          ]}
          activePillId={scope}
          onPillChange={setActivePill}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by brand name or industry"
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
          loading={activeQuery.isLoading}
          isFetching={activeQuery.isFetching}
          fillHeight
        />
      </Box>

      <CreateBrandDialog
        open={dialogOpen}
        brandToEdit={brandToEdit}
        directory={fullDirectory}
        directoryLoading={directoryLoading}
        agencyId={user?.agencyId}
        loading={createBrandMutation.isPending || updateBrandMutation.isPending}
        linking={linkBrandMutation.isPending}
        onSubmit={handleDialogSubmit}
        onLinkExisting={(brandId) => handleLinkBrand(brandId, true)}
        onClose={() => setDialogOpen(false)}
      />
    </DashboardLayout>
  );
};
