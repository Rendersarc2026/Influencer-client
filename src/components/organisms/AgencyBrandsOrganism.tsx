import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, CreateBrandDialog } from '@molecules';
import { useAgencyBrands, useCreateBrand, useUpdateBrand } from '@api';
import { BrandResponse, CreateBrandRequest, UpdateBrandRequest } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

export const AgencyBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
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
  } = useViewFilters('agencyBrands');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: brandsData,
    isLoading,
    isFetching,
  } = useAgencyBrands({
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const brands = brandsData?.items || [];
  const totalBrands = brandsData?.total ?? brands.length;

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);

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
      render: (row) => (
        <IconButton size="small" onClick={() => handleOpenEdit(row)}>
          <EditRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Brands"
      subtitle="Every brand on the platform — run a campaign under any of them"
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
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
          loading={isLoading}
          isFetching={isFetching}
        />
      </Box>

      <CreateBrandDialog
        open={dialogOpen}
        brandToEdit={brandToEdit}
        loading={createBrandMutation.isPending || updateBrandMutation.isPending}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialogOpen(false)}
      />
    </DashboardLayout>
  );
};
