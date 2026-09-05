import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  DataTable,
  DataTableColumn,
  FilterBar,
  CreateInfluencerDialog,
  EditInfluencerDialog,
  OverviewDrawer,
} from '@molecules';
import {
  apiClient,
  useAgencyInfluencers,
  useInfluencerFilterOptions,
  useCreateInfluencer,
  useUpdateInfluencer,
  useCategories,
  useLocations,
  useInfluencerEngagement,
  useSyncInstagramProfile,
} from '@api';
import {
  InfluencerResponse,
  CreateInfluencerRequest,
  UpdateInfluencerRequest,
  CategoryTypeCode,
  PaginatedResult,
} from '@contracts';
import { useAuth, useDebouncedSearch, useToast, useViewFilters, useTableExport } from '@hooks';
import {
  getInfluencerTier,
  getTierInfo,
  formatFollowersDisplay,
  ExcelColumnConfig,
  safeExternalUrl,
} from '@utils';

interface InfluencerRowActionsProps {
  row: InfluencerResponse;
  syncing: boolean;
  onRefetchInstagram: (row: InfluencerResponse) => void;
  onCalculateER: (row: InfluencerResponse) => void;
  onEdit: (row: InfluencerResponse) => void;
  onMessage: (row: InfluencerResponse) => void;
}

