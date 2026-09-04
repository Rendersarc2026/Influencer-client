import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import Alert from '@mui/material/Alert';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { FilterBar, CreateInfluencerDialog, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading, EmptyState, LoadingBlock } from '@atoms';
import {
  useAgencyCampaign,
  useCampaignInfluencers,
  useAddInfluencerToCampaign,
  useRemoveInfluencerFromCampaign,
  useAgencyInfluencers,
  useInfluencerFilterOptions,
  useCreateInfluencer,
  useCategories,
  useLocations,
  useInfluencerEngagement,
} from '@api';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import {
  safeImageUrl,
  safeExternalUrl,
  getInfluencerTier,
  getTierInfo,
  formatFollowersDisplay,
} from '@utils';
import {
  AgencyMapperResponse,
  CreateInfluencerRequest,
  InfluencerResponse,
  CategoryTypeCode,
  CampaignStatusCode,
  CampaignStatusName,
} from '@contracts';

interface AvailableCreator {
  id: string;
  name: string;
  handle: string;
  category: string;
  followers: string;
  tier?: string;
  avatarUrl?: string;
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

function toAvailableCreator(influencer: InfluencerResponse): AvailableCreator {
  const tier = getInfluencerTier(influencer.followers);
  const tierInfo = getTierInfo(tier);
  return {
    id: influencer.id,
    name: influencer.name,
    handle: formatDisplaySocial(influencer.instagram || influencer.youtube),
    category: influencer.category || 'Uncategorized',
    followers: formatFollowersDisplay(influencer.followers),
    tier: tierInfo?.label,
  };
}

export const AgencyAddInfluencerOrganism: React.FC = () => {
  const theme = useTheme();
  const { id: campaignId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: campaign } = useAgencyCampaign(campaignId);
  const { data: currentMappersData } = useCampaignInfluencers(campaignId);
  const currentMappers: AgencyMapperResponse[] = currentMappersData?.items || [];
  const addInfluencerMutation = useAddInfluencerToCampaign(campaignId);
  const removeInfluencerMutation = useRemoveInfluencerFromCampaign(campaignId);

  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('');

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
  } = useViewFilters('agencyAddInfluencer');
  const debouncedSearch = useDebounce(search, 300);

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

  // The creators this agency represents — the only ones it can staff a campaign
  // with. Someone new is entered from the Creators screen first.
  const { data: influencersData, isLoading: influencersLoading } = useAgencyInfluencers({
    search: debouncedSearch.trim() || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    locations: selectedLocations.length > 0 ? selectedLocations : undefined,
    minPrice,
    maxPrice,
    page: page + 1, // the API pages from 1, TablePagination from 0
    limit: rowsPerPage,
  });

  // The unfiltered set to complement DB categories and build location filter options
  // Distinct values from the database rather than every creator row fetched
  // and de-duplicated here.
  const { data: filterOptions } = useInfluencerFilterOptions();

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

