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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useCategoryList,
  useCreateCategory,
  useUpdateCategory,
  useSetCategoryArchived,
  useDeleteCategory,
  apiClient,
} from '@api';
import { CategoryResponse, CategoryType, CategoryTypeCode, PaginatedResult } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters, useTableExport } from '@hooks';
import { capitalizeWords, ExcelColumnConfig, validateCategoryName } from '@utils';

interface CategoryRowActionsProps {
  row: CategoryResponse;
  /** This row's archive/restore is in flight. */
  busy?: boolean;
  onEdit: (row: CategoryResponse) => void;
  onSetArchived: (row: CategoryResponse, archived: boolean) => void;
  onDelete: (row: CategoryResponse) => void;
}

const CategoryRowActions: React.FC<CategoryRowActionsProps> = ({
  row,
  busy = false,
  onEdit,
  onSetArchived,
  onDelete,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* The menu closes the moment an action is picked, so the trigger has to
          carry the progress — archiving is a round trip to a remote database
          and the row is otherwise unchanged until it lands. */}
      <Tooltip title={busy ? 'Working…' : 'Actions'}>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            border: `1px solid ${open ? theme.palette.primary.main : theme.palette.tokens.divider}`,
            backgroundColor: open ? theme.palette.tokens.fieldBg : theme.palette.tokens.surface,
            borderRadius: `${theme.customRadii.inner}px`,
            p: 0.75,
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: theme.palette.tokens.fieldBg,
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {busy ? (
            <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />
          ) : (
            <MoreVertRoundedIcon
              fontSize="small"
              sx={{ color: theme.palette.tokens.textPrimary }}
            />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              border: `1px solid ${theme.palette.tokens.divider}`,
              minWidth: 200,
              padding: '6px',
              mt: 0.75,
              boxShadow:
                '0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            handleClose();
            onEdit(row);
          }}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textSecondary, minWidth: 'auto' }}>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Edit Category"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        {/* Archiving retires a category from the dropdowns; deleting removes it.
            They are separate columns, so they are separate actions here too —
            and an archived row can always come back. */}
        <MenuItem
          onClick={() => {
            handleClose();
            onSetArchived(row, !row.isArchived);
          }}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.textSecondary, minWidth: 'auto' }}>
            {row.isArchived ? (
              <UnarchiveRoundedIcon fontSize="small" />
            ) : (
              <ArchiveRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={row.isArchived ? 'Restore Category' : 'Archive Category'}
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={() => {
            handleClose();
            onDelete(row);
          }}
          sx={{
            fontSize: '13px',
            fontWeight: 500,
            py: 0.85,
            px: 1.25,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: theme.palette.tokens.negative,
            '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
          }}
        >
          <ListItemIcon sx={{ color: theme.palette.tokens.negative, minWidth: 'auto' }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Delete Category"
            primaryTypographyProps={{
              fontSize: '13px',
              fontWeight: 500,
              color: theme.palette.tokens.negative,
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

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
    statusFilter === 'ACTIVE' ? 'ACTIVE' : statusFilter === 'ARCHIVED' ? 'ARCHIVED' : 'ALL';

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
  } = useCategoryList({
    type: activeTab,
    search: debouncedSearch.trim() || undefined,
    // Selects on the archive flag; the soft delete is not a view the screen offers.
    status: activeStatus,
    page: page + 1,
    limit: rowsPerPage,
  });

  // Query counts for tabs
  const { data: brandCountData } = useCategoryList({
    type: CategoryTypeCode.BRAND,
    status: 'ACTIVE',
    page: 1,
    limit: 1,
  });
  const { data: influencerCountData } = useCategoryList({
    type: CategoryTypeCode.INFLUENCER,
    status: 'ACTIVE',
    page: 1,
    limit: 1,
  });

  const brandTotal = brandCountData?.total ?? 0;
  const influencerTotal = influencerCountData?.total ?? 0;

  const categories = categoriesData?.items || [];
  const totalCategories = categoriesData?.total ?? categories.length;

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const setArchivedMutation = useSetCategoryArchived();
  const deleteCategoryMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);

  const [categoryType, setCategoryType] = useState<CategoryType>(CategoryTypeCode.BRAND);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

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
    const nErr = validateCategoryName(trimmedName, {
      required: true,
      fieldLabel: 'Category name',
      max: 100,
    });
    if (nErr) {
      setNameError(nErr);
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
        showSuccess(
          `${categoryType === CategoryTypeCode.BRAND ? 'Brand' : 'Influencer'} category created.`,
        );
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

  const handleSetArchived = async (row: CategoryResponse, archived: boolean) => {
    setArchivingId(row.id);
    try {
      await setArchivedMutation.mutateAsync({ id: row.id, archived });
      showSuccess(archived ? 'Category archived.' : 'Category restored.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          `Failed to ${archived ? 'archive' : 'restore'} category.`,
      );
    } finally {
      setArchivingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCategoryId) return;
    try {
      await deleteCategoryMutation.mutateAsync(deleteCategoryId);
      showSuccess('Category deleted.');
      setDeleteCategoryId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to delete category.',
      );
    }
  };

  const categoryToDelete = categories.find((c) => c.id === deleteCategoryId);

  const columns: Array<DataTableColumn<CategoryResponse>> = [
    {
      id: 'name',
      header: 'Category Name',
      type: 'entity',
      accessor: (row) => row.name,
      subAccessor: (row) =>
        row.type === CategoryTypeCode.BRAND
          ? 'Brand Industry Classification'
          : 'Creator Niche / Specialization',
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
      accessor: (row) => (row.isArchived ? 'ARCHIVED' : 'ACTIVE'),
    },
    {
      id: 'createdOn',
      header: 'Created Date (DD/MM/YYYY)',
      type: 'date',
      accessor: (row) => new Date(row.createdOn).toLocaleDateString('en-IN'),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <CategoryRowActions
          row={row}
          busy={archivingId === row.id}
          onEdit={handleOpenEdit}
          onSetArchived={(r, archived) => void handleSetArchived(r, archived)}
          onDelete={(r) => setDeleteCategoryId(r.id)}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<CategoryResponse[]> => {
    const res = await apiClient.get<PaginatedResult<CategoryResponse>>('/categories', {
      params: {
        type: activeTab,
        search: debouncedSearch.trim() || undefined,
        status: activeStatus,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, exportPdf, isExporting } = useTableExport({
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
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Add
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Add Category
          </Box>
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
              backgroundColor:
                activeTab === CategoryTypeCode.BRAND ? theme.palette.tokens.rail : 'transparent',
              color:
                activeTab === CategoryTypeCode.BRAND
                  ? '#FFFFFF'
                  : theme.palette.tokens.textSecondary,
              fontWeight: 600,
              fontSize: { xs: '12px', sm: theme.typography.body2.fontSize },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.75, sm: 1.25 },
              transition: 'all 0.2s ease',
              '&:hover': {
                color:
                  activeTab === CategoryTypeCode.BRAND
                    ? '#FFFFFF'
                    : theme.palette.tokens.textPrimary,
                backgroundColor:
                  activeTab === CategoryTypeCode.BRAND
                    ? theme.palette.tokens.rail
                    : theme.palette.tokens.fieldBg,
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
                  activeTab === CategoryTypeCode.BRAND
                    ? 'rgba(255,255,255,0.2)'
                    : theme.palette.tokens.fieldBg,
                color:
                  activeTab === CategoryTypeCode.BRAND
                    ? '#FFFFFF'
                    : theme.palette.tokens.textPrimary,
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
                activeTab === CategoryTypeCode.INFLUENCER
                  ? theme.palette.tokens.rail
                  : 'transparent',
              color:
                activeTab === CategoryTypeCode.INFLUENCER
                  ? '#FFFFFF'
                  : theme.palette.tokens.textSecondary,
              fontWeight: 600,
              fontSize: { xs: '12px', sm: theme.typography.body2.fontSize },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.75, sm: 1.25 },
              transition: 'all 0.2s ease',
              '&:hover': {
                color:
                  activeTab === CategoryTypeCode.INFLUENCER
                    ? '#FFFFFF'
                    : theme.palette.tokens.textPrimary,
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
          searchPlaceholder="Search"
          pills={statusPillOptions}
          activePillId={statusFilter || 'ALL'}
          onPillChange={setStatusFilter}
          onExport={exportExcel}
          onExportPdf={exportPdf}
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
                <MenuItem value={CategoryTypeCode.INFLUENCER}>Influencer Category (Niche)</MenuItem>
              </TextField>

              <TextField
                label="Category Name *"
                value={name}
                onChange={(e) => {
                  const val = capitalizeWords(e.target.value);
                  setName(val);
                  if (nameError) {
                    setNameError(
                      validateCategoryName(val, {
                        required: true,
                        fieldLabel: 'Category name',
                        max: 100,
                      }),
                    );
                  }
                }}
                onBlur={(e) => {
                  setNameError(
                    validateCategoryName(e.target.value, {
                      required: true,
                      fieldLabel: 'Category name',
                      max: 100,
                    }),
                  );
                }}
                error={Boolean(nameError)}
                helperText={
                  nameError ||
                  (categoryType === CategoryTypeCode.BRAND
                    ? 'e.g. Fashion & Apparel, Skincare, Technology & Electronics'
                    : 'e.g. Fashion Lifestyle, Tech Reviewer, Fitness & Wellness')
                }
                placeholder={
                  categoryType === CategoryTypeCode.BRAND
                    ? 'e.g. Beauty & Personal Care'
                    : 'e.g. Food Vlogger'
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
        open={Boolean(deleteCategoryId)}
        title="Delete Category?"
        body={`Delete "${categoryToDelete?.name || 'this category'}"? This removes it from the platform. To retire it from the dropdowns while keeping the brands and creators classified under it readable, archive it instead.`}
        confirmText="Delete Category"
        variant="destructive"
        loading={deleteCategoryMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCategoryId(null)}
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
        badge={selectedCategory?.isArchived ? 'ARCHIVED' : 'ACTIVE'}
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
                value: selectedCategory?.isArchived
                  ? 'Archived (not offered in dropdowns)'
                  : 'Active (In Use)',
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
