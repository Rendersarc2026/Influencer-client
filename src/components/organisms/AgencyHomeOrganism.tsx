import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import {
  MetricCard,
  ChartCard,
  DataTable,
  DataTableColumn,
  CreateCampaignDialog,
} from '@molecules';
import { SectionHeading } from '@atoms';
import { useAgencyCampaigns, useAgencyBrands, useCreateCampaign, useCampaignReports } from '@api';
import { CampaignResponse, CreateCampaignRequest } from '@contracts';
import { useAuth } from '@hooks';
import { formatCurrency } from '@utils';

export const AgencyHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: campaigns = [], isLoading: campaignsLoading } = useAgencyCampaigns();
  const { data: brands = [] } = useAgencyBrands();
  const createCampaignMutation = useCreateCampaign();

  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);

  const campaignIds = useMemo(() => campaigns.map((c) => c.id), [campaigns]);
  const { reports, isLoading: reportsLoading } = useCampaignReports(campaignIds);

  const activeCampaignsCount = campaigns.filter((c) => c.status === 'ACTIVE').length;

  // Every tile below is derived from the campaign report aggregates, which carry
  // the mapper rows with their current rate and brand statuses.
  const summary = useMemo(() => {
    const mappers = reports.flatMap((r) => r.mappers);
    return {
      pendingRates: mappers.filter((m) => m.rateStatus === 'SUBMITTED').length,
      awaitingBrand: mappers.filter((m) => m.brandStatus === 'PENDING_REVIEW').length,
      totalMargin: reports.reduce((sum, r) => sum + r.totalMargin, 0),
      totalReach: reports.reduce((sum, r) => sum + r.totalReach, 0),
    };
  }, [reports]);

  // Reach per campaign rather than an invented weekly trend: the API exposes
  // aggregates, not a time series.
  const chartData = useMemo(
    () =>
      reports
        .map((r) => ({ label: r.campaign.name, value: r.totalReach }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [reports],
  );

  const handleCreateCampaign = async (data: CreateCampaignRequest) => {
    await createCampaignMutation.mutateAsync(data);
    setCreateCampaignOpen(false);
  };

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Campaign',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => {
        const brand = brands.find((b) => b.id === row.brandId);
        return brand ? brand.name : 'Managed Brand';
      },
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: 'status',
    },
    {
      id: 'dates',
      header: 'Timeline',
      type: 'text',
      accessor: (row) => {
        if (!row.startDate && !row.endDate) return 'Ongoing';
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : 'Start';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN') : 'Open';
        return `${start} - ${end}`;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/agency/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          Manage
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Agency Dashboard"
      subtitle="Campaign operations, margin configuration, and deliverable workflows"
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
          onClick={() => setCreateCampaignOpen(true)}
        >
          New Campaign
        </Button>
      }
    >
      {/* 1. Four Metric Cards */}
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="lavender"
            title="Active Campaigns"
            value={campaignsLoading ? '—' : activeCampaignsCount}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Currently in market"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Pending Rates"
            value={reportsLoading ? '—' : summary.pendingRates}
            icon={<HourglassEmptyRoundedIcon fontSize="small" />}
            subtitle="Submitted, awaiting your approval"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="sky"
            title="Awaiting Brand"
            value={reportsLoading ? '—' : summary.awaitingBrand}
            icon={<VisibilityRoundedIcon fontSize="small" />}
            subtitle="Rates submitted to brand"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="mint"
            title="Total Margin"
            value={reportsLoading ? '—' : formatCurrency(summary.totalMargin)}
            icon={<AttachMoneyRoundedIcon fontSize="small" />}
            subtitle="Approved rates across campaigns"
            onClick={() => navigate('/agency/reports')}
          />
        </Grid>
      </Grid>

      {/* 2. ChartCard */}
      <ChartCard
        title="Reach by Campaign"
        value={summary.totalReach.toLocaleString('en-IN')}
        deltaLabel="total recorded reach"
        timeframeOptions={[]}
        data={chartData}
      />

      {/* 3. Recent Campaigns DataTable */}
      <Box>
        <SectionHeading
          title="Recent Campaigns"
          subtitle="Managed campaigns under active agency client brands"
          action={
            <Button
              variant="text"
              onClick={() => navigate('/agency/campaigns')}
              endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
            >
              View All Campaigns
            </Button>
          }
        />
        <DataTable<CampaignResponse>
          columns={columns}
          rows={campaigns.slice(0, 5)}
          loading={campaignsLoading}
          onRowClick={(row) => navigate(`/agency/campaigns/${row.id}`)}
        />
      </Box>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={createCampaignOpen}
        brands={brands}
        loading={createCampaignMutation.isPending}
        onSubmit={handleCreateCampaign}
        onClose={() => setCreateCampaignOpen(false)}
      />
    </DashboardLayout>
  );
};
