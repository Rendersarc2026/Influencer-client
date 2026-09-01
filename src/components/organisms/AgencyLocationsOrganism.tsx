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
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import UnarchiveRoundedIcon from '@mui/icons-material/UnarchiveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
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
  useSetLocationArchived,
  useDeleteLocation,
  apiClient,
} from '@api';
import {
  LocationResponse,
  PaginatedResult,
  COUNTRIES,
  DEFAULT_COUNTRY,
  ALL_SUBDIVISIONS,
  subdivisionsOf,
  isSubdivisionOf,
} from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters, useTableExport } from '@hooks';
import { capitalizeWords, ExcelColumnConfig } from '@utils';

/** The server accepts tier 1–5; anything outside that range is rejected. */
const TIER_OPTIONS = [1, 2, 3, 4, 5];

interface LocationRowActionsProps {
  row: LocationResponse;
  /** This row's archive/restore is in flight. */
  busy?: boolean;
  onEdit: (row: LocationResponse) => void;
  onSetArchived: (row: LocationResponse, archived: boolean) => void;
  onDelete: (row: LocationResponse) => void;
}

const LocationRowActions: React.FC<LocationRowActionsProps> = ({
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
            primary="Edit Location"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        {/* Archiving retires a location from the dropdowns; deleting removes it.
            They are separate columns, so they are separate actions here too. */}
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
            primary={row.isArchived ? 'Restore Location' : 'Archive Location'}
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
            primary="Delete Location"
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

  // Country and state are the point of the constrained list, so they are
  // filters here as well; they live in local state rather than the persisted
  // view filters, which only carry one select.
  const [countryFilter, setCountryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const activeStatus =
    statusFilter === 'ACTIVE' ? 'ACTIVE' : statusFilter === 'ARCHIVED' ? 'ARCHIVED' : 'ALL';
  const activeTier = tierFilter ? Number(tierFilter) : undefined;

  const listParams = {
    search: debouncedSearch.trim() || undefined,
    tier: activeTier,
    country: countryFilter || undefined,
    state: stateFilter || undefined,
    // Selects on the archive flag. The soft delete is not a view the screen
    // offers: a deleted location is gone, not filed away.
    status: activeStatus,
    isActive: true,
  } as const;

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isFetching: locationsFetching,
  } = useLocationList({
    ...listParams,
    page: page + 1,
    limit: rowsPerPage,
  });

  const locations = locationsData?.items || [];
  const totalLocations = locationsData?.total ?? locations.length;

  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const setArchivedMutation = useSetLocationArchived();
  const deleteLocationMutation = useDeleteLocation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<LocationResponse | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [tier, setTier] = useState('');
  const [nameError, setNameError] = useState('');
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const stateOptions = subdivisionsOf(country || DEFAULT_COUNTRY);

  const statusPillOptions = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  const tierSelectOptions = [
    { value: '', label: 'All Tiers' },
    ...TIER_OPTIONS.map((t) => ({ value: String(t), label: `Tier ${t}` })),
  ];

  const countryFilterOptions = [
    { value: '', label: 'All Countries' },
    ...COUNTRIES.map((c) => ({ value: c, label: c })),
  ];

  // The state list narrows to the chosen country. With no country picked it
  // offers every subdivision rather than nothing — a disabled control reads as
  // broken when the obvious move is to filter by state alone.
  const stateFilterOptions = [
    { value: '', label: 'All States' },
    ...(countryFilter ? subdivisionsOf(countryFilter) : ALL_SUBDIVISIONS)
      .map((st) => ({ value: st, label: st }))
      .sort((a, b) => a.label.localeCompare(b.label)),
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

  /** Changing the country invalidates a state that does not belong to it. */
  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    if (state && !isSubdivisionOf(nextCountry, state)) {
      setState('');
    }
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
    const trimmedCountry = country.trim() || DEFAULT_COUNTRY;
    const parsedTier = tier ? Number(tier) : undefined;

    if (trimmedState && !isSubdivisionOf(trimmedCountry, trimmedState)) {
      showError(`"${trimmedState}" is not a state or region of ${trimmedCountry}.`);
      return;
    }

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

  const handleSetArchived = async (row: LocationResponse, archived: boolean) => {
    setArchivingId(row.id);
    try {
      await setArchivedMutation.mutateAsync({ id: row.id, archived });
      showSuccess(archived ? 'Location archived.' : 'Location restored.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          `Failed to ${archived ? 'archive' : 'restore'} location.`,
      );
    } finally {
      setArchivingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteLocationId) return;
    try {
      await deleteLocationMutation.mutateAsync(deleteLocationId);
      showSuccess('Location deleted.');
      setDeleteLocationId(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to delete location.',
      );
    }
  };

  const locationToDelete = locations.find((l) => l.id === deleteLocationId);

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
      accessor: (row) => (row.isArchived ? 'ARCHIVED' : 'ACTIVE'),
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
          busy={archivingId === row.id}
          onEdit={handleOpenEdit}
          onSetArchived={(r, archived) => void handleSetArchived(r, archived)}
          onDelete={(r) => setDeleteLocationId(r.id)}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<LocationResponse[]> => {
    const res = await apiClient.get<PaginatedResult<LocationResponse>>('/locations', {
      params: listParams,
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
          extraSelects={[
            {
              id: 'country',
              label: 'Country',
              options: countryFilterOptions,
              value: countryFilter,
              onChange: (val) => {
                setCountryFilter(val);
                setStateFilter('');
                setPage(0);
              },
            },
            {
              id: 'state',
              label: 'State / Region',
              options: stateFilterOptions,
              value: stateFilter,
              onChange: (val) => {
                setStateFilter(val);
                setPage(0);
              },
            },
          ]}
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

              {/* Both are picked from the shared geography list rather than typed.
                  These two columns are filtered on, and free text turned one
                  place into several values — "Kerala", "KERALA", "kerala". */}
              <Autocomplete
                options={[...COUNTRIES]}
                value={country || DEFAULT_COUNTRY}
                onChange={(_, newValue) => handleCountryChange(newValue || DEFAULT_COUNTRY)}
                disableClearable
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country *"
                    helperText="The state list follows the country you pick"
                  />
                )}
              />

              <Autocomplete
                options={[...stateOptions]}
                value={state || null}
                onChange={(_, newValue) => setState(newValue || '')}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State / Region"
                    placeholder="Search states"
                    helperText={`Optional. ${stateOptions.length} available in ${country || DEFAULT_COUNTRY}`}
                  />
                )}
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
        open={Boolean(deleteLocationId)}
        title="Delete Location?"
        body={`Delete "${locationToDelete?.name || 'this location'}"? This removes it from the platform. To retire it from the dropdowns while keeping the records that reference it readable, archive it instead.`}
        confirmText="Delete Location"
        variant="destructive"
        loading={deleteLocationMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteLocationId(null)}
      />

      {/* Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedLocation)}
        onClose={() => setSelectedLocation(null)}
        title={selectedLocation?.name || 'Location Details'}
        subtitle={selectedLocation?.state || selectedLocation?.country || 'Location'}
        badge={selectedLocation?.isArchived ? 'ARCHIVED' : 'ACTIVE'}
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
                value: selectedLocation?.isArchived
                  ? 'Archived (not offered in dropdowns)'
                  : 'Active (In Use)',
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
