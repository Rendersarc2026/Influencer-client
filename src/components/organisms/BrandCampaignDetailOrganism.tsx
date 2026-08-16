import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, CommentDialog, FilterBar } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { useBrandCampaign, useBrandCampaignInfluencers, useBrandDecision } from '@api';
import { BrandMapperResponse, BrandDecisionRequest } from '@contracts';
import { useAuth, useDebounce, useToast, useViewFilters } from '@hooks';
import { safeUrl } from '@utils';

interface BrandCampaignDetailOrganismProps {
  campaignId?: string;
}

export const BrandCampaignDetailOrganism: React.FC<BrandCampaignDetailOrganismProps> = ({
  campaignId: propCampaignId,
}) => {
  const theme = useTheme();
  const { id: routeCampaignId = '' } = useParams<{ id: string }>();
  const campaignId = propCampaignId || routeCampaignId;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const {
    search,
    setSearch,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useViewFilters('brandCampaignDetail');
  const debouncedSearch = useDebounce(search, 300);

  const { data: campaign, isLoading: campaignLoading } = useBrandCampaign(campaignId);
  const {
    data: mappersData,
    isLoading: mappersLoading,
    isFetching: mappersFetching,
  } = useBrandCampaignInfluencers(campaignId, {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const mappers = mappersData?.items || [];
  const totalMappers = mappersData?.total ?? mappers.length;

  const brandDecisionMutation = useBrandDecision(campaignId);

  // Dialog state for Reject / Request Correction
  const [activeDialog, setActiveDialog] = useState<{
    mapperId: string;
    action: 'REJECT' | 'REQUEST_CORRECTION';
    title: string;
    subtitle: string;
    confirmText: string;
  } | null>(null);

  // 1. Single-click Approve Action
  const handleApprove = async (mapperId: string) => {
    const decision: BrandDecisionRequest = {
      action: 'APPROVE',
    };
    try {
      await brandDecisionMutation.mutateAsync({ mapperId, decision });
      showSuccess('Creator commercial proposal approved.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to approve proposal.',
      );
    }
  };

  // 2. Reject Action (opens dialog)
  const handleOpenReject = (mapperId: string) => {
    setActiveDialog({
      mapperId,
      action: 'REJECT',
      title: 'Reject Creator Proposal',
      subtitle: 'Provide the reason for rejecting this creator from the campaign roster',
      confirmText: 'Confirm Rejection',
    });
  };

  // 3. Request Correction Action (opens dialog)
  const handleOpenCorrection = (mapperId: string) => {
    setActiveDialog({
      mapperId,
      action: 'REQUEST_CORRECTION',
      title: 'Request Deliverable / Rate Correction',
      subtitle: 'Specify the required deliverable adjustments or commercial targets for the agency',
      confirmText: 'Send Correction Request',
    });
  };

  // Dialog submit handler (comment is required for REJECT and REQUEST_CORRECTION)
  const handleDialogSubmit = async (comment: string) => {
    if (!activeDialog || !comment.trim()) return;
    const decision: BrandDecisionRequest = {
      action: activeDialog.action,
      comment: comment.trim(),
    };
    try {
      await brandDecisionMutation.mutateAsync({
        mapperId: activeDialog.mapperId,
        decision,
      });
      showSuccess(
        activeDialog.action === 'REJECT'
          ? 'Creator proposal rejected.'
          : 'Correction request sent to agency.',
      );
      setActiveDialog(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to submit decision.',
      );
    }
  };

  const columns: Array<DataTableColumn<BrandMapperResponse>> = [
    {
      id: 'influencer',
      header: 'Influencer',
      type: 'entity',
      accessor: 'influencerName',
      subAccessor: (row) => `ID: ${row.influencerId.slice(0, 8)}`,
    },
    {
      id: 'deliverables',
      header: 'Deliverables',
      type: 'text',
      accessor: (row) => row.deliverables || 'Deliverables not specified',
    },
    {
      id: 'clientRate',
      header: 'Agreed Rate',
      type: 'custom',
      render: (row) =>
        row.clientRate !== null ? (
          <MoneyText amount={row.clientRate} currency={row.currency} variant="body2" />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            Pending agency review
          </Typography>
        ),
    },
    {
      id: 'status',
      header: 'Approval Status',
      type: 'custom',
      render: (row) => <StatusChip status={row.brandStatus} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => {
        const isPending = row.brandStatus === 'PENDING_REVIEW';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
            {isPending && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                  onClick={() => handleApprove(row.id)}
                  disabled={brandDecisionMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditNoteRoundedIcon fontSize="small" />}
                  onClick={() => handleOpenCorrection(row.id)}
                  disabled={brandDecisionMutation.isPending}
                >
                  Correct
                </Button>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<CancelRoundedIcon fontSize="small" />}
                  onClick={() => handleOpenReject(row.id)}
                  disabled={brandDecisionMutation.isPending}
                  sx={{ color: theme.palette.tokens.negative }}
                >
                  Reject
                </Button>
              </>
            )}
            {!isPending && (
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                Decision Recorded
              </Typography>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title={campaign?.name || 'Campaign Review'}
      subtitle="Review creator rates and deliverable proposals from your agency"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      breadcrumbs={[{ label: 'Campaigns', path: '/brand/campaigns' }]}
      onBack={() => navigate('/brand/campaigns')}
      backLabel="Back to Campaigns"
    >
      {/* 1. Brief Card */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
        }}
      >
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h2">{campaign?.name}</Typography>
              {campaign?.status && <StatusChip status={campaign.status} />}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              Managed by your partner agency
            </Typography>
          </Box>

          {safeUrl(campaign?.briefUrl) && (
            <Button
              variant="outlined"
              size="small"
              href={safeUrl(campaign?.briefUrl) as string}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<LaunchRoundedIcon fontSize="small" />}
            >
              Open Brief
            </Button>
          )}
        </Box>

        {campaign?.description && (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary, mb: 2 }}>
            {campaign.description}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            gap: 4,
            pt: 1,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              TIMELINE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {campaign?.startDate
                ? new Date(campaign.startDate).toLocaleDateString('en-IN')
                : 'TBD'}{' '}
              — {campaign?.endDate ? new Date(campaign.endDate).toLocaleDateString('en-IN') : 'TBD'}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
            >
              PROPOSED CREATORS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {totalMappers} {totalMappers === 1 ? 'Influencer' : 'Influencers'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 2. Influencer Table (Rate = Client Rate only) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, minHeight: 0 }}>
        <SectionHeading
          title="Creator Deliverables & Commercial Proposals"
          subtitle="Review and authorize proposed creator commercial deliverables"
        />

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
        />

        <DataTable<BrandMapperResponse>
          columns={columns}
          rows={mappers}
          totalRows={totalMappers}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(limit) => {
            setRowsPerPage(limit);
            setPage(0);
          }}
          loading={mappersLoading || campaignLoading}
          isFetching={mappersFetching}
          fillHeight
        />
      </Box>

      {/* CommentDialog for Reject / Request Correction */}
      {activeDialog && (
        <CommentDialog
          open={Boolean(activeDialog)}
          title={activeDialog.title}
          subtitle={activeDialog.subtitle}
          confirmText={activeDialog.confirmText}
          loading={brandDecisionMutation.isPending}
          variant={activeDialog.action === 'REJECT' ? 'destructive' : 'neutral'}
          onConfirm={handleDialogSubmit}
          onCancel={() => setActiveDialog(null)}
        />
      )}
    </DashboardLayout>
  );
};
