import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, ChartCard, DataTable, DataTableColumn, FilterBar } from '@molecules';
import { SectionHeading, MoneyText } from '@atoms';
import { useAgencyCampaigns, useAgencyBrands, useCampaignReports } from '@api';
import { useAuth, useViewFilters, useTableExport } from '@hooks';
import { formatCurrency, ExcelColumnConfig } from '@utils';

interface CampaignMetricRow extends Record<string, unknown> {
  id: string;
  campaignName: string;
  brandName: string;
  influencerCount: number;
  totalClientRate: number;
  totalMargin: number;
  totalReach: number;
  erPercent: number;
}

const compactNumber = (value: number): string =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 2 }).format(value);

export const AgencyReportsOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
  } = useAgencyCampaigns();
  const { data: brandsData } = useAgencyBrands();
  const campaigns = useMemo(() => campaignsData?.items || [], [campaignsData?.items]);
  const brands = useMemo(() => brandsData?.items || [], [brandsData?.items]);

  const campaignIds = useMemo(() => campaigns.map((c) => c.id), [campaigns]);
  const {
    reports,
    isLoading: reportsLoading,
    isFetching: reportsFetching,
  } = useCampaignReports(campaignIds);

  const {
    search,
    setSearch,
    selectedSelect: selectedBrand,
    setSelectedSelect: setSelectedBrand,
  } = useViewFilters('agencyReports');

  const brandOptions = [
    { value: '', label: 'All Brands' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ];

  // Every figure below comes from GET /agency/reports/campaigns/:id, where the
  // aggregates and engagement rate are computed server side.
  const reportRows: CampaignMetricRow[] = useMemo(
    () =>
      reports
        .filter((report) => report?.campaign)
        .map((report) => {
          const brand = brands.find((b) => b.id === report.campaign.brandId);
          return {
            id: report.campaign.id,
            campaignName: report.campaign.name,
            brandName: brand?.name ?? '—',
            influencerCount: report.influencerCount ?? 0,
            totalClientRate: report.totalClientRate ?? 0,
            totalMargin: report.totalMargin ?? 0,
            totalReach: report.totalReach ?? 0,
            erPercent: report.averageErPercent ?? 0,
          };
        }),
    [reports, brands],
  );

  const totals = useMemo(() => {
    const totalClientRate = reportRows.reduce((sum, r) => sum + r.totalClientRate, 0);
    const totalMargin = reportRows.reduce((sum, r) => sum + r.totalMargin, 0);
    const totalReach = reportRows.reduce((sum, r) => sum + r.totalReach, 0);
    const rowsWithEngagement = reportRows.filter((r) => r.totalReach > 0);
    const averageEr =
      rowsWithEngagement.length > 0
        ? rowsWithEngagement.reduce((sum, r) => sum + r.erPercent, 0) / rowsWithEngagement.length
        : 0;

    return {
      totalClientRate,
      totalMargin,
      totalReach,
      averageEr,
      marginRate: totalClientRate > 0 ? (totalMargin / totalClientRate) * 100 : 0,
    };
  }, [reportRows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reportRows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.campaignName.toLowerCase().includes(term) ||
        row.brandName.toLowerCase().includes(term);
      const matchesBrand =
        !selectedBrand || brands.find((b) => b.id === selectedBrand)?.name === row.brandName;
      return matchesSearch && matchesBrand;
    });
  }, [reportRows, search, selectedBrand, brands]);

  // Reach per campaign, highest first. The API exposes aggregates rather than a
  // time series, so this is a comparison across campaigns, not a trend over time.
  const chartData = useMemo(
    () =>
      [...filteredRows]
        .sort((a, b) => b.totalReach - a.totalReach)
        .slice(0, 8)
        .map((row) => ({ label: row.campaignName, value: row.totalReach })),
    [filteredRows],
  );

  const columns: Array<DataTableColumn<CampaignMetricRow>> = [
    {
      id: 'campaign',
      header: 'Campaign & Brand',
      type: 'entity',
      accessor: 'campaignName',
      subAccessor: 'brandName',
    },
    {
      id: 'influencerCount',
      header: 'Influencers',
      type: 'text',
      accessor: (row) => `${row.influencerCount} influencers`,
    },
    {
      id: 'totalClientRate',
      header: 'Client Billing',
      type: 'custom',
      accessor: 'totalClientRate',
      render: (row) => <MoneyText amount={row.totalClientRate} variant="body2" />,
    },
    {
      id: 'totalMargin',
      header: 'Agency Margin',
      type: 'custom',
      accessor: 'totalMargin',
      render: (row) => (
        <MoneyText
          amount={row.totalMargin}
          variant="body2"
          color={theme.palette.tokens.accentText}
        />
      ),
    },
    {
      id: 'totalReach',
      header: 'Total Reach',
      type: 'text',
      accessor: (row) => row.totalReach.toLocaleString('en-IN'),
    },
    {
      id: 'erPercent',
      header: 'Avg. ER%',
      type: 'custom',
      accessor: (row) => `${row.erPercent.toFixed(1)}%`,
      render: (row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: theme.palette.tokens.positiveText }}
        >
          {row.erPercent.toFixed(1)}%
        </Typography>
      ),
    },
  ];

  const { exportExcel, isExporting } = useTableExport({
    filename: 'campaign_financial_reports',
    sheetName: 'Reports',
    columns: columns as Array<ExcelColumnConfig<CampaignMetricRow>>,
    rows: filteredRows,
  });

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Financial performance, margins, and deliverable engagement metrics across campaigns"
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      {/* 1. Summary MetricCards */}
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Client Billings"
            value={formatCurrency(totals.totalClientRate)}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle={`${reportRows.length} campaigns reported`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Realized Margin"
            value={formatCurrency(totals.totalMargin)}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle={`Margin rate ${totals.marginRate.toFixed(1)}%`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Deliverable Reach"
            value={compactNumber(totals.totalReach)}
            icon={<VisibilityRoundedIcon fontSize="small" />}
            subtitle="Recorded deliverable metrics"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Average Engagement Rate"
            value={`${totals.averageEr.toFixed(2)}%`}
            icon={<TrendingUpRoundedIcon fontSize="small" />}
            subtitle="Mean of reported campaigns"
          />
        </Grid>
      </Grid>

      {/* 2. Reach by campaign */}
      <ChartCard
        title="Reach by Campaign"
        value={totals.totalReach.toLocaleString('en-IN')}
        deltaLabel="total recorded reach"
        timeframeOptions={[]}
        data={chartData}
      />

      {/* 3. Campaign Performance Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          selectOptions={brandOptions}
          selectedOption={selectedBrand}
          onSelectChange={setSelectedBrand}
          selectLabel="Brand"
          onExport={exportExcel}
          isExporting={isExporting}
          exportDisabled={filteredRows.length === 0}
        />

        <SectionHeading
          title="Campaign Deliverable Aggregates"
          subtitle="Realized margins and engagement rates derived from server-verified deliverables"
        />

        <DataTable<CampaignMetricRow>
          columns={columns}
          rows={filteredRows}
          loading={campaignsLoading || reportsLoading}
          isFetching={campaignsFetching || reportsFetching}
          onRowClick={(row) => navigate(`/agency/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
