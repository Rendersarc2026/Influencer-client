import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, CreateBrandDialog, OverviewDrawer } from '@molecules';
import { apiClient, useAgencyBrands, useCreateBrand, useUpdateBrand } from '@api';
import { BrandResponse, CreateBrandRequest, UpdateBrandRequest, PaginatedResult } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters, useTableExport } from '@hooks';
import { safeUrl, safeImageUrl, ExcelColumnConfig } from '@utils';

/**
 * The agency's client brands.
 *
 * There is one list, not two: every brand here was created by this agency, so
 * there is no platform-wide pool to browse and no "take on an existing client"
 * path — signing one up is the only way the list grows.
 */
export const AgencyBrandsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { search, setSearch, page, setPage, rowsPerPage, setRowsPerPage } =
    useViewFilters('agencyBrands');
  const debouncedSearch = useDebounce(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [brandToEdit, setBrandToEdit] = useState<BrandResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);

  const brandsQuery = useAgencyBrands({
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const brands = brandsQuery.data?.items || [];
  const totalBrands = brandsQuery.data?.total ?? brands.length;

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();

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
      setSelectedBrand(null);
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
          <Tooltip title="Message Brand">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/agency/chats?participantId=${row.id}&type=BRAND`);
              }}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <ChatBubbleOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Brand">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
            >
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleExportAll = async (): Promise<BrandResponse[]> => {
    const res = await apiClient.get<PaginatedResult<BrandResponse>>('/agency/brands', {
      params: {
        search: debouncedSearch.trim() || undefined,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, isExporting } = useTableExport({
    filename: 'agency_brands',
    sheetName: 'Brands',
    columns: columns as Array<ExcelColumnConfig<BrandResponse>>,
    rows: brands,
    onExportAll: handleExportAll,
  });

  return (
    <DashboardLayout
      title="Brands"
      subtitle="Brand portfolios and account relationships"
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
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Brand</Box>
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(0);
          }}
          searchPlaceholder="Search by brand name or industry"
          onExport={exportExcel}
          isExporting={isExporting}
          exportDisabled={totalBrands === 0}
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
          loading={brandsQuery.isLoading}
          isFetching={brandsQuery.isFetching}
          onRowClick={(row) => setSelectedBrand(row)}
          fillHeight
        />
      </Box>

      {/* Brand Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedBrand)}
        onClose={() => setSelectedBrand(null)}
        title={selectedBrand?.name || 'Brand Overview'}
        subtitle={
          selectedBrand
            ? `Industry: ${selectedBrand.industry || 'General Industry'} · ${selectedBrand.city || 'National'}`
            : undefined
        }
        badge={selectedBrand?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        avatarText={selectedBrand?.name}
        avatarUrl={safeImageUrl(selectedBrand?.logoUrl)}
        highlights={
          selectedBrand
            ? [
                {
                  label: 'Industry Niche',
                  value: selectedBrand.industry || 'General',
                  tint: 'sky',
                },
                {
                  label: 'Account Status',
                  value: selectedBrand.isActive ? 'Active' : 'Archived',
                  tint: selectedBrand.isActive ? 'mint' : 'butter',
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
                    { label: 'Industry', value: selectedBrand.industry || 'General' },
                    {
                      label: 'Onboarded Date',
                      value: new Date(selectedBrand.createdOn).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }),
                    },
                    {
                      label: 'Website',
                      value: selectedBrand.website || '—',
                      isLink: Boolean(selectedBrand.website),
                      href: safeUrl(
                        selectedBrand.website?.startsWith('http')
                          ? selectedBrand.website
                          : selectedBrand.website
                          ? `https://${selectedBrand.website}`
                          : undefined,
                      ),
                    },
                    ...(selectedBrand.bio
                      ? [{ label: 'Bio & Overview', value: selectedBrand.bio, fullWidth: true }]
                      : []),
                  ],
                },
                {
                  title: 'Contact Details',
                  fields: [
                    { label: 'Contact Person', value: selectedBrand.contactPerson || '—' },
                    { label: 'Contact Email', value: selectedBrand.contactEmail || '—', copyable: true },
                    { label: 'Contact Phone', value: selectedBrand.contactPhone || '—' },
                    { label: 'City', value: selectedBrand.city || '—' },
                    { label: 'Office Address', value: selectedBrand.address || '—', fullWidth: true },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedBrand
            ? [
                {
                  label: 'Message Brand',
                  variant: 'contained',
                  onClick: () => {
                    const id = selectedBrand.id;
                    setSelectedBrand(null);
                    navigate(`/agency/chats?participantId=${id}&type=BRAND`);
                  },
                },
                {
                  label: 'Edit Brand',
                  variant: 'outlined',
                  onClick: () => {
                    const b = selectedBrand;
                    setSelectedBrand(null);
                    handleOpenEdit(b);
                  },
                },
              ]
            : []
        }
      />

      <CreateBrandDialog
        open={dialogOpen}
        brandToEdit={brandToEdit}
        existingBrands={brands}
        loading={createBrandMutation.isPending || updateBrandMutation.isPending}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialogOpen(false)}
      />
    </DashboardLayout>
  );
};
