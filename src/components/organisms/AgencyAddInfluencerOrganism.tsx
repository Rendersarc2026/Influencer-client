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
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { FilterBar, CreateInfluencerDialog, ConfirmDialog, OverviewDrawer } from '@molecules';
import { SectionHeading, EmptyState } from '@atoms';
import {
  useAgencyCampaign,
  useCampaignInfluencers,
  useAddInfluencerToCampaign,
  useRemoveInfluencerFromCampaign,
  useAgencyInfluencers,
  useCreateInfluencer,
} from '@api';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import { safeImageUrl } from '@utils';
import { AgencyMapperResponse, CreateInfluencerRequest, InfluencerResponse } from '@contracts';

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

interface AvailableCreator {
  id: string;
  name: string;
  handle: string;
  category: string;
  followers: string;
  avatarUrl?: string;
}

function toAvailableCreator(influencer: InfluencerResponse): AvailableCreator {
  return {
    id: influencer.id,
    name: influencer.name,
    handle: influencer.instagram || influencer.youtube || '—',
    category: influencer.category || 'Uncategorized',
    followers: formatFollowers(influencer.followers),
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

  const activeCategory = categoryFilter && categoryFilter !== 'ALL' ? categoryFilter : undefined;

  // The creators this agency represents — the only ones it can staff a campaign
  // with. Someone new is entered from the Creators screen first.
  const { data: influencersData, isLoading: influencersLoading } = useAgencyInfluencers({
    search: debouncedSearch.trim() || undefined,
    category: activeCategory,
    location: locationFilter || undefined,
    page: page + 1, // the API pages from 1, TablePagination from 0
    limit: rowsPerPage,
  });

  // The unfiltered set, purely to build the filter options from real data —
  // deriving them from the paged results would limit the choices to whatever
  // happens to be on the current page, and deriving them from the filtered
  // results would make each choice erase the others.
  const { data: allCreatorsData } = useAgencyInfluencers();
  const allCreators = useMemo(() => allCreatorsData?.items ?? [], [allCreatorsData]);

  const categoryPills = useMemo(() => {
    const values = [...new Set(allCreators.map((c) => c.category).filter(Boolean))].sort();
    return [
      { id: 'ALL', label: 'All Creators' },
      ...values.map((v) => ({ id: v as string, label: v as string })),
    ];
  }, [allCreators]);

  const locationOptions = useMemo(() => {
    const values = [...new Set(allCreators.map((c) => c.location).filter(Boolean))].sort();
    return [
      { value: '', label: 'All Locations' },
      ...values.map((v) => ({ value: v as string, label: v as string })),
    ];
  }, [allCreators]);
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
  const goToFirstPage = <T,>(apply: (value: T) => void) => (value: T) => {
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
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to assign influencer.');
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
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to remove influencer.');
    } finally {
      clearPending(creator.id);
    }
  };

  const handleCreateInfluencer = async (data: CreateInfluencerRequest) => {
    try {
      await createInfluencerMutation.mutateAsync(data);
      showSuccess('Creator added to your roster.');
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add creator.');
    }
  };

  return (
    <DashboardLayout
      title="Add Influencers to Campaign"
      subtitle={
        campaign ? `Assigning creators from your roster to ${campaign.name}` : 'Your creator roster'
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
          New Creator
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          pills={categoryPills}
          activePillId={categoryFilter || 'ALL'}
          onPillChange={goToFirstPage(setCategoryFilter)}
          searchValue={search}
          onSearchChange={goToFirstPage(setSearch)}
          searchPlaceholder="Search by name, category, location or handle"
          selectOptions={locationOptions}
          selectedOption={locationFilter || ''}
          onSelectChange={goToFirstPage(setLocationFilter)}
          selectLabel="Location"
        />

        <SectionHeading
          title="Creator Directory"
          subtitle="Select creators and specify required campaign deliverables — assigning someone new adds them to your roster"
        />

        {!influencersLoading && creators.length === 0 && (
          <EmptyState
            icon={<PersonSearchRoundedIcon sx={{ fontSize: 40 }} />}
            title="No creators found"
            description={
              debouncedSearch.trim()
                ? 'No creators match your search. Try a different name, category or location.'
                : 'There are no creators on the platform yet. Add one to get started.'
            }
          />
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {creators.map((influencer) => {
            const creator = toAvailableCreator(influencer);
            const assigned = isAssigned(creator.id);
            const isPending = pendingIds.has(creator.id);

            return (
              <Card
                key={creator.id}
                sx={{
                  padding: '20px',
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.tokens.surface,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 3,
                  flexWrap: 'wrap',
                }}
              >
                {/* Creator Bio — opens the details drawer. The row's other
                    controls are separate targets, so this stays scoped to the
                    identity block rather than the whole card. */}
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
                    minWidth: 260,
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
                      {creator.handle} · {creator.followers} followers
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
                <Box sx={{ flex: 1, minWidth: 240 }}>
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
                  sx={{ minWidth: 160, display: 'flex', justifyContent: 'flex-end', gap: 1 }}
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
                      disabled={isPending}
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
            labelRowsPerPage="Creators per page"
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
                  value: formatFollowers(detailCreator.followers),
                  tint: 'sky',
                },
                {
                  label: 'On This Campaign',
                  value: isAssigned(detailCreator.id) ? 'Assigned' : 'Not assigned',
                  tint: isAssigned(detailCreator.id) ? 'mint' : 'lavender',
                },
              ]
            : []
        }
        sections={
          detailCreator
            ? [
                {
                  title: 'Creator Profile',
                  fields: [
                    { label: 'Creator Name', value: detailCreator.name },
                    { label: 'Category / Niche', value: detailCreator.category || '—' },
                    { label: 'Location', value: detailCreator.location || 'Global' },
                    { label: 'Follower Reach', value: formatFollowers(detailCreator.followers) },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    { label: 'Contact Email', value: detailCreator.email || '—' },
                    { label: 'Contact Phone', value: detailCreator.contactPhone || '—' },
                    {
                      label: 'Instagram',
                      value: detailCreator.instagram ? `@${detailCreator.instagram}` : '—',
                      isLink: Boolean(detailCreator.instagram),
                      href: detailCreator.instagram
                        ? detailCreator.instagram.startsWith('http')
                          ? detailCreator.instagram
                          : `https://instagram.com/${detailCreator.instagram.replace(/^@/, '')}`
                        : undefined,
                    },
                    {
                      label: 'YouTube Channel',
                      value: detailCreator.youtube || '—',
                      isLink: Boolean(detailCreator.youtube),
                      href: detailCreator.youtube || undefined,
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
          detailCreator && !isAssigned(detailCreator.id)
            ? [
                {
                  label: 'Add to Campaign',
                  onClick: () => {
                    const id = detailCreator.id;
                    setDetailCreator(null);
                    void handleAddCreator(id);
                  },
                },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(removeDialogCreator)}
        title="Remove from Campaign?"
        body={`${removeDialogCreator?.name ?? 'This creator'} will be taken off this campaign. Any rate they submitted is discarded — adding them back starts the rate approval over.`}
        confirmText="Remove Creator"
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
