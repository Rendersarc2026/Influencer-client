import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { MetricCard, DataTable, DataTableColumn } from '@molecules';
import { SectionHeading } from '@atoms';
import { useBrandCampaigns, useBrandPayments } from '@api';
import { CampaignResponse } from '@contracts';
import { useAuth } from '@hooks';

export const BrandHomeOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: campaigns = [], isLoading: campaignsLoading } = useBrandCampaigns();
  const { data: payments = [], isLoading: paymentsLoading } = useBrandPayments();

  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const pendingPayments = payments.filter((p) => p.status === 'PENDING_APPROVAL').length;

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
          Review Creators
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Brand Portal"
      subtitle="Campaign rosters, creator approvals, and deliverable disbursements"
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
            tint="lavender"
            title="Active Campaigns"
            value={activeCampaigns}
            loading={campaignsLoading}
            icon={<CampaignRoundedIcon fontSize="small" />}
            subtitle="In progress with agency"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="butter"
            title="Awaiting My Approval"
            value="3"
            icon={<HourglassEmptyRoundedIcon fontSize="small" />}
            deltaLabel="creators pending review"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="mint"
            title="Approved Creators"
            value="14"
            icon={<CheckCircleOutlineRoundedIcon fontSize="small" />}
            subtitle="Active across campaigns"
            onClick={() => navigate('/brand/campaigns')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            tint="sky"
            title="Pending Payments"
            value={pendingPayments}
            loading={paymentsLoading}
            icon={<PaymentRoundedIcon fontSize="small" />}
            subtitle="Awaiting authorization"
            onClick={() => navigate('/brand/payments')}
          />
        </Grid>
      </Grid>

      {/* 2. Action Items & Campaigns DataTable */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SectionHeading
          title="Campaigns Needing Review"
          subtitle="Review creator proposals and approved rates from your agency partner"
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
          loading={campaignsLoading}
          onRowClick={(row) => navigate(`/brand/campaigns/${row.id}`)}
        />
      </Box>
    </DashboardLayout>
  );
};
