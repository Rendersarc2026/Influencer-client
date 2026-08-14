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
import { useAuth } from '@hooks';

export const AgencyBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: brands = [], isLoading } = useAgencyBrands();
  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.industry && b.industry.toLowerCase().includes(search.toLowerCase())),
  );

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
    if (brandId) {
      await updateBrandMutation.mutateAsync({ id: brandId, data });
    } else {
      await createBrandMutation.mutateAsync(data as CreateBrandRequest);
    }
    setDialogOpen(false);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search brands by name or industry..."
        />

        <DataTable<BrandResponse> columns={columns} rows={filteredBrands} loading={isLoading} />
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
