import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  DataTable,
  DataTableColumn,
  FilterBar,
  CreateInfluencerDialog,
  OverviewDrawer,
} from '@molecules';
import {
  useAgencyInfluencers,
  useCreateInfluencer,
  useCategories,
  useInfluencerEngagement,
  useCalculateInfluencerEngagement,
} from '@api';
import { InfluencerResponse, CreateInfluencerRequest, CategoryTypeCode } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import { getInfluencerTier, getTierInfo } from '@utils';

/** "64.7k" reads better than "64700" in a list of reach numbers. */
function formatFollowers(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(value);
}

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
  return value.startsWith('http') ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
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
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('');
  const createInfluencerMutation = useCreateInfluencer();

  const {
    data: engagementData,
    isLoading: isEngagementLoading,
  } = useInfluencerEngagement(selectedInfluencer?.id);

  const calculateEngagementMutation = useCalculateInfluencerEngagement(selectedInfluencer?.id);

  const handleRecalculateER = async () => {
    try {
      await calculateEngagementMutation.mutateAsync();
      showSuccess('Instagram Engagement Rate recalculated and stored.');
    } catch {
      showError('Failed to recalculate Engagement Rate.');
    }
  };

  const erValue = engagementData?.engagementRate;
  const erLabel =
    erValue !== undefined && erValue !== null ? `${erValue.toFixed(2)}%` : 'Analyzing...';

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

  const selectedCategories = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'ALL') return [];
    return categoryFilter.split(',').map((s) => s.trim()).filter(Boolean);
  }, [categoryFilter]);

  const selectedLocations = useMemo(() => {
    if (!locationFilter || locationFilter === 'ALL') return [];
    return locationFilter.split(',').map((s) => s.trim()).filter(Boolean);
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

  // The unfiltered set to complement DB categories and build location filter options
  const { data: allCreatorsData } = useAgencyInfluencers();
  const allCreators = useMemo(() => allCreatorsData?.items ?? [], [allCreatorsData]);

  const influencers = influencersData?.items || [];
  const totalInfluencers = influencersData?.total ?? influencers.length;

  const categoryOptions = useMemo(() => {
    const dbCategoryNames = dbCategories.map((c) => c.name).filter(Boolean);
    const creatorCategoryNames = allCreators.map((c) => c.category).filter(Boolean) as string[];
    const combined = [...new Set([...dbCategoryNames, ...creatorCategoryNames])].sort();
    return combined.map((v) => ({ value: v, label: v }));
  }, [dbCategories, allCreators]);

  const locationOptions = useMemo(() => {
    const values = [...new Set(allCreators.map((c) => c.location).filter(Boolean))].sort();
    return values.map((v) => ({ value: v as string, label: v as string }));
  }, [allCreators]);

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
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add influencer.');
    }
  };

  const columns: Array<DataTableColumn<InfluencerResponse>> = [
    {
      id: 'name',
      header: 'Influencer',
      type: 'entity',
      accessor: (row) => row.name,
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
              {formatFollowers(row.followers)}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Tooltip title="Message Creator">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/agency/chats?participantId=${row.id}&type=INFLUENCER`);
              }}
              sx={{
                color: theme.palette.tokens.textSecondary,
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              <ChatBubbleOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

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
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Influencer</Box>
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
          isFetching={isFetching}
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
        highlights={
          selectedInfluencer
            ? [
                {
                  label: 'Follower Reach',
                  value: formatFollowers(selectedInfluencer.followers),
                  tint: 'sky',
                },
                {
                  label: 'Engagement Rate (ER)',
                  value: isEngagementLoading ? 'Analyzing...' : erLabel,
                  tint: 'lavender',
                  sublabel:
                    erValue !== undefined && erValue !== null
                      ? erValue >= 4.0
                        ? '🔥 High ER'
                        : erValue >= 2.0
                          ? '✨ Good ER'
                          : '📊 Average ER'
                      : undefined,
                },
                {
                  label: 'Avg Commercials',
                  value:
                    formatCommercials(selectedInfluencer) === '—'
                      ? 'Not quoted'
                      : `${selectedInfluencer.currency} ${formatCommercials(selectedInfluencer)}`,
                  tint: 'mint',
                },
              ]
            : []
        }
        sections={
          selectedInfluencer
            ? [
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
                      label: 'Follower Reach',
                      value: formatFollowers(selectedInfluencer.followers),
                    },
                  ],
                },
                {
                  title: 'Instagram Engagement & Performance',
                  fields: [
                    {
                      label: 'Instagram Profile',
                      value: selectedInfluencer.instagram || '—',
                      isLink: Boolean(selectedInfluencer.instagram),
                      href: instagramHref(selectedInfluencer.instagram),
                    },
                    {
                      label: 'Engagement Rate (ER)',
                      value: (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, color: theme.palette.tokens.purpleText }}
                          >
                            {isEngagementLoading ? 'Analyzing...' : erLabel}
                          </Typography>
                          {erValue !== undefined && erValue !== null && (
                            <Chip
                              label={erValue >= 4.0 ? 'High' : erValue >= 2.0 ? 'Good' : 'Standard'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: theme.palette.tokens.purpleBg,
                                color: theme.palette.tokens.purpleText,
                              }}
                            />
                          )}
                        </Box>
                      ),
                    },
                    {
                      label: 'Avg Likes / Post',
                      value:
                        engagementData?.avgLikes !== null && engagementData?.avgLikes !== undefined
                          ? engagementData.avgLikes.toLocaleString('en-IN')
                          : '—',
                    },
                    {
                      label: 'Avg Comments / Post',
                      value:
                        engagementData?.avgComments !== null &&
                        engagementData?.avgComments !== undefined
                          ? engagementData.avgComments.toLocaleString('en-IN')
                          : '—',
                    },
                    {
                      label: 'Recent Posts Analyzed',
                      value: engagementData?.postsCount ? String(engagementData.postsCount) : '—',
                    },
                    {
                      label: 'Last Analyzed & Stored',
                      value: engagementData?.fetchedAt
                        ? new Date(engagementData.fetchedAt).toLocaleString('en-IN')
                        : 'Auto-calculated',
                    },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    { label: 'Contact Email', value: selectedInfluencer.email || '—' },
                    { label: 'Contact Phone', value: selectedInfluencer.contactPhone || '—' },
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
                      href: selectedInfluencer.youtube || undefined,
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
                  label: calculateEngagementMutation.isPending
                    ? 'Calculating ER...'
                    : 'Recalculate ER',
                  icon: <AutorenewRoundedIcon fontSize="small" />,
                  variant: 'outlined',
                  onClick: handleRecalculateER,
                  disabled: calculateEngagementMutation.isPending,
                },
                {
                  label: 'Message Creator',
                  variant: 'contained',
                  onClick: () => {
                    const id = selectedInfluencer.id;
                    setSelectedInfluencer(null);
                    navigate(`/agency/chats?participantId=${id}&type=INFLUENCER`);
                  },
                },
                ...(selectedInfluencer.email
                  ? [
                      {
                        label: 'Copy Email',
                        onClick: () => {
                          navigator.clipboard.writeText(selectedInfluencer.email!);
                          showSuccess('Email copied to clipboard');
                        },
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
