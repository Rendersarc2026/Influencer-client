import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
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
import { useAgencyInfluencers, useCreateInfluencer } from '@api';
import { InfluencerResponse, CreateInfluencerRequest } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

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

export const AgencyInfluencersOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const createInfluencerMutation = useCreateInfluencer();

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

  const activeCategory = categoryFilter && categoryFilter !== 'ALL' ? categoryFilter : undefined;

  // The creators this agency represents — the same set the assign-to-campaign
  // picker offers. A creator joins it by being entered here, not by being
  // assigned to something.
  const {
    data: influencersData,
    isLoading,
    isFetching,
  } = useAgencyInfluencers({
    search: debouncedSearch.trim() || undefined,
    category: activeCategory,
    location: locationFilter || undefined,
    page: page + 1, // the API pages from 1, the table from 0
    limit: rowsPerPage,
  });

  // The unfiltered set, purely to build the filter options from real data —
  // deriving them from the paged results would limit the choices to whatever
  // happens to be on the current page, and deriving them from the filtered
  // results would make each choice erase the others.
  const { data: allCreatorsData } = useAgencyInfluencers();
  const allCreators = useMemo(() => allCreatorsData?.items ?? [], [allCreatorsData]);

  const influencers = influencersData?.items || [];
  const totalInfluencers = influencersData?.total ?? influencers.length;

  const categoryPills = useMemo(() => {
    const values = [...new Set(allCreators.map((c) => c.category).filter(Boolean))].sort();
    return [
      { id: 'ALL', label: 'All Influencers' },
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
      showSuccess('Creator added to your roster.');
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add creator.');
    }
  };

  const columns: Array<DataTableColumn<InfluencerResponse>> = [
    {
      id: 'name',
      header: 'Creator',
      type: 'entity',
      accessor: (row) => row.name,
      subAccessor: (row) => row.instagram || row.youtube || '—',
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
      header: 'Followers',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatFollowers(row.followers)}
        </Typography>
      ),
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
          Add Influencer
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
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
                    { label: 'Location', value: selectedInfluencer.location || 'Global' },
                    {
                      label: 'Follower Reach',
                      value: formatFollowers(selectedInfluencer.followers),
                    },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    { label: 'Contact Email', value: selectedInfluencer.email || '—' },
                    { label: 'Contact Phone', value: selectedInfluencer.contactPhone || '—' },
                    {
                      label: 'Instagram',
                      value: selectedInfluencer.instagram
                        ? `@${selectedInfluencer.instagram}`
                        : '—',
                      isLink: Boolean(selectedInfluencer.instagram),
                      href: instagramHref(selectedInfluencer.instagram),
                    },
                    {
                      label: 'YouTube Channel',
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
          selectedInfluencer?.email
            ? [
                {
                  label: 'Copy Email',
                  onClick: () => {
                    navigator.clipboard.writeText(selectedInfluencer.email!);
                    showSuccess('Email copied to clipboard');
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
