import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import PercentRoundedIcon from '@mui/icons-material/PercentRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, CommentDialog, FilterBar } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { useBrandCampaign, useBrandCampaignInfluencers, useBrandDecision } from '@api';
import { BrandMapperResponse, BrandDecisionRequest, BrandStatusCode } from '@contracts';
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

  // Detailed Influencer Pre-Eval Drawer/Modal State
  const [selectedInfluencer, setSelectedInfluencer] = useState<BrandMapperResponse | null>(null);

  // 1. Single-click Approve Action
  const handleApprove = async (mapperId: string) => {
    const decision: BrandDecisionRequest = {
      action: 'APPROVE',
    };
    try {
      await brandDecisionMutation.mutateAsync({ mapperId, decision });
      showSuccess('Influencer commercial proposal approved.');
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
      title: 'Reject Influencer Proposal',
      subtitle: 'Provide the reason for rejecting this influencer from the campaign roster',
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
          ? 'Influencer proposal rejected.'
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

  // -------------------------------------------------------------
  // KPI Metrics Calculations
  // -------------------------------------------------------------
  const summaryKpis = useMemo(() => {
    let totalCommittedViews = 0;
    let totalClientRate = 0;
    let totalEr = 0;
    let erCount = 0;

    mappers.forEach((m) => {
      if (m.committedViews) totalCommittedViews += m.committedViews;
      if (m.clientRate) totalClientRate += m.clientRate;
      if (m.preEvalEr) {
        totalEr += m.preEvalEr;
        erCount += 1;
      }
    });

    const avgEr = erCount > 0 ? (totalEr / erCount).toFixed(2) : '—';
    const avgCpv =
      totalCommittedViews > 0 && totalClientRate > 0
        ? (totalClientRate / totalCommittedViews).toFixed(2)
        : '—';

    return {
      totalInfluencers: totalMappers,
      totalCommittedViews,
      totalClientRate,
      avgEr,
      avgCpv,
    };
  }, [mappers, totalMappers]);

  // -------------------------------------------------------------
  // 13 Base Pre-Evaluation Columns
  // -------------------------------------------------------------
  const columns: Array<DataTableColumn<BrandMapperResponse>> = [
    // 1. Sr No
    {
      id: 'srNo',
      header: 'Sr No',
      type: 'custom',
      align: 'center',
      render: (_row, index) => (
        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.tokens.textSecondary }}>
          {page * rowsPerPage + index + 1}
        </Typography>
      ),
    },
    // 2. Region
    {
      id: 'region',
      header: 'Region',
      type: 'custom',
      render: (row) => (
        <Chip
          label={row.region || row.reachFromRegion || 'India'}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: theme.palette.tokens.fieldBg,
            color: theme.palette.tokens.textPrimary,
          }}
        />
      ),
    },
    // 3. Username
    {
      id: 'username',
      header: 'Username',
      type: 'custom',
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.tokens.textPrimary }}>
              {row.influencerName || `Influencer #${row.influencerId.slice(0, 8)}`}
            </Typography>
            {row.instagram && (
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}>
                @{row.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    // 4. Influencer Link
    {
      id: 'influencerLink',
      header: 'Influencer Link',
      type: 'custom',
      align: 'center',
      render: (row) => {
        const link = row.instagram || row.youtube;
        if (!link) {
          return (
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              —
            </Typography>
          );
        }
        const isInstagram = Boolean(row.instagram);
        return (
          <Tooltip title={isInstagram ? 'Open Instagram Profile' : 'Open YouTube Channel'}>
            <IconButton
              component={Link}
              href={safeUrl(link) || link}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                color: isInstagram ? '#E1306C' : '#FF0000',
                backgroundColor: theme.palette.tokens.fieldBg,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {isInstagram ? <InstagramIcon fontSize="small" /> : <YouTubeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        );
      },
    },
    // 5. Category
    {
      id: 'category',
      header: 'Category',
      type: 'custom',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.tokens.textPrimary }}>
          {row.category || 'General'}
        </Typography>
      ),
    },
    // 6. Followers
    {
      id: 'followers',
      header: 'Followers',
      type: 'custom',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.followers ? row.followers.toLocaleString() : '—'}
        </Typography>
      ),
    },
    // 7. Reach from the region
    {
      id: 'reachFromRegion',
      header: 'Reach from Region',
      type: 'custom',
      render: (row) => (
        <Typography variant="body2" sx={{ color: theme.palette.tokens.textPrimary }}>
          {row.reachFromRegion || '—'}
        </Typography>
      ),
    },
    // 8. Pre Eval-ER% (Average last 10 post)
    {
      id: 'preEvalEr',
      header: 'Pre Eval-ER%',
      type: 'custom',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: row.preEvalEr && row.preEvalEr >= 3 ? theme.palette.tokens.positiveText : theme.palette.tokens.textPrimary,
          }}
        >
          {row.preEvalEr !== null && row.preEvalEr !== undefined ? `${row.preEvalEr}%` : '—'}
        </Typography>
      ),
    },
    // 9. Brand Fit (Qualitative Comments)
    {
      id: 'brandFit',
      header: 'Brand Fit',
      type: 'custom',
      render: (row) => (
        <Tooltip title={row.brandFit || 'No qualitative comments entered'}>
          <Typography
            variant="caption"
            sx={{
              maxWidth: 160,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: row.brandFit ? theme.palette.tokens.textPrimary : theme.palette.tokens.textSecondary,
            }}
          >
            {row.brandFit || '—'}
          </Typography>
        </Tooltip>
      ),
    },
    // 10. Deliverables
    {
      id: 'deliverables',
      header: 'Deliverables',
      type: 'custom',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.deliverables || 'Pending'}
        </Typography>
      ),
    },
    // 11. Final Nego Commercials (Billed Client Rate)
    {
      id: 'clientRate',
      header: 'Final Commercials',
      type: 'custom',
      align: 'right',
      render: (row) =>
        row.clientRate !== null ? (
          <MoneyText amount={row.clientRate} currency={row.currency} variant="body2" />
        ) : (
          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Pending Agency Rate
          </Typography>
        ),
    },
    // 12. Pre Eval - Committed Views
    {
      id: 'committedViews',
      header: 'Committed Views',
      type: 'custom',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.committedViews ? row.committedViews.toLocaleString() : '—'}
        </Typography>
      ),
    },
    // 13. Pre Eval CPV (Cost/Views)
    {
      id: 'preEvalCpv',
      header: 'Pre Eval CPV',
      type: 'custom',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: row.preEvalCpv ? theme.palette.primary.main : theme.palette.tokens.textSecondary,
          }}
        >
          {row.preEvalCpv !== null && row.preEvalCpv !== undefined ? `₹${row.preEvalCpv}` : '—'}
        </Typography>
      ),
    },
    // Status
    {
      id: 'status',
      header: 'Status',
      type: 'custom',
      align: 'center',
      render: (row) => <StatusChip category="BRAND_STATUS" code={row.brandStatus} />,
    },
    // Workflow Actions
    {
      id: 'actions',
      header: 'Actions',
      type: 'actions',
      align: 'right',
      render: (row) => {
        const isPending = row.brandStatus === BrandStatusCode.PENDING_REVIEW;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View Full Pre-Evaluation Dossier">
              <IconButton
                size="small"
                onClick={() => setSelectedInfluencer(row)}
                sx={{ color: theme.palette.tokens.textSecondary }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {isPending && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                  onClick={() => handleApprove(row.id)}
                  disabled={brandDecisionMutation.isPending}
                  sx={{ py: 0.5, px: 1.5, fontSize: '0.75rem' }}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditNoteRoundedIcon fontSize="small" />}
                  onClick={() => handleOpenCorrection(row.id)}
                  disabled={brandDecisionMutation.isPending}
                  sx={{ py: 0.5, px: 1, fontSize: '0.75rem' }}
                >
                  Correct
                </Button>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<CancelRoundedIcon fontSize="small" />}
                  onClick={() => handleOpenReject(row.id)}
                  disabled={brandDecisionMutation.isPending}
                  sx={{ color: theme.palette.tokens.negative, py: 0.5, px: 1, fontSize: '0.75rem' }}
                >
                  Reject
                </Button>
              </>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title={campaign?.name || 'Campaign Review'}
      subtitle="Review influencer pre-evaluations, audience metrics, and commercial rates"
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
      {/* 1. Campaign Brief & Timeline Card */}
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
              {campaign?.status && <StatusChip category="CAMPAIGN_STATUS" code={campaign.status} />}
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
              Partner Agency Managed Campaign · Pre-Evaluation & Roster Approval
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
              Open Campaign Brief
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
            pt: 1.5,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', fontWeight: 600 }}
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
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', fontWeight: 600 }}
            >
              TOTAL INFLUENCERS
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {totalMappers} {totalMappers === 1 ? 'Creator' : 'Creators'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 2. KPI Pre-Evaluation Metric Summary Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VisibilityRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}>
              Total Committed Views
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {summaryKpis.totalCommittedViews > 0
                ? summaryKpis.totalCommittedViews.toLocaleString()
                : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PercentRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}>
              Avg Pre-Eval ER %
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {summaryKpis.avgEr !== '—' ? `${summaryKpis.avgEr}%` : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUpRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}>
              Avg Pre-Eval CPV
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
              {summaryKpis.avgCpv !== '—' ? `₹${summaryKpis.avgCpv}` : '—'}
            </Typography>
          </Box>
        </Card>

        <Card
          sx={{
            p: 2,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '8px',
              backgroundColor: 'rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MonetizationOnRoundedIcon sx={{ color: theme.palette.tokens.textSecondary }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600 }}>
              Total Commercial Budget
            </Typography>
            <MoneyText
              amount={summaryKpis.totalClientRate}
              currency="INR"
              variant="h3"
              color={theme.palette.tokens.positiveText}
            />
          </Box>
        </Card>
      </Box>

      {/* 3. 13-Column Pre-Evaluation Table */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
        <SectionHeading
          title="Influencer Pre-Evaluation & Commercial Proposals"
          subtitle="Detailed pre-evaluation metrics across all 13 standard assessment dimensions"
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

      {/* 4. Pre-Evaluation Details Dialog */}
      {selectedInfluencer && (
        <Dialog
          open={Boolean(selectedInfluencer)}
          onClose={() => setSelectedInfluencer(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: `${theme.customRadii.card}px`,
                padding: '16px',
              },
            },
          }}
        >
          <DialogTitle sx={{ px: 1, pt: 1, pb: 0 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {selectedInfluencer.influencerName}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mt: 0.5 }}>
              Pre-Evaluation Dossier & Deliverable Profile
            </Typography>
          </DialogTitle>

          <DialogContent
            sx={{
              px: 1,
              pt: 2,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  p: 2,
                  backgroundColor: theme.palette.tokens.fieldBg,
                  borderRadius: `${theme.customRadii.inner}px`,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Region
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.region || 'India'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.category || 'General'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Followers
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.followers ? selectedInfluencer.followers.toLocaleString() : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Reach from Region
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.reachFromRegion || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Pre-Eval ER%
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.preEvalEr ? `${selectedInfluencer.preEvalEr}%` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Committed Views
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedInfluencer.committedViews ? selectedInfluencer.committedViews.toLocaleString() : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Pre-Eval CPV
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {selectedInfluencer.preEvalCpv ? `₹${selectedInfluencer.preEvalCpv}` : '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Final Commercial
                  </Typography>
                  <MoneyText
                    amount={selectedInfluencer.clientRate || 0}
                    currency={selectedInfluencer.currency}
                    variant="body2"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 700 }}>
                  DELIVERABLES
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedInfluencer.deliverables || 'Pending'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 700 }}>
                  BRAND FIT (QUALITATIVE COMMENTS)
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: selectedInfluencer.brandFit ? 'normal' : 'italic', color: selectedInfluencer.brandFit ? theme.palette.tokens.textPrimary : theme.palette.tokens.textSecondary }}>
                  {selectedInfluencer.brandFit || 'No qualitative evaluation note provided'}
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 1, pt: 2 }}>
            <Button variant="outlined" onClick={() => setSelectedInfluencer(null)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* 5. CommentDialog for Reject / Request Correction */}
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
