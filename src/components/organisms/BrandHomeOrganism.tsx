import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn } from '@molecules';
import { SectionHeading } from '@atoms';
import { useBrandCampaigns, useBrandCampaignsInfluencers } from '@api';
import {
  CampaignResponse,
  CampaignStatusCode,
  BrandStatusCode,
} from '@contracts';
import { useAuth } from '@hooks';

export const BrandHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: campaignsData,
    isLoading: campaignsLoading,
    isFetching: campaignsFetching,
  } = useBrandCampaigns({
    page: page + 1,
    limit: rowsPerPage,
  });
  const { data: allCampaignsData, isLoading: allCampaignsLoading } = useBrandCampaigns();

  const campaigns = campaignsData?.items || [];
  const campaignsTotal = campaignsData?.total ?? campaigns.length;
  const allCampaigns = useMemo(() => allCampaignsData?.items || [], [allCampaignsData]);

  const campaignIds = useMemo(() => allCampaigns.map((c) => c.id), [allCampaigns]);
  const { mappers, isLoading: mappersLoading } = useBrandCampaignsInfluencers(campaignIds);

  const activeCampaigns = allCampaigns.filter((c) => c.status === CampaignStatusCode.ACTIVE).length;
  const pendingApprovalCount = mappers.filter(
    (m) => m.brandStatus === BrandStatusCode.PENDING_REVIEW,
  ).length;
  const approvedInfluencersCount = mappers.filter(
    (m) => m.brandStatus === BrandStatusCode.APPROVED,
  ).length;
  const completedCampaigns = allCampaigns.filter(
    (c) => c.status === CampaignStatusCode.COMPLETED,
  ).length;

  const columns: Array<DataTableColumn<CampaignResponse>> = [
    {
      id: 'name',
      header: 'Active Campaign',
      type: 'entity',
      accessor: 'name',
      subAccessor: (row) => row.description || 'Campaign deliverables in progress',
    },
    {
      id: 'status',
      header: 'Campaign Status',
      type: 'status',
      accessor: 'status',
    },
    {
      id: 'timeline',
      header: 'Timeline',
      type: 'text',
      accessor: (row) => {
        if (!row.startDate && !row.endDate) return 'Active';
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : 'Start';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN') : 'Open';
        return `${start} — ${end}`;
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
          onClick={() => navigate(`/brand/campaigns/${row.id}`)}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          Review Influencers
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Brand Portal"
      subtitle="Campaign rosters, influencer approvals, and brand collaborations"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      {/* 1. Four Metric Cards */}
      <Grid container spacing={2.5} alignItems="stretch">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Active Campaigns"
            value={activeCampaigns}
            loading={allCampaignsLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="In progress with agency"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Awaiting My Approval"
            value={pendingApprovalCount}
            loading={allCampaignsLoading || mappersLoading}
            icon={<HourglassEmptyRoundedIcon fontSize="small" />}
            deltaLabel="influencers pending review"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Approved Influencers"
            value={approvedInfluencersCount}
            loading={allCampaignsLoading || mappersLoading}
            icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
            subtitle="Active across campaigns"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Completed Campaigns"
            value={completedCampaigns}
            loading={allCampaignsLoading}
            icon={<HistoryRoundedIcon fontSize="small" />}
            subtitle="Past campaign archives"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>
      </Grid>

      {/* 2. Action Items & Campaigns DataTable */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionHeading
          title="Campaigns Needing Review"
          subtitle="Review influencer proposals and approved rates from your agency partner"
          action={
            <Button
              variant="text"
              onClick={() => navigate('/brand/campaigns')}
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
          exportFilename="campaigns_needing_review"
          exportSheetName="Campaigns"
          onExportAll={async () => allCampaigns}
          onRowClick={(row) => navigate(`/brand/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
