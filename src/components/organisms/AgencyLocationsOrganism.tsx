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
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading } from '@atoms';
import {
  useLocationList,
  useCreateLocation,
  useUpdateLocation,
  useDeactivateLocation,
  apiClient,
} from '@api';
import { LocationResponse, PaginatedResult } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters, useTableExport } from '@hooks';
import { capitalizeWords, ExcelColumnConfig } from '@utils';

/** The server accepts tier 1–5; anything outside that range is rejected. */
const TIER_OPTIONS = [1, 2, 3, 4, 5];

const DEFAULT_COUNTRY = 'India';

interface LocationRowActionsProps {
  row: LocationResponse;
  onEdit: (row: LocationResponse) => void;
  onDeactivate: (row: LocationResponse) => void;
}

const LocationRowActions: React.FC<LocationRowActionsProps> = ({ row, onEdit, onDeactivate }) => {
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
      <Tooltip title="Actions">
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
          <MoreVertRoundedIcon fontSize="small" sx={{ color: theme.palette.tokens.textPrimary }} />
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
            primary="Edit Location"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        {row.isActive && (
          <>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                handleClose();
                onDeactivate(row);
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
                <BlockRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Deactivate Location"
                primaryTypographyProps={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: theme.palette.tokens.negative,
                }}
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export const AgencyLocationsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    search,
    setSearch,
    activePill: statusFilter,
    setActivePill: setStatusFilter,
    selectedSelect: tierFilter,
    setSelectedSelect: setTierFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyLocations');
  const debouncedSearch = useDebounce(search, 300);

  const activeStatus =
    statusFilter === 'ACTIVE' ? true : statusFilter === 'ARCHIVED' ? false : undefined;
  const activeTier = tierFilter ? Number(tierFilter) : undefined;

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isFetching: locationsFetching,
  } = useLocationList({
    search: debouncedSearch.trim() || undefined,
    tier: activeTier,
    isActive: activeStatus,
    page: page + 1,
    limit: rowsPerPage,
  });

  const locations = locationsData?.items || [];
  const totalLocations = locationsData?.total ?? locations.length;

  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deactivateLocationMutation = useDeactivateLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationResponse | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [tier, setTier] = useState('');
  const [nameError, setNameError] = useState('');
  const [deactivateLocationId, setDeactivateLocationId] = useState<string | null>(null);

  const statusPillOptions = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  const tierSelectOptions = [
    { value: '', label: 'All Tiers' },
    ...TIER_OPTIONS.map((t) => ({ value: String(t), label: `Tier ${t}` })),
  ];

  const handleOpenCreate = () => {
    setLocationToEdit(null);
    setName('');
    setState('');
    setCountry(DEFAULT_COUNTRY);
    setTier('');
    setNameError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (loc: LocationResponse) => {
    setLocationToEdit(loc);
    setName(loc.name);
    setState(loc.state || '');
    setCountry(loc.country || DEFAULT_COUNTRY);
    setTier(loc.tier != null ? String(loc.tier) : '');
    setNameError('');
    setDialogOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Location name is required');
      return;
    }

    if (trimmedName.length > 100) {
      setNameError('Location name must be at most 100 characters');
      return;
    }

    const trimmedState = state.trim();
    const trimmedCountry = country.trim();
    const parsedTier = tier ? Number(tier) : undefined;

    try {
      if (locationToEdit) {
        await updateLocationMutation.mutateAsync({
          id: locationToEdit.id,
          data: {
            name: trimmedName,
            state: trimmedState || undefined,
            country: trimmedCountry || undefined,
            tier: parsedTier,
          },
        });
        showSuccess('Location updated successfully.');
      } else {
        await createLocationMutation.mutateAsync({
          name: trimmedName,
          state: trimmedState || undefined,
          country: trimmedCountry || undefined,
          tier: parsedTier,
        });
        showSuccess('Location created.');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to save location.';
      if (msg.toLowerCase().includes('name') || msg.toLowerCase().includes('already exists')) {
        setNameError(msg);
      }
      showError(msg);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateLocationId) return;
    try {
      await deactivateLocationMutation.mutateAsync(deactivateLocationId);
      showSuccess('Location deactivated successfully.');
      setDeactivateLocationId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to deactivate location.',
      );
    }
  };

  const locationToDeactivate = locations.find((l) => l.id === deactivateLocationId);

  // Editing a location that already carries a tier cannot drop back to "no
  // tier": the update contract has no way to express clearing it.
  const tierIsLocked = Boolean(locationToEdit && locationToEdit.tier != null);

  const columns: Array<DataTableColumn<LocationResponse>> = [
    {
      id: 'name',
      header: 'Location',
      type: 'entity',
      accessor: (row) => row.name,
      subAccessor: (row) => row.state || row.country,
    },
    {
      id: 'state',
      header: 'State / Region',
      type: 'text',
      accessor: (row) => row.state || '—',
    },
    {
      id: 'country',
      header: 'Country',
      type: 'text',
      accessor: (row) => row.country,
    },
    {
      id: 'tier',
      header: 'Tier',
      type: 'text',
      render: (row) =>
        row.tier == null ? (
          '—'
        ) : (
          <Chip
            size="small"
            label={`Tier ${row.tier}`}
            sx={{
              fontWeight: 600,
              fontSize: '12px',
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
            }}
          />
        ),
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
        <LocationRowActions
          row={row}
          onEdit={handleOpenEdit}
          onDeactivate={(r) => setDeactivateLocationId(r.id)}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<LocationResponse[]> => {
    const res = await apiClient.get<PaginatedResult<LocationResponse>>('/locations', {
      params: {
        search: debouncedSearch.trim() || undefined,
        tier: activeTier,
        isActive: activeStatus,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, isExporting } = useTableExport({
    filename: 'locations',
    sheetName: 'Locations',
    columns: columns as Array<ExcelColumnConfig<LocationResponse>>,
    rows: locations,
    onExportAll: handleExportAll,
  });

  return (
    <DashboardLayout
      title="Locations"
      subtitle="Manage the master list of cities and regions used across brand, creator and campaign forms"
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
            Add Location
          </Box>
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        {/* FilterBar with Search, Tier Select and Status Pills */}
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search"
          pills={statusPillOptions}
          activePillId={statusFilter || 'ALL'}
          onPillChange={setStatusFilter}
          selectOptions={tierSelectOptions}
          selectedOption={tierFilter}
          onSelectChange={setTierFilter}
          selectLabel="Tier"
          onExport={exportExcel}
          isExporting={isExporting}
          exportDisabled={totalLocations === 0}
        />

        {/* Locations DataTable */}
        <DataTable<LocationResponse>
          columns={columns}
          rows={locations}
          totalRows={totalLocations}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={locationsLoading}
          isFetching={locationsFetching}
          onRowClick={(row) => setSelectedLocation(row)}
          fillHeight
        />
      </Box>

      {/* Add / Edit Location Dialog */}
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
        <form onSubmit={handleSaveLocation}>
          <DialogTitle sx={{ pb: 0, pt: 1, px: 2 }}>
            <SectionHeading
              title={locationToEdit ? 'Edit Location' : 'Add Location'}
              subtitle="City or region offered in location dropdowns and search filters"
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
                label="Location Name *"
                value={name}
                onChange={(e) => {
                  setName(capitalizeWords(e.target.value));
                  if (nameError) setNameError('');
                }}
                error={Boolean(nameError)}
                helperText={nameError || 'City or region name, e.g. Bengaluru'}
                placeholder="e.g. Bengaluru"
                fullWidth
                autoFocus
              />

              <TextField
                label="State / Region"
                value={state}
                onChange={(e) => setState(capitalizeWords(e.target.value))}
                placeholder="e.g. Karnataka"
                fullWidth
                helperText="Optional state or region this location belongs to"
              />

              <TextField
                label="Country"
                value={country}
                onChange={(e) => setCountry(capitalizeWords(e.target.value))}
                placeholder={DEFAULT_COUNTRY}
                fullWidth
                helperText={`Defaults to ${DEFAULT_COUNTRY} when left blank`}
              />

              <TextField
                select
                label="Tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                fullWidth
                helperText={
                  tierIsLocked
                    ? 'A tier can be changed but not removed once set'
                    : 'Optional tier ranking used to group locations'
                }
              >
                {/* The update endpoint accepts a tier of 1-5 or nothing at all,
                    so an existing tier can be moved but never cleared. */}
                <MenuItem value="" disabled={tierIsLocked}>
                  No tier
                </MenuItem>
                {TIER_OPTIONS.map((t) => (
                  <MenuItem key={t} value={String(t)}>
                    {`Tier ${t}`}
                  </MenuItem>
                ))}
              </TextField>
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
                createLocationMutation.isPending ||
                updateLocationMutation.isPending
              }
              sx={{ minWidth: 120 }}
            >
              {createLocationMutation.isPending || updateLocationMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : locationToEdit ? (
                'Save Changes'
              ) : (
                'Create Location'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirm Deactivate Dialog */}
      <ConfirmDialog
        open={Boolean(deactivateLocationId)}
        title="Deactivate Location?"
        body={`Are you sure you want to deactivate "${locationToDeactivate?.name || 'this location'}"? It will no longer appear in active dropdown selections.`}
        confirmText="Deactivate Location"
        variant="destructive"
        loading={deactivateLocationMutation.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateLocationId(null)}
      />

      {/* Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedLocation)}
        onClose={() => setSelectedLocation(null)}
        title={selectedLocation?.name || 'Location Details'}
        subtitle={selectedLocation?.state || selectedLocation?.country || 'Location'}
        badge={selectedLocation?.isActive ? 'ACTIVE' : 'ARCHIVED'}
        sections={[
          {
            title: 'Location Information',
            fields: [
              { label: 'Location Name', value: selectedLocation?.name || '—' },
              { label: 'State / Region', value: selectedLocation?.state || '—' },
              { label: 'Country', value: selectedLocation?.country || '—' },
              {
                label: 'Tier',
                value: selectedLocation?.tier != null ? `Tier ${selectedLocation.tier}` : '—',
              },
              {
                label: 'Status',
                value: selectedLocation?.isActive ? 'Active (In Use)' : 'Archived / Deactivated',
                isStatus: true,
              },
              {
                label: 'Created On',
                value: selectedLocation?.createdOn
                  ? new Date(selectedLocation.createdOn).toLocaleString('en-IN')
                  : '—',
              },
              {
                label: 'Last Updated',
                value: selectedLocation?.updatedOn
                  ? new Date(selectedLocation.updatedOn).toLocaleString('en-IN')
                  : '—',
              },
            ],
          },
        ]}
      />
    </DashboardLayout>
  );
};
