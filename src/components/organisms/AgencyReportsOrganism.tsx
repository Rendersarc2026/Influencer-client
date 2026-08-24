import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import SummarizeRoundedIcon from '@mui/icons-material/SummarizeRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, ChartCard, DataTable, DataTableColumn, FilterBar } from '@molecules';
import { SectionHeading, MoneyText } from '@atoms';
import { useCampaignRollups, apiClient } from '@api';
import { useAuth, useViewFilters, useTableExport, useToast } from '@hooks';
import {
  formatCurrency,
  ExcelColumnConfig,
  exportMonthlyDeliverablesReport,
  MonthlyDeliverableExportRow,
  getDeliverableStatus,
} from '@utils';
import { AgencyMapperResponse, PaginatedResult } from '@contracts';

interface CampaignMetricRow extends Record<string, unknown> {
  id: string;
  brandId: string;
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
  const { showSuccess, showError } = useToast();

  // One row per campaign, aggregated in Postgres. This screen used to fetch
  // every campaign, then a full report for each of them - mapper rows included
  // - through an endpoint that rejects more than 100 ids per request.
  const {
    data: rollupData,
    isLoading: rollupLoading,
    isFetching: rollupFetching,
  } = useCampaignRollups();
  const rollups = useMemo(() => rollupData ?? [], [rollupData]);

  const {
    search,
    setSearch,
    selectedSelect: selectedBrand,
    setSelectedSelect: setSelectedBrand,
  } = useViewFilters('agencyReports');

  // The brands that actually have campaigns - the only ones this report can
  // show a row for - taken from the roll-up instead of a second brand fetch.
  const brandOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rollups) seen.set(row.brandId, row.brandName);
    return [
      { value: '', label: 'All Brands' },
      ...[...seen.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [rollups]);

  // Every figure here is computed by the `campaign_rollup` view; the browser
  // only reshapes it for the table.
  const reportRows: CampaignMetricRow[] = useMemo(
    () =>
      rollups.map((row) => ({
        id: row.campaignId,
        brandId: row.brandId,
        campaignName: row.campaignName,
        brandName: row.brandName || '—',
        influencerCount: row.influencerCount,
        totalClientRate: row.totalClientRate,
        totalMargin: row.totalMargin,
        totalReach: row.totalReach,
        erPercent: row.avgErPercent,
      })),
    [rollups],
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
      // Compared on the id the row carries, rather than by matching names.
      const matchesBrand = !selectedBrand || row.brandId === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [reportRows, search, selectedBrand]);

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

  const [isExportingMonthly, setIsExportingMonthly] = useState(false);

  const handleExportMonthlyReport = async () => {
    if (isExportingMonthly || filteredRows.length === 0) return;
    try {
      setIsExportingMonthly(true);

      // 1. Fetch campaign influencers for all visible/filtered campaigns in parallel
      const campaignPromises = filteredRows.map(async (row) => {
        try {
          const res = await apiClient.get<PaginatedResult<AgencyMapperResponse>>(
            `/agency/campaigns/${row.id}/influencers`,
            { params: { limit: 100 } },
          );
          return {
            campaignId: row.id,
            campaignName: row.campaignName,
            brandName: row.brandName,
            mappers: res.data.items || [],
          };
        } catch {
          return {
            campaignId: row.id,
            campaignName: row.campaignName,
            brandName: row.brandName,
            mappers: [],
          };
        }
      });

      const campaignResults = await Promise.all(campaignPromises);

      // 2. Flatten into MonthlyDeliverableExportRow[]
      const monthlyRows: MonthlyDeliverableExportRow[] = [];

      for (const camp of campaignResults) {
        for (const m of camp.mappers) {
          const status = getDeliverableStatus({
            rateStatus: m.rateStatus,
            brandStatus: m.brandStatus,
          });

          monthlyRows.push({
            campaignId: camp.campaignId,
            campaignName: camp.campaignName, // Explicit "Campaign Name" column for combined monthly report
            brandName: camp.brandName,
            influencerName: m.influencerName,
            instagram: m.instagram,
            youtube: m.youtube,
            category: m.category,
            followers: m.followers,
            deliverables: m.deliverables,
            status, // Where the deliverable stands (Briefed / Content Shared / Content Approved / Live / Completed / ...)
            reachFromRegion: m.reachFromRegion,
            clientRate: m.clientRate,
            agencyMargin: m.margin,
            influencerRate: m.influencerRate,
            rateStatus: m.rateStatus,
            brandStatus: m.brandStatus,
            reach: m.committedViews ?? 0,
            engagements: 0,
            erPercent: m.preEvalEr,
            views: m.committedViews,
            cpv: null,
            liveLink: null,
            recordedDate: m.createdOn,
          });
        }
      }

      const activeBrandLabel = brandOptions.find((b) => b.value === selectedBrand)?.label;

      await exportMonthlyDeliverablesReport({
        monthLabel: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        brandLabel:
          activeBrandLabel && activeBrandLabel !== 'All Brands' ? activeBrandLabel : 'All Brands',
        rows: monthlyRows,
      });

      showSuccess(
        `Monthly Deliverables Report exported with ${monthlyRows.length} deliverables across ${campaignResults.length} campaigns.`,
      );
    } catch (err) {
      console.error('Failed to export monthly report:', err);
      showError('Failed to generate monthly deliverables report.');
    } finally {
      setIsExportingMonthly(false);
    }
  };

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
      rightAction={
        <Button
          variant="contained"
          startIcon={
            isExportingMonthly ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SummarizeRoundedIcon fontSize="small" />
            )
          }
          onClick={handleExportMonthlyReport}
          disabled={isExportingMonthly || filteredRows.length === 0}
          sx={{ fontWeight: 700, textTransform: 'none' }}
        >
          {isExportingMonthly ? 'Generating Monthly Report...' : 'Download Monthly Report'}
        </Button>
      }
    >
      {/* 1. Summary MetricCards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} alignItems="stretch">
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Billings"
            value={formatCurrency(totals.totalClientRate)}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle={`${reportRows.length} campaigns`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Realized Margin"
            value={formatCurrency(totals.totalMargin)}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle={`Rate ${totals.marginRate.toFixed(1)}%`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Reach"
            value={compactNumber(totals.totalReach)}
            icon={<VisibilityRoundedIcon fontSize="small" />}
            subtitle="Recorded metrics"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Avg ER"
            value={`${totals.averageEr.toFixed(2)}%`}
            icon={<TrendingUpRoundedIcon fontSize="small" />}
            subtitle="Mean of campaigns"
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
          loading={rollupLoading}
          isFetching={rollupFetching}
          onRowClick={(row) => navigate(`/agency/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
