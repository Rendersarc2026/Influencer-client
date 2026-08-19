import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useCategoryList,
  useCreateCategory,
  useUpdateCategory,
  useDeactivateCategory,
  apiClient,
} from '@api';
import { CategoryResponse, CategoryType, CategoryTypeCode, PaginatedResult } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters, useTableExport } from '@hooks';
import { capitalizeWords, ExcelColumnConfig } from '@utils';

export const AgencyCategoriesOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<CategoryType>(CategoryTypeCode.BRAND);

  const {
    search,
    setSearch,
    activePill: statusFilter,
    setActivePill: setStatusFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyCategories');
  const debouncedSearch = useDebounce(search, 300);

  const activeStatus =
    statusFilter === 'ACTIVE' ? true : statusFilter === 'ARCHIVED' ? false : undefined;

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
  } = useCategoryList({
    type: activeTab,
    search: debouncedSearch.trim() || undefined,
    isActive: activeStatus,
    page: page + 1,
    limit: rowsPerPage,
  });

  // Query counts for tabs
  const { data: brandCountData } = useCategoryList({ type: CategoryTypeCode.BRAND, page: 1, limit: 1 });
  const { data: influencerCountData } = useCategoryList({
    type: CategoryTypeCode.INFLUENCER,
    page: 1,
    limit: 1,
  });

  const brandTotal = brandCountData?.total ?? 0;
  const influencerTotal = influencerCountData?.total ?? 0;

  const categories = categoriesData?.items || [];
  const totalCategories = categoriesData?.total ?? categories.length;

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deactivateCategoryMutation = useDeactivateCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);

  const [categoryType, setCategoryType] = useState<CategoryType>(CategoryTypeCode.BRAND);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [deactivateCategoryId, setDeactivateCategoryId] = useState<string | null>(null);

  const statusPillOptions = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setCategoryType(activeTab);
    setName('');
    setDescription('');
    setNameError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: CategoryResponse) => {
    setCategoryToEdit(cat);
    setCategoryType(cat.type);
    setName(cat.name);
    setDescription(cat.description || '');
    setNameError('');
    setDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Category name is required');
      return;
    }

    if (trimmedName.length > 100) {
      setNameError('Category name must be at most 100 characters');
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length > 500) {
      showError('Description must be at most 500 characters');
      return;
    }

    try {
      if (categoryToEdit) {
        await updateCategoryMutation.mutateAsync({
          id: categoryToEdit.id,
          data: {
            name: trimmedName,
            description: trimmedDesc || undefined,
          },
        });
        showSuccess('Category updated successfully.');
      } else {
        await createCategoryMutation.mutateAsync({
          type: categoryType,
          name: trimmedName,
          description: trimmedDesc || undefined,
        });
        showSuccess(`${categoryType === CategoryTypeCode.BRAND ? 'Brand' : 'Influencer'} category created.`);
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to save category.';
      if (msg.toLowerCase().includes('name') || msg.toLowerCase().includes('already exists')) {
        setNameError(msg);
      }
      showError(msg);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateCategoryId) return;
    try {
      await deactivateCategoryMutation.mutateAsync(deactivateCategoryId);
      showSuccess('Category deactivated successfully.');
      setDeactivateCategoryId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to deactivate category.',
      );
    }
  };

  const categoryToDeactivate = categories.find((c) => c.id === deactivateCategoryId);

  const columns: Array<DataTableColumn<CategoryResponse>> = [
    {
      id: 'name',
      header: 'Category Name',
      type: 'entity',
      accessor: (row) => row.name,
      subAccessor: (row) =>
        row.type === CategoryTypeCode.BRAND ? 'Brand Industry Classification' : 'Creator Niche / Specialization',
    },
    {
      id: 'type',
      header: 'Category Scope',
      type: 'text',
      render: (row) => (
        <Chip
          size="small"
          icon={
            row.type === CategoryTypeCode.BRAND ? (
              <StorefrontRoundedIcon sx={{ fontSize: '14px !important' }} />
            ) : (
              <PeopleAltRoundedIcon sx={{ fontSize: '14px !important' }} />
            )
          }
          label={row.type === CategoryTypeCode.BRAND ? 'Brand Category' : 'Influencer Category'}
          sx={{
            fontWeight: 600,
            fontSize: '12px',
            backgroundColor:
              row.type === CategoryTypeCode.BRAND
                ? theme.palette.tokens.accentBg
                : theme.palette.tokens.purpleBg,
            color:
              row.type === CategoryTypeCode.BRAND
                ? theme.palette.tokens.accentText
                : theme.palette.tokens.purpleText,
          }}
        />
      ),
    },
    {
      id: 'description',
      header: 'Description',
      type: 'text',
      accessor: (row) => row.description || '—',
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
          <Tooltip title="Edit Category">
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.isActive && (
            <Tooltip title="Deactivate Category">
              <IconButton
                size="small"
                color="error"
                onClick={() => setDeactivateCategoryId(row.id)}
              >
                <BlockRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const handleExportAll = async (): Promise<CategoryResponse[]> => {
    const res = await apiClient.get<PaginatedResult<CategoryResponse>>('/categories', {
      params: {
        type: activeTab,
        search: debouncedSearch.trim() || undefined,
        isActive: activeStatus,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, isExporting } = useTableExport({
    filename: `${activeTab === CategoryTypeCode.BRAND ? 'brand' : 'influencer'}_categories`,
    sheetName: 'Categories',
    columns: columns as Array<ExcelColumnConfig<CategoryResponse>>,
    rows: categories,
    onExportAll: handleExportAll,
  });

  return (
    <DashboardLayout
      title="Categories"
      subtitle="Manage taxonomy for brand industry classifications and influencer niche categories"
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
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Category</Box>
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        {/* Category Tabs: Brand Categories & Influencer Categories */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 0.75,
            backgroundColor: theme.palette.tokens.surface,
            borderRadius: `${theme.customRadii.pill}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            width: { xs: '100%', sm: 'fit-content' },
          }}
        >
          <ButtonBase
            onClick={() => {
              setActiveTab(CategoryTypeCode.BRAND);
              setPage(0);
            }}
            sx={{
              flex: { xs: 1, sm: 'initial' },
              px: { xs: 1.5, sm: 3 },
              py: 1.25,
              borderRadius: `${theme.customRadii.pill}px`,
              backgroundColor: activeTab === CategoryTypeCode.BRAND ? theme.palette.tokens.rail : 'transparent',
              color: activeTab === CategoryTypeCode.BRAND ? '#FFFFFF' : theme.palette.tokens.textSecondary,
              fontWeight: 600,
              fontSize: { xs: '12px', sm: theme.typography.body2.fontSize },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.75, sm: 1.25 },
              transition: 'all 0.2s ease',
              '&:hover': {
                color: activeTab === CategoryTypeCode.BRAND ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                backgroundColor:
                  activeTab === CategoryTypeCode.BRAND ? theme.palette.tokens.rail : theme.palette.tokens.fieldBg,
              },
            }}
          >
            <StorefrontRoundedIcon fontSize="small" />
            <span>Brand Categories</span>
            <Chip
              size="small"
              label={brandTotal}
              sx={{
                height: 20,
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor:
                  activeTab === CategoryTypeCode.BRAND ? 'rgba(255,255,255,0.2)' : theme.palette.tokens.fieldBg,
                color: activeTab === CategoryTypeCode.BRAND ? '#FFFFFF' : theme.palette.tokens.textPrimary,
              }}
            />
          </ButtonBase>

          <ButtonBase
            onClick={() => {
              setActiveTab(CategoryTypeCode.INFLUENCER);
              setPage(0);
            }}
            sx={{
              flex: { xs: 1, sm: 'initial' },
              px: { xs: 1.5, sm: 3 },
              py: 1.25,
              borderRadius: `${theme.customRadii.pill}px`,
              backgroundColor:
                activeTab === CategoryTypeCode.INFLUENCER ? theme.palette.tokens.rail : 'transparent',
              color: activeTab === CategoryTypeCode.INFLUENCER ? '#FFFFFF' : theme.palette.tokens.textSecondary,
              fontWeight: 600,
              fontSize: { xs: '12px', sm: theme.typography.body2.fontSize },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.75, sm: 1.25 },
              transition: 'all 0.2s ease',
              '&:hover': {
                color: activeTab === CategoryTypeCode.INFLUENCER ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                backgroundColor:
                  activeTab === CategoryTypeCode.INFLUENCER
                    ? theme.palette.tokens.rail
                    : theme.palette.tokens.fieldBg,
              },
            }}
          >
            <PeopleAltRoundedIcon fontSize="small" />
            <span>Influencer Categories</span>
            <Chip
              size="small"
              label={influencerTotal}
              sx={{
                height: 20,
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor:
                  activeTab === CategoryTypeCode.INFLUENCER
                    ? 'rgba(255,255,255,0.2)'
                    : theme.palette.tokens.fieldBg,
                color:
                  activeTab === CategoryTypeCode.INFLUENCER
                    ? '#FFFFFF'
                    : theme.palette.tokens.textPrimary,
              }}
            />
          </ButtonBase>
        </Box>

        {/* FilterBar with Search and Status Pills */}
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={`Search ${activeTab === CategoryTypeCode.BRAND ? 'brand' : 'influencer'} categories...`}
          pills={statusPillOptions}
          activePillId={statusFilter || 'ALL'}
          onPillChange={setStatusFilter}
          onExport={exportExcel}
          isExporting={isExporting}
          exportDisabled={totalCategories === 0}
        />

        {/* Categories DataTable */}
        <DataTable<CategoryResponse>
          columns={columns}
          rows={categories}
          totalRows={totalCategories}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={categoriesLoading}
          isFetching={categoriesFetching}
          onRowClick={(row) => setSelectedCategory(row)}
          fillHeight
        />
      </Box>

      {/* Add / Edit Category Dialog */}
      <Dialog
        open={dialogOpen}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              padding: '12px',
              backgroundImage: 'none',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            },
          },
        }}
      >
        <form onSubmit={handleSaveCategory}>
          <DialogTitle sx={{ pb: 0, pt: 1, px: 2 }}>
            <SectionHeading
              title={
                categoryToEdit
                  ? 'Edit Category'
                  : `Add ${categoryType === CategoryTypeCode.BRAND ? 'Brand' : 'Influencer'} Category`
              }
              subtitle={
                categoryType === CategoryTypeCode.BRAND
                  ? 'Industry classification for brands and client companies'
                  : 'Niche / content domain for content creators and influencers'
              }
              mb={0}
            />
          </DialogTitle>

          <DialogContent
            sx={{
              pt: 0.5,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                select
                label="Category Scope *"
                value={categoryType}
                onChange={(e) => setCategoryType(Number(e.target.value) as CategoryType)}
                fullWidth
                disabled={Boolean(categoryToEdit)}
                helperText={
                  categoryToEdit
                    ? 'Category scope cannot be changed after creation'
                    : 'Choose whether this category is for brands or influencers'
                }
              >
                <MenuItem value={CategoryTypeCode.BRAND}>Brand Category (Industry)</MenuItem>
                <MenuItem value={CategoryTypeCode.INFLUENCER}>
                  Influencer Category (Niche)
                </MenuItem>
              </TextField>

              <TextField
                label="Category Name *"
                value={name}
                onChange={(e) => {
                  const val = capitalizeWords(e.target.value);
                  setName(val);
                  if (nameError) setNameError('');
                }}
                error={Boolean(nameError)}
                helperText={
                  nameError ||
                  (categoryType === CategoryTypeCode.BRAND
                    ? 'e.g. Fashion & Apparel, Skincare, Technology & Electronics'
                    : 'e.g. Fashion Lifestyle, Tech Reviewer, Fitness & Wellness')
                }
                placeholder={
                  categoryType === CategoryTypeCode.BRAND ? 'e.g. Beauty & Personal Care' : 'e.g. Food Vlogger'
                }
                fullWidth
                autoFocus
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional explanation of what brands or influencers belong in this category..."
                multiline
                rows={3}
                fullWidth
                helperText="Optional description (up to 500 characters)"
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
                Boolean(nameError) ||
                createCategoryMutation.isPending ||
                updateCategoryMutation.isPending
              }
              sx={{ minWidth: 120 }}
            >
              {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : categoryToEdit ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={Boolean(deactivateCategoryId)}
        title="Deactivate Category?"
        body={`Are you sure you want to deactivate "${categoryToDeactivate?.name || 'this category'}"? It will no longer appear in active dropdown selections.`}
        confirmText="Deactivate Category"
        variant="destructive"
        loading={deactivateCategoryMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateCategoryId(null)}
      />

      {/* Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedCategory)}
        onClose={() => setSelectedCategory(null)}
        title={selectedCategory?.name || 'Category Details'}
        subtitle={
          selectedCategory?.type === CategoryTypeCode.BRAND
            ? 'Brand Industry Category'
            : 'Influencer Niche Category'
        }
        badge={selectedCategory?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        sections={[
          {
            title: 'Category Information',
            fields: [
              {
                label: 'Category Scope',
                value:
                  selectedCategory?.type === CategoryTypeCode.BRAND
                    ? 'Brand Industry'
                    : 'Influencer Creator Niche',
              },
              { label: 'Category Name', value: selectedCategory?.name || '—' },
              {
                label: 'Description',
                value: selectedCategory?.description || 'No description provided.',
              },
              {
                label: 'Status',
                value: selectedCategory?.isActive ? 'Active (In Use)' : 'Archived / Deactivated',
                isStatus: true,
              },
              {
                label: 'Created On',
                value: selectedCategory?.createdOn
                  ? new Date(selectedCategory.createdOn).toLocaleString('en-IN')
                  : '—',
              },
              {
                label: 'Last Updated',
                value: selectedCategory?.updatedOn
                  ? new Date(selectedCategory.updatedOn).toLocaleString('en-IN')
                  : '—',
              },
            ],
          },
        ]}
      />
    </DashboardLayout>
  );
};