const InfluencerRowActions: React.FC<InfluencerRowActionsProps> = ({
  row,
  syncing,
  onRefetchInstagram,
  onCalculateER,
  onEdit,
  onMessage,
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
      {/* The menu closes the moment an action is picked, so the spinner it
          carries is never actually seen. The trigger itself has to report the
          work — a sync is a Meta round trip and takes a few seconds. */}
      <Tooltip title={syncing ? 'Syncing Instagram data…' : 'Actions'}>
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
          {syncing ? (
            <CircularProgress size={18} sx={{ color: theme.palette.tokens.purpleText }} />
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
              minWidth: 230,
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
            onRefetchInstagram(row);
          }}
          disabled={syncing}
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
          <ListItemIcon sx={{ color: theme.palette.tokens.purpleText, minWidth: 'auto' }}>
            <SyncRoundedIcon
              fontSize="small"
              sx={
                syncing
                  ? {
                      animation: 'spin 1s linear infinite',
                      '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                    }
                  : undefined
              }
            />
          </ListItemIcon>
          <ListItemText
            primary="Sync Live Instagram Data"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            onCalculateER(row);
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
          <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 'auto' }}>
            <CalculateRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Calculate & Assign ER"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            onMessage(row);
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
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Message Influencer"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

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
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Edit Influencer Details"
            primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

/** Indicative range, e.g. "20,000 - 25,000". Blank when a creator has not quoted one. */
function formatCommercials(row: InfluencerResponse): string {
  const { avgCommercialMin: min, avgCommercialMax: max } = row;
  if (min === null && max === null) return '—';
  const fmt = (n: number) => n.toLocaleString('en-IN');
  if (min !== null && max !== null) return `${fmt(min)} - ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

/** An instagram value may be stored as a handle or a full URL. */
function instagramHref(value: string | null): string | undefined {
  if (!value) return undefined;
  const url = value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
  return safeExternalUrl(url);
}

function formatDisplaySocial(urlOrHandle: string | null | undefined): string {
  if (!urlOrHandle) return '—';
  if (urlOrHandle.startsWith('http://') || urlOrHandle.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrHandle);
      const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (path) {
        return `@${path.replace(/^@/, '')}`;
      }
      return parsed.hostname;
    } catch {
      return urlOrHandle;
    }
  }
  return urlOrHandle.startsWith('@') ? urlOrHandle : `@${urlOrHandle}`;
}

export const AgencyInfluencersOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<InfluencerResponse | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const { data: influencerEngagement } = useInfluencerEngagement(selectedInfluencer?.id);
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('');
  const createInfluencerMutation = useCreateInfluencer();
  const updateInfluencerMutation = useUpdateInfluencer();
  const syncInstagramMutation = useSyncInstagramProfile();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const {
    search,
    setSearch,
    activePill: categoryFilter,
    setActivePill: setCategoryFilter,
    selectedSelect: locationFilter,
    setSelectedSelect: setLocationFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('agencyInfluencers');
  const { debounced: debouncedSearch, pending: searchPending } = useDebouncedSearch(search, 300);

  const PRICE_RANGE_OPTIONS = useMemo(
    () => [
      { value: '', label: 'All Commercials' },
      { value: '0-20000', label: 'Under ₹20,000' },
      { value: '20000-35000', label: '₹20,000 - ₹35,000' },
      { value: '35000-50000', label: '₹35,000 - ₹50,000' },
      { value: '50000-100000', label: '₹50,000 - ₹1,00,000' },
      { value: '100000+', label: 'Above ₹1,00,000' },
    ],
    [],
  );

  const { minPrice, maxPrice } = useMemo(() => {
    if (!priceRangeFilter) return { minPrice: undefined, maxPrice: undefined };
    if (priceRangeFilter === '0-20000') return { minPrice: undefined, maxPrice: 20000 };
    if (priceRangeFilter === '20000-35000') return { minPrice: 20000, maxPrice: 35000 };
    if (priceRangeFilter === '35000-50000') return { minPrice: 35000, maxPrice: 50000 };
    if (priceRangeFilter === '50000-100000') return { minPrice: 50000, maxPrice: 100000 };
    if (priceRangeFilter === '100000+') return { minPrice: 100000, maxPrice: undefined };
    return { minPrice: undefined, maxPrice: undefined };
  }, [priceRangeFilter]);

  // All active influencer categories defined in the database (~16 categories)
  const { data: dbCategories = [] } = useCategories(CategoryTypeCode.INFLUENCER);

  // Locations for the filter control, archived ones included: a creator
  // recorded against a location that was later archived still has to be
  // findable. The forms that write new rows use the default, offerable list.
  const { data: dbLocations = [] } = useLocations(undefined, { includeArchived: true });

  const selectedCategories = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'ALL') return [];
    return categoryFilter
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [categoryFilter]);

  const selectedLocations = useMemo(() => {
    if (!locationFilter || locationFilter === 'ALL') return [];
    return locationFilter
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [locationFilter]);

  // The creators this agency represents
  const {
    data: influencersData,
    isLoading,
    isFetching,
  } = useAgencyInfluencers({
    search: debouncedSearch.trim() || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    locations: selectedLocations.length > 0 ? selectedLocations : undefined,
    minPrice,
    maxPrice,
    page: page + 1, // the API pages from 1, the table from 0
    limit: rowsPerPage,
  });

  // The distinct values actually in use, straight from the database. This used
  // to be an unpaginated fetch of every creator row, de-duplicated here, to
  // populate two dropdowns.
  const { data: filterOptions } = useInfluencerFilterOptions();

  const influencers = influencersData?.items || [];
  const totalInfluencers = influencersData?.total ?? influencers.length;

  const categoryOptions = useMemo(() => {
    const dbCategoryNames = dbCategories.map((c) => c.name).filter(Boolean);
    const creatorCategoryNames = filterOptions?.categories ?? [];
    const combined = [...new Set([...dbCategoryNames, ...creatorCategoryNames])].sort();
    return combined.map((v) => ({ value: v, label: v }));
  }, [dbCategories, filterOptions]);

  const locationOptions = useMemo(() => {
    const dbLocationNames = dbLocations.map((l) => l.name).filter(Boolean);
    const creatorLocationNames = filterOptions?.locations ?? [];
    const combined = [...new Set([...dbLocationNames, ...creatorLocationNames])].sort();
    return combined.map((v) => ({ value: v, label: v }));
  }, [dbLocations, filterOptions]);

  const handleRemoveCategory = (catToRemove: string) => {
    const next = selectedCategories.filter((c) => c !== catToRemove);
    setCategoryFilter(next.length > 0 ? next.join(',') : 'ALL');
    setPage(0);
  };

  const handleRemoveLocation = (locToRemove: string) => {
    const next = selectedLocations.filter((l) => l !== locToRemove);
    setLocationFilter(next.length > 0 ? next.join(',') : '');
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setCategoryFilter('ALL');
    setSearch('');
    setLocationFilter('');
    setPriceRangeFilter('');
    setPage(0);
  };

  const hasActiveFilters = Boolean(
    selectedCategories.length > 0 ||
    selectedLocations.length > 0 ||
    search.trim() ||
    priceRangeFilter,
  );

  // Narrowing the results while on a later page would otherwise land on a page
  // that no longer exists, showing an empty table with no way to tell why.
  const goToFirstPage =
    <T,>(apply: (value: T) => void) =>
    (value: T) => {
      apply(value);
      setPage(0);
    };

  useEffect(() => {
    if (totalInfluencers > 0 && page > 0 && page * rowsPerPage >= totalInfluencers) {
      setPage(0);
    }
  }, [totalInfluencers, page, rowsPerPage, setPage]);

  const handleCreateInfluencer = async (data: CreateInfluencerRequest) => {
    try {
      await createInfluencerMutation.mutateAsync(data);
      showSuccess('Influencer added to your roster.');
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to add influencer.',
      );
    }
  };

  const handleEditInfluencer = (influencer: InfluencerResponse) => {
    setEditingInfluencer(influencer);
    setEditDialogOpen(true);
  };

  const handleUpdateInfluencer = async (data: UpdateInfluencerRequest) => {
    if (!editingInfluencer) return;
    try {
      await updateInfluencerMutation.mutateAsync({ id: editingInfluencer.id, data });
      showSuccess('Influencer updated successfully.');
      setEditDialogOpen(false);
      setEditingInfluencer(null);
      if (selectedInfluencer && selectedInfluencer.id === editingInfluencer.id) {
        setSelectedInfluencer(null);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to update influencer.',
      );
    }
  };

  /**
   * Refreshes the profile only. The engagement rate is left exactly as it was:
   * syncing followers used to recalculate ER as a side effect, which moved the
   * pre-eval figure campaigns were quoted against. Use Calculate / Update ER
   * to change that number.
   */
  const handleRefetchInstagramDetails = async (influencer: InfluencerResponse) => {
    try {
      setSyncingId(influencer.id);
      const result = await syncInstagramMutation.mutateAsync(influencer.id);
      const followersText = result.influencer.followers
        ? formatFollowersDisplay(result.influencer.followers)
        : influencer.followers
          ? formatFollowersDisplay(influencer.followers)
          : 'Updated';
      showSuccess(`Synced ${influencer.name} from Meta Instagram API! Followers: ${followersText}`);
      if (selectedInfluencer && selectedInfluencer.id === influencer.id) {
        setSelectedInfluencer((prev) =>
          prev
            ? {
                ...prev,
                followers: result.influencer.followers ?? prev.followers,
                instagram: result.influencer.instagram ?? prev.instagram,
              }
            : null,
        );
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to refetch Instagram details from Meta API.';
      showError(msg);
    } finally {
      setSyncingId(null);
    }
  };

  const columns: Array<DataTableColumn<InfluencerResponse>> = [
    {
      id: 'name',
      header: 'Influencer',
      type: 'entity',
      accessor: (row) => row.name,
      iconAccessor: (row) => row.avatarUrl,
      subAccessor: (row) => formatDisplaySocial(row.instagram || row.youtube),
    },
    {
      id: 'category',
      header: 'Category',
      accessor: (row) => row.category || '—',
    },
    {
      id: 'location',
      header: 'Location',
      accessor: (row) => row.location || '—',
    },
    {
      id: 'followers',
      header: 'Followers / Tier',
      align: 'right',
      render: (row) => {
        const tier = getInfluencerTier(row.followers);
        const tierInfo = getTierInfo(tier);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatFollowersDisplay(row.followers)}
            </Typography>
            {tierInfo && (
              <Chip
                label={tierInfo.label}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: tierInfo.color.bg,
                  color: tierInfo.color.text,
                  border: `1px solid ${tierInfo.color.border}`,
                }}
              />
            )}
          </Box>
        );
      },
    },
    {
      id: 'contactPhone',
      header: 'Contact',
      render: (row) => (
        <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
          {row.contactPhone || '—'}
        </Typography>
      ),
    },
    {
      id: 'commercials',
      header: 'Average Commercials',
      align: 'right',
      render: (row) => (
        <Typography variant="body2">
          {formatCommercials(row) === '—' ? '—' : `${row.currency} ${formatCommercials(row)}`}
        </Typography>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <InfluencerRowActions
          row={row}
          syncing={syncingId === row.id}
          onRefetchInstagram={handleRefetchInstagramDetails}
          onCalculateER={(r) => navigate(`/agency/er-calculator?influencerId=${r.id}`)}
          onEdit={handleEditInfluencer}
          onMessage={(r) => navigate(`/agency/chats?participantId=${r.id}&type=INFLUENCER`)}
        />
      ),
    },
  ];

  const handleExportAll = async (): Promise<InfluencerResponse[]> => {
    const res = await apiClient.get<PaginatedResult<InfluencerResponse>>('/agency/influencers', {
      params: {
        search: debouncedSearch.trim() || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        minPrice,
        maxPrice,
      },
    });
    return res.data.items || [];
  };

  const { exportExcel, exportPdf, isExporting } = useTableExport({
    filename: 'influencers_roster',
    sheetName: 'Influencers',
    columns: columns as Array<ExcelColumnConfig<InfluencerResponse>>,
    rows: influencers,
    onExportAll: handleExportAll,
  });

  return (
    <DashboardLayout
      title="Influencers"
      subtitle="The influencers you represent, with reach, niche and indicative commercials"
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
          onClick={() => setCreateDialogOpen(true)}
        >
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Add
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Add Influencer
          </Box>
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={goToFirstPage(setSearch)}
          searchPlaceholder="Search by name"
          multiSelectOptions={categoryOptions}
          selectedMultiOptions={selectedCategories}
          onMultiSelectChange={goToFirstPage((vals) => {
            setCategoryFilter(vals.length > 0 ? vals.join(',') : 'ALL');
          })}
          multiSelectLabel="Categories"
          secondMultiSelectOptions={locationOptions}
          selectedSecondMultiOptions={selectedLocations}
          onSecondMultiSelectChange={goToFirstPage((vals) => {
            setLocationFilter(vals.length > 0 ? vals.join(',') : '');
          })}
          secondMultiSelectLabel="Location"
          priceRangeOptions={PRICE_RANGE_OPTIONS}
          selectedPriceRange={priceRangeFilter}
          onPriceRangeChange={goToFirstPage(setPriceRangeFilter)}
          priceRangeLabel="Commercials"
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAllFilters}
          onExport={exportExcel}
          onExportPdf={exportPdf}
          isExporting={isExporting}
          exportDisabled={totalInfluencers === 0}
        />

        {hasActiveFilters && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              p: 1.25,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tokens.surface,
              border: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 700 }}
            >
              Active filters:
            </Typography>
            {selectedCategories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                size="small"
                onDelete={() => handleRemoveCategory(cat)}
                sx={{
                  height: 24,
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: theme.palette.tokens.accentBg,
                  color: theme.palette.tokens.accentText,
                }}
              />
            ))}
            {selectedLocations.map((loc) => (
              <Chip
                key={loc}
                label={loc}
                size="small"
                onDelete={() => handleRemoveLocation(loc)}
                sx={{
                  height: 24,
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  color: theme.palette.tokens.textPrimary,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                }}
              />
            ))}
            {priceRangeFilter && (
              <Chip
                label={
                  PRICE_RANGE_OPTIONS.find((p) => p.value === priceRangeFilter)?.label ||
                  priceRangeFilter
                }
                size="small"
                onDelete={() => {
                  setPriceRangeFilter('');
                  setPage(0);
                }}
                sx={{
                  height: 24,
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: theme.palette.tokens.positiveBg,
                  color: theme.palette.tokens.positiveText,
                }}
              />
            )}
            {search.trim() && (
              <Chip
                label={`Search: "${search.trim()}"`}
                size="small"
                onDelete={() => {
                  setSearch('');
                  setPage(0);
                }}
                sx={{ height: 24, fontSize: '11px', fontWeight: 600 }}
              />
            )}
            <Button
              variant="text"
              size="small"
              onClick={handleClearAllFilters}
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: theme.palette.error.main,
                p: 0,
                minWidth: 0,
                textTransform: 'none',
                ml: 0.5,
                '&:hover': { background: 'transparent', textDecoration: 'underline' },
              }}
            >
              Clear all
            </Button>
          </Box>
        )}

        <DataTable<InfluencerResponse>
          columns={columns}
          rows={influencers}
          totalRows={totalInfluencers}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={isLoading}
          isFetching={isFetching || searchPending}
          onRowClick={(row) => setSelectedInfluencer(row)}
          fillHeight
        />
      </Box>

      <CreateInfluencerDialog
        open={createDialogOpen}
        loading={createInfluencerMutation.isPending}
        onSubmit={handleCreateInfluencer}
        onClose={() => setCreateDialogOpen(false)}
      />

      <EditInfluencerDialog
        open={editDialogOpen}
        influencer={editingInfluencer}
        loading={updateInfluencerMutation.isPending}
        onSubmit={handleUpdateInfluencer}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingInfluencer(null);
        }}
      />

      {/* Influencer Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedInfluencer)}
        onClose={() => setSelectedInfluencer(null)}
        title={selectedInfluencer?.name || 'Influencer Overview'}
        subtitle={
          selectedInfluencer
            ? `Category: ${selectedInfluencer.category || 'Influencer'} · ${selectedInfluencer.location || 'Global'}`
            : undefined
        }
        badge={selectedInfluencer?.category || 'INFLUENCER'}
        avatarText={selectedInfluencer?.name}
        avatarUrl={selectedInfluencer?.avatarUrl || undefined}
        highlights={
          selectedInfluencer
            ? [
                {
                  label: 'Follower Reach',
                  value: formatFollowersDisplay(selectedInfluencer.followers),
                  tint: 'sky',
                },
                {
                  label: 'Avg Commercials',
                  value:
                    formatCommercials(selectedInfluencer) === '—'
                      ? 'Not quoted'
                      : `${selectedInfluencer.currency} ${formatCommercials(selectedInfluencer)}`,
                  tint: 'mint',
                },
                ...(influencerEngagement?.latest?.engagementRate !== undefined &&
                influencerEngagement?.latest?.engagementRate !== null
                  ? [
                      {
                        label: 'Pre-Eval ER %',
                        value: `${influencerEngagement.latest.engagementRate.toFixed(2)}%`,
                        tint: 'butter' as const,
                      },
                    ]
                  : []),
                ...(influencerEngagement?.latest?.avgViews !== undefined &&
                influencerEngagement?.latest?.avgViews !== null &&
                influencerEngagement.latest.avgViews > 0
                  ? [
                      {
                        label: 'Committed Views',
                        value: formatFollowersDisplay(influencerEngagement.latest.avgViews),
                        tint: 'lavender' as const,
                      },
                    ]
                  : []),
              ]
            : []
        }
        sections={
          selectedInfluencer
            ? [
                ...(influencerEngagement?.latest
                  ? [
                      {
                        title: 'Pre-Evaluation & Engagement Metrics',
                        fields: [
                          {
                            label: 'Baseline Engagement Rate (ER)',
                            value: `${influencerEngagement.latest.engagementRate.toFixed(2)}%`,
                          },
                          {
                            label: 'Average Reel Views (Committed)',
                            value: influencerEngagement.latest.avgViews
                              ? influencerEngagement.latest.avgViews.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Average Likes per Post',
                            value: influencerEngagement.latest.avgLikes
                              ? influencerEngagement.latest.avgLikes.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Average Comments per Post',
                            value: influencerEngagement.latest.avgComments
                              ? influencerEngagement.latest.avgComments.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Analyzed Posts Count',
                            value: influencerEngagement.latest.postsCount
                              ? `${influencerEngagement.latest.postsCount} posts`
                              : '—',
                          },
                          {
                            label: 'Calculation Source',
                            value:
                              influencerEngagement.latest.source === 'INSTAGRAM_LIVE_API' ||
                              influencerEngagement.latest.source === 'INSTAGRAM_GRAPH_API'
                                ? 'Instagram Profile Fetch'
                                : influencerEngagement.latest.source === 'MANUAL_CALCULATOR'
                                  ? 'Manual ER Calculator'
                                  : influencerEngagement.latest.source,
                          },
                        ],
                      },
                    ]
                  : []),
                {
                  title: 'Influencer Profile',
                  fields: [
                    { label: 'Influencer Name', value: selectedInfluencer.name },
                    { label: 'Category / Niche', value: selectedInfluencer.category || '—' },
                    {
                      label: 'Influencer Tier',
                      value: getTierInfo(getInfluencerTier(selectedInfluencer.followers))
                        ? `${getTierInfo(getInfluencerTier(selectedInfluencer.followers))?.label} (${getTierInfo(getInfluencerTier(selectedInfluencer.followers))?.rangeLabel})`
                        : '—',
                    },
                    { label: 'Location', value: selectedInfluencer.location || 'Global' },
                    {
                      label: 'Influencing Regions',
                      value:
                        (selectedInfluencer.regions && selectedInfluencer.regions.length > 0) ||
                        (selectedInfluencer.influencingRegions &&
                          selectedInfluencer.influencingRegions.length > 0) ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {(
                              selectedInfluencer.regions ||
                              selectedInfluencer.influencingRegions ||
                              []
                            ).map((r) => (
                              <Chip key={r} label={r} size="small" />
                            ))}
                          </Box>
                        ) : (
                          '—'
                        ),
                      fullWidth: true,
                    },
                    {
                      label: 'Follower Reach',
                      value: formatFollowersDisplay(selectedInfluencer.followers),
                    },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    {
                      label: 'Contact Email',
                      value: selectedInfluencer.email || '—',
                      copyable: Boolean(selectedInfluencer.email),
                    },
                    {
                      label: 'Contact Phone',
                      value: selectedInfluencer.contactPhone || '—',
                      copyable: Boolean(selectedInfluencer.contactPhone),
                    },
                    {
                      label: 'Instagram Profile URL',
                      value: selectedInfluencer.instagram || '—',
                      isLink: Boolean(selectedInfluencer.instagram),
                      href: instagramHref(selectedInfluencer.instagram),
                    },
                    {
                      label: 'YouTube Channel URL',
                      value: selectedInfluencer.youtube || '—',
                      isLink: Boolean(selectedInfluencer.youtube),
                      href: safeExternalUrl(selectedInfluencer.youtube),
                    },
                  ],
                },
                {
                  title: 'Commercial Rates',
                  fields: [
                    {
                      label: 'Minimum Rate',
                      value: selectedInfluencer.avgCommercialMin,
                      isMoney: true,
                      currency: selectedInfluencer.currency || 'INR',
                    },
                    {
                      label: 'Maximum Rate',
                      value: selectedInfluencer.avgCommercialMax,
                      isMoney: true,
                      currency: selectedInfluencer.currency || 'INR',
                    },
                    { label: 'Currency', value: selectedInfluencer.currency || 'INR' },
                  ],
                },
              ]
            : []
        }
        actions={
          selectedInfluencer
            ? [
                {
                  label: 'Calculate / Update ER',
                  variant: 'contained',
                  onClick: () => {
                    const infId = selectedInfluencer.id;
                    setSelectedInfluencer(null);
                    navigate(`/agency/er-calculator?influencerId=${infId}`);
                  },
                },
                {
                  label:
                    syncingId === selectedInfluencer.id
                      ? 'Syncing Instagram...'
                      : 'Sync Instagram Data',
                  variant: 'outlined',
                  loading: syncingId === selectedInfluencer.id,
                  onClick: () => {
                    void handleRefetchInstagramDetails(selectedInfluencer);
                  },
                },
                {
                  label: 'Edit Influencer',
                  variant: 'outlined',
                  onClick: () => {
                    const inf = selectedInfluencer;
                    setSelectedInfluencer(null);
                    handleEditInfluencer(inf);
                  },
                },
                {
                  label: 'Message Influencer',
                  variant: 'outlined',
                  onClick: () => {
                    const id = selectedInfluencer.id;
                    setSelectedInfluencer(null);
                    navigate(`/agency/chats?participantId=${id}&type=INFLUENCER`);
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
