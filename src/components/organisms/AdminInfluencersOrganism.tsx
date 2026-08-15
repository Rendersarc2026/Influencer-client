import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { useAdminInfluencers, useAdminAgencies } from '@api';
import { InfluencerResponse } from '@contracts';
import { useAuth, useDebounce, useViewFilters } from '@hooks';

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
          fillHeight
        />
      </Box>
    </DashboardLayout>
  );
};
