import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar, CreateInfluencerDialog, OverviewDrawer } from '@molecules';
import { useAdminInfluencers, useAdminAgencies, useAdminCreateInfluencer } from '@api';
import { InfluencerResponse, CreateInfluencerRequest } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';

/** "64.7k" reads better than "64700" in a directory of reach numbers. */
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

export const AdminInfluencersOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const createInfluencerMutation = useAdminCreateInfluencer();

  const {
    search,
    setSearch,
    selectedSelect: selectedAgencyFilter,
    setSelectedSelect: setSelectedAgencyFilter,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('adminInfluencers');
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: influencersData,
    isLoading,
    isFetching,
  } = useAdminInfluencers({
    agencyId: selectedAgencyFilter || undefined,
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const { data: agenciesData } = useAdminAgencies();

  const influencers = influencersData?.items || [];
  const totalInfluencers = influencersData?.total ?? influencers.length;
  const agencies = agenciesData?.items || [];

  const agencyOptions = [
    { value: '', label: 'All Agencies' },
    ...agencies.map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleCreateInfluencer = async (data: CreateInfluencerRequest) => {
    try {
      await createInfluencerMutation.mutateAsync(data);
      showSuccess('Creator added to the directory.');
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add creator.');
    }
  };

  const columns: Array<DataTableColumn<InfluencerResponse>> = [
    {
      id: 'name',
      header: 'Name',
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
      subtitle="Creator directory with reach, niche, and indicative commercials"
      navItems={navConfig.ADMIN}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Platform Administrator',
        email: user?.email,
        roleCode: 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon fontSize="small" />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Creator
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          selectOptions={agencyOptions}
          selectedOption={selectedAgencyFilter}
          onSelectChange={setSelectedAgencyFilter}
          selectLabel="Filter by Agency"
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

      {/* Creator Overview Drawer */}
      <OverviewDrawer
        open={Boolean(selectedInfluencer)}
        onClose={() => setSelectedInfluencer(null)}
        title={selectedInfluencer?.name || 'Creator Overview'}
        subtitle={
          selectedInfluencer
            ? `Category: ${selectedInfluencer.category || 'Creator'} · ${selectedInfluencer.location || 'Global'}`
            : undefined
        }
        badge={selectedInfluencer?.category || 'CREATOR'}
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
                  value: formatCommercials(selectedInfluencer) === '—' ? 'Not quoted' : `₹${formatCommercials(selectedInfluencer)}`,
                  tint: 'mint',
                },
              ]
            : []
        }
        sections={
          selectedInfluencer
            ? [
                {
                  title: 'Creator Profile',
                  fields: [
                    { label: 'Creator Name', value: selectedInfluencer.name },
                    { label: 'Category / Niche', value: selectedInfluencer.category || '—' },
                    { label: 'Location', value: selectedInfluencer.location || 'Global' },
                    { label: 'Creator ID', value: selectedInfluencer.id, copyable: true },
                  ],
                },
                {
                  title: 'Contact & Socials',
                  fields: [
                    { label: 'Contact Phone', value: selectedInfluencer.contactPhone || '—' },
                    {
                      label: 'Instagram',
                      value: selectedInfluencer.instagram ? `@${selectedInfluencer.instagram}` : '—',
                      isLink: Boolean(selectedInfluencer.instagram),
                      href: selectedInfluencer.instagram
                        ? (selectedInfluencer.instagram.startsWith('http')
                            ? selectedInfluencer.instagram
                            : `https://instagram.com/${selectedInfluencer.instagram.replace(/^@/, '')}`)
                        : undefined,
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
          selectedInfluencer
            ? [
                {
                  label: 'Copy Creator ID',
                  onClick: () => {
                    navigator.clipboard.writeText(selectedInfluencer.id);
                    showSuccess('Creator ID copied to clipboard');
                  },
                },
              ]
            : []
        }
      />
    </DashboardLayout>
  );
};
