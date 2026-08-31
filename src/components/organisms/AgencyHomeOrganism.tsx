import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CurrencyRupeeRoundedIcon from '@mui/icons-material/CurrencyRupeeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn } from '@molecules';
import { SectionHeading } from '@atoms';
import { useQueryClient } from '@tanstack/react-query';
import { useAgencyCampaigns, useAgencyDashboardSummary, agencyCampaignsQueryOptions } from '@api';
import { CampaignResponse } from '@contracts';
import { useAuth } from '@hooks';
import { formatCurrency } from '@utils';

export const AgencyHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
  } = useAgencyCampaigns({
    page: page + 1,
    limit: rowsPerPage,
  });
  // Every tile comes from one aggregate query. The page used to fetch every
  // campaign, every brand and a full report per campaign - four requests whose
  // size grew with the agency - and count the rows here to get the same numbers.
  const { data: summary, isLoading: summaryLoading } = useAgencyDashboardSummary();

  const campaigns = useMemo(() => campaignsData?.items || [], [campaignsData?.items]);
  const campaignsTotal = campaignsData?.total ?? campaigns.length;

  const queryClient = useQueryClient();

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Campaign',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => row.brandName || 'Managed Brand',
    },
    {
      id: 'status',
      header: 'Status',
      type: 'status',
      accessor: 'status',
      statusCategory: 'CAMPAIGN_STATUS',
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
    >
      {/* 1. Four Metric Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} alignItems="stretch">
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Active Campaigns"
            value={summary?.activeCampaigns ?? 0}
            loading={summaryLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="Currently in market"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Pending Rates"
            value={summary?.pendingRateApprovals ?? 0}
            loading={summaryLoading}
            icon={<HourglassEmptyRoundedIcon fontSize="small" />}
            subtitle="Submitted, awaiting approval"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Awaiting Brand"
            value={summary?.awaitingBrandReview ?? 0}
            loading={summaryLoading}
            icon={<VisibilityRoundedIcon fontSize="small" />}
            subtitle="Rates with brand"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Total Margin"
            value={formatCurrency(summary?.totalMargin ?? 0)}
            loading={summaryLoading}
            icon={<CurrencyRupeeRoundedIcon fontSize="small" />}
            subtitle="Approved campaign rates"
            onClick={() => navigate('/agency/campaigns')}
          />
        </Grid>
      </Grid>

      {/* 2. Recent Campaigns DataTable */}
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
          rows={campaigns}
          totalRows={campaignsTotal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={campaignsLoading}
          isFetching={campaignsFetching}
          exportFilename="recent_campaigns"
          exportSheetName="Campaigns"
          onExportAll={async () => {
            // Fetched when the user actually exports. Holding the unpaginated
            // list just in case is what made this screen load the whole table.
            const all = await queryClient.fetchQuery(agencyCampaignsQueryOptions());
            return all.items;
          }}
          onRowClick={(row) => navigate(`/agency/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