  const createInfluencerMutation = useCreateInfluencer();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deliverablesMap, setDeliverablesMap] = useState<Record<string, string>>({});
  /**
   * Creators assigned during this visit, mapped to the assignment id the add
   * returned. Removing needs that id, and the campaign's own mapper list has
   * not necessarily refetched yet at the moment the row becomes removable.
   */
  const [addedMappers, setAddedMappers] = useState<Record<string, string>>({});
  /**
   * Creators unassigned during this visit. `currentMappers` can still carry a
   * just-removed row until its refetch lands, so this keeps the row from
   * flicking back to "Assigned" in between.
   */
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  /**
   * Which rows have a request in flight, tracked per creator.
   *
   * `useMutation` keeps the state of one mutation at a time, so reading its
   * `variables` to decide which row is busy broke as soon as a second row was
   * clicked: `variables` switched to the new creator, the first row lost its
   * spinner and fell back to "Add to Campaign" while its request was still
   * running. Rows are independent, so their pending state has to be too.
   */
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [removeDialogCreator, setRemoveDialogCreator] = useState<AvailableCreator | null>(null);
  const [detailCreator, setDetailCreator] = useState<InfluencerResponse | null>(null);
  const { data: creatorEngagement } = useInfluencerEngagement(detailCreator?.id);

  /** The assignment id for a creator, from this visit's adds or the server list. */
  const mapperIdFor = (creatorId: string): string | undefined =>
    addedMappers[creatorId] ?? currentMappers.find((m) => m.influencerId === creatorId)?.id;

  const isAssigned = (creatorId: string): boolean =>
    !removedIds.has(creatorId) && Boolean(mapperIdFor(creatorId));

  // Kept as the full records, not just the row-display shape, so the details
  // drawer has every field without a second lookup.
  const creators = influencersData?.items || [];
  const totalCreators = influencersData?.total ?? creators.length;

  // Narrowing the results while on a later page would otherwise land on a page
  // that no longer exists, showing an empty list with no way to tell why.
  const goToFirstPage =
    <T,>(apply: (value: T) => void) =>
    (value: T) => {
      apply(value);
      setPage(0);
    };

  // Removing the last creator on the final page leaves the same dead end.
  useEffect(() => {
    if (totalCreators > 0 && page > 0 && page * rowsPerPage >= totalCreators) {
      setPage(0);
    }
  }, [totalCreators, page, rowsPerPage, setPage]);

  const clearPending = (creatorId: string) =>
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(creatorId);
      return next;
    });

  const handleAddCreator = async (creatorId: string) => {
    // A second click while the first is still running would assign twice.
    if (pendingIds.has(creatorId) || isAssigned(creatorId)) return;

    const deliverables = deliverablesMap[creatorId] || '1x Instagram Reel + 2x Stories';
    setPendingIds((prev) => new Set(prev).add(creatorId));
    try {
      const mapper = await addInfluencerMutation.mutateAsync({
        influencerId: creatorId,
        deliverables,
      });
      showSuccess('Influencer assigned to campaign roster.');
      setAddedMappers((prev) => ({ ...prev, [creatorId]: mapper.id }));
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(creatorId);
        return next;
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to assign influencer.',
      );
    } finally {
      clearPending(creatorId);
    }
  };

  const handleRemoveCreator = async () => {
    const creator = removeDialogCreator;
    if (!creator) return;
    const mapperId = mapperIdFor(creator.id);
    if (!mapperId) return;

    setRemoveDialogCreator(null);
    setPendingIds((prev) => new Set(prev).add(creator.id));
    try {
      await removeInfluencerMutation.mutateAsync(mapperId);
      showSuccess(`${creator.name} removed from the campaign.`);
      setRemovedIds((prev) => new Set(prev).add(creator.id));
      setAddedMappers((prev) => {
        const next = { ...prev };
        delete next[creator.id];
        return next;
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to remove influencer.',
      );
    } finally {
      clearPending(creator.id);
    }
  };

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

  return (
    <DashboardLayout
      title="Add Influencers to Campaign"
      subtitle={
        campaign
          ? `Assigning influencers from your roster to ${campaign.name}`
          : 'Your influencer roster'
      }
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      breadcrumbs={[
        { label: 'Campaigns', path: '/agency/campaigns' },
        { label: campaign?.name || 'Campaign', path: `/agency/campaigns/${campaignId}` },
      ]}
      onBack={() => navigate(`/agency/campaigns/${campaignId}`)}
      backLabel="Back to Campaign"
      rightAction={
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={() => setCreateDialogOpen(true)}
        >
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            New
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            New Influencer
          </Box>
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {campaign && campaign.status !== CampaignStatusCode.DRAFT && (
          <Alert severity="warning" sx={{ borderRadius: `${theme.customRadii.inner}px` }}>
            Influencers can only be added to campaigns in <strong>Draft</strong> status. This
            campaign is currently{' '}
            <strong>{CampaignStatusName[campaign.status] || 'Not in Draft'}</strong>.
          </Alert>
        )}

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

        <SectionHeading
          title="Influencer Directory"
          subtitle="Select influencers and specify required campaign deliverables — assigning someone new adds them to your roster"
        />

        {!influencersLoading && creators.length === 0 && (
          <EmptyState
            icon={<PersonSearchRoundedIcon sx={{ fontSize: 40 }} />}
            title="No influencers found"
            description={
              debouncedSearch.trim()
                ? 'No influencers match your search. Try a different name, category or location.'
                : 'There are no influencers on the platform yet. Add one to get started.'
            }
          />
        )}

        {influencersLoading ? (
          <LoadingBlock variant="roster" rows={Math.min(rowsPerPage, 6)} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {creators.map((influencer) => {
              const creator = toAvailableCreator(influencer);
              const assigned = isAssigned(creator.id);
              const isPending = pendingIds.has(creator.id);

              return (
                <Card
                  key={creator.id}
                  sx={{
                    padding: { xs: '14px', sm: '20px' },
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: theme.palette.tokens.surface,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                    boxShadow: 'none',
                    display: 'flex',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Creator Bio */}
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailCreator(influencer)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailCreator(influencer);
                      }
                    }}
                    aria-label={`View details for ${creator.name}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      minWidth: { xs: '100%', sm: 240 },
                      cursor: 'pointer',
                      borderRadius: `${theme.customRadii.inner}px`,
                      padding: '4px 8px',
                      margin: '-4px -8px',
                      '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
                    }}
                  >
                    <Avatar
                      src={safeImageUrl(creator.avatarUrl)}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: theme.palette.tokens.rail,
                        color: theme.palette.tints.butter,
                        fontWeight: 700,
                      }}
                    >
                      {creator.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {creator.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                      >
                        {creator.handle} · {creator.followers} followers{' '}
                        {creator.tier ? `(${creator.tier})` : ''}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.accent, fontWeight: 600 }}
                      >
                        {creator.category}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Deliverables Input */}
                  <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 220 } }}>
                    <TextField
                      size="small"
                      label="Requested Deliverables"
                      placeholder="e.g. 1x Reel + 2x Stories"
                      value={deliverablesMap[creator.id] ?? '1x Instagram Reel + 2x Stories'}
                      onChange={(e) =>
                        setDeliverablesMap({ ...deliverablesMap, [creator.id]: e.target.value })
                      }
                      disabled={assigned || isPending}
                      fullWidth
                    />
                  </Box>

                  {/* Add Action */}
                  <Box
                    sx={{
                      minWidth: { xs: '100%', sm: 160 },
                      display: 'flex',
                      justifyContent: { xs: 'stretch', sm: 'flex-end' },
                      gap: 1,
                    }}
                  >
                    {assigned ? (
                      <>
                        <Button
                          variant="outlined"
                          disabled
                          startIcon={<CheckRoundedIcon fontSize="small" />}
                          sx={{
                            color: theme.palette.tokens.positive,
                            borderColor: theme.palette.tokens.divider,
                          }}
                        >
                          Assigned
                        </Button>
                        <Tooltip title="Remove from campaign">
                          <span>
                            <IconButton
                              onClick={() => setRemoveDialogCreator(creator)}
                              disabled={isPending}
                              aria-label={`Remove ${creator.name} from campaign`}
                              sx={{
                                border: `1px solid ${theme.palette.tokens.divider}`,
                                '&:hover': { color: theme.palette.tokens.negative },
                              }}
                            >
                              {isPending ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <PersonRemoveRoundedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<PersonAddRoundedIcon fontSize="small" />}
                        onClick={() => handleAddCreator(creator.id)}
                        disabled={
                          isPending ||
                          (campaign !== undefined &&
                            campaign !== null &&
                            campaign.status !== CampaignStatusCode.DRAFT)
                        }
                      >
                        {isPending ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Add to Campaign'
                        )}
                      </Button>
                    )}
                  </Box>
                </Card>
              );
            })}
          </Box>
        )}

        {totalCreators > 0 && (
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 20, 30]}
            count={totalCreators}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Influencers per page"
            sx={{
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
              // The list is cards rather than a table, so the bar supplies its
              // own top rule the way DataTable's pinned footer does.
              '& .MuiTablePagination-toolbar': { paddingLeft: 0 },
            }}
          />
        )}
      </Box>

      {/* Creator Details */}
      <OverviewDrawer
        open={Boolean(detailCreator)}
        onClose={() => setDetailCreator(null)}
        title={detailCreator?.name || 'Creator Overview'}
        subtitle={
          detailCreator
            ? `Category: ${detailCreator.category || 'Creator'} · ${detailCreator.location || 'Global'}`
            : undefined
        }
        badge={detailCreator?.category || 'CREATOR'}
        avatarText={detailCreator?.name}
        highlights={
          detailCreator
            ? [
                {
                  label: 'Follower Reach',
                  value: formatFollowersDisplay(detailCreator.followers),
                  tint: 'sky',
                },
                {
                  label: 'On This Campaign',
                  value: isAssigned(detailCreator.id) ? 'Assigned' : 'Not assigned',
                  tint: isAssigned(detailCreator.id) ? 'mint' : 'sky',
                },
                ...(creatorEngagement?.latest?.engagementRate !== undefined &&
                creatorEngagement?.latest?.engagementRate !== null
                  ? [
                      {
                        label: 'Pre-Eval ER %',
                        value: `${creatorEngagement.latest.engagementRate.toFixed(2)}%`,
                        tint: 'butter' as const,
                      },
                    ]
                  : []),
                ...(creatorEngagement?.latest?.avgViews !== undefined &&
                creatorEngagement?.latest?.avgViews !== null &&
                creatorEngagement.latest.avgViews > 0
                  ? [
                      {
                        label: 'Committed Views',
                        value: formatFollowersDisplay(creatorEngagement.latest.avgViews),
                        tint: 'lavender' as const,
                      },
                    ]
                  : []),
              ]
            : []
        }
        sections={
          detailCreator
            ? [
                ...(creatorEngagement?.latest
                  ? [
                      {
                        title: 'Pre-Evaluation & Engagement Metrics',
                        fields: [
                          {
                            label: 'Baseline Engagement Rate (ER)',
                            value: `${creatorEngagement.latest.engagementRate.toFixed(2)}%`,
                          },
                          {
                            label: 'Average Reel Views',
                            value: creatorEngagement.latest.avgViews
                              ? creatorEngagement.latest.avgViews.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Average Likes per Post',
                            value: creatorEngagement.latest.avgLikes
                              ? creatorEngagement.latest.avgLikes.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Average Comments per Post',
                            value: creatorEngagement.latest.avgComments
                              ? creatorEngagement.latest.avgComments.toLocaleString()
                              : '—',
                          },
                          {
                            label: 'Analyzed Posts Count',
                            value: creatorEngagement.latest.postsCount
                              ? `${creatorEngagement.latest.postsCount} posts`
                              : '—',
                          },
                        ],
                      },
                    ]
                  : []),
                {
                  title: 'Influencer Profile',
                  fields: [
                    { label: 'Influencer Name', value: detailCreator.name },
                    { label: 'Category / Niche', value: detailCreator.category || '—' },
                    {
                      label: 'Influencer Tier',
                      value: getTierInfo(getInfluencerTier(detailCreator.followers))
                        ? `${getTierInfo(getInfluencerTier(detailCreator.followers))?.label} (${getTierInfo(getInfluencerTier(detailCreator.followers))?.rangeLabel})`
                        : '—',
                    },
                    { label: 'Location', value: detailCreator.location || 'Global' },
                    {
                      label: 'Influencing Regions',
                      value:
                        (detailCreator.regions && detailCreator.regions.length > 0) ||
                        (detailCreator.influencingRegions &&
                          detailCreator.influencingRegions.length > 0) ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {(detailCreator.regions || detailCreator.influencingRegions || []).map(
                              (r) => (
                                <Chip key={r} label={r} size="small" />
                              ),
                            )}
                          </Box>
                        ) : (
                          '—'
                        ),
                      fullWidth: true,
                    },
                    {
                      label: 'Follower Reach',
                      value: formatFollowersDisplay(detailCreator.followers),
                    },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    {
                      label: 'Contact Email',
                      value: detailCreator.email || '—',
                      copyable: Boolean(detailCreator.email),
                    },
                    {
                      label: 'Contact Phone',
                      value: detailCreator.contactPhone || '—',
                      copyable: Boolean(detailCreator.contactPhone),
                    },
                    {
                      label: 'Instagram Profile URL',
                      value: detailCreator.instagram || '—',
                      isLink: Boolean(detailCreator.instagram),
                      href: safeExternalUrl(
                        detailCreator.instagram
                          ? detailCreator.instagram.startsWith('http')
                            ? detailCreator.instagram
                            : `https://instagram.com/${detailCreator.instagram.replace(/^@/, '')}`
                          : undefined,
                      ),
                    },
                    {
                      label: 'YouTube Channel URL',
                      value: detailCreator.youtube || '—',
                      isLink: Boolean(detailCreator.youtube),
                      href: safeExternalUrl(detailCreator.youtube),
                    },
                  ],
                },
                {
                  title: 'Commercial Rates',
                  fields: [
                    {
                      label: 'Minimum Rate',
                      value: detailCreator.avgCommercialMin,
                      isMoney: true,
                      currency: detailCreator.currency || 'INR',
                    },
                    {
                      label: 'Maximum Rate',
                      value: detailCreator.avgCommercialMax,
                      isMoney: true,
                      currency: detailCreator.currency || 'INR',
                    },
                    { label: 'Currency', value: detailCreator.currency || 'INR' },
                  ],
                },
              ]
            : []
        }
        actions={
          detailCreator
            ? [
                ...(!isAssigned(detailCreator.id)
                  ? [
                      {
                        label: 'Add to Campaign',
                        variant: 'contained' as const,
                        onClick: () => {
                          const id = detailCreator.id;
                          setDetailCreator(null);
                          void handleAddCreator(id);
                        },
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(removeDialogCreator)}
        title="Remove from Campaign?"
        body={`${removeDialogCreator?.name ?? 'This influencer'} will be taken off this campaign. Any rate they submitted is discarded — adding them back starts the rate approval over.`}
        confirmText="Remove Influencer"
        variant="destructive"
        loading={removeInfluencerMutation.isPending}
        onConfirm={handleRemoveCreator}
        onCancel={() => setRemoveDialogCreator(null)}
      />

      <CreateInfluencerDialog
        open={createDialogOpen}
        loading={createInfluencerMutation.isPending}
        onSubmit={handleCreateInfluencer}
        onClose={() => setCreateDialogOpen(false)}
      />
    </DashboardLayout>
  );
};
