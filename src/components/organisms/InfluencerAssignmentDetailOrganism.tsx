import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SubmitRateDialog } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { useInfluencerAssignment, useSubmitInfluencerRate } from '@api';
import { SubmitRateRequest, RateStatusCode } from '@contracts';
import { useAuth, useToast } from '@hooks';

export const InfluencerAssignmentDetailOrganism: React.FC = () => {
  const theme = useTheme();
  const { id: assignmentId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: assignment, isLoading } = useInfluencerAssignment(assignmentId);
  const submitRateMutation = useSubmitInfluencerRate();

  const [rateDialogOpen, setRateDialogOpen] = useState(false);

  const handleSubmitRate = async (mapperId: string, data: SubmitRateRequest) => {
    try {
      await submitRateMutation.mutateAsync({ mapperId, data });
      showSuccess('Commercial quote submitted for agency review.');
      setRateDialogOpen(false);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to submit quote.');
    }
  };

  const isRateSubmitted = Boolean(assignment?.influencerRate);
  const isApproved = assignment?.rateStatus === RateStatusCode.AGENCY_APPROVED;

  return (
    <DashboardLayout
      title="Assignment Details"
      subtitle={
        assignment
          ? `Campaign Assignment #${assignment.campaignId.slice(0, 8)}`
          : 'Deliverables & Rates'
      }
      navItems={navConfig.INFLUENCER}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Creator',
        email: user?.email,
        roleCode: 'INFLUENCER',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      breadcrumbs={[{ label: 'Assignments', path: '/influencer' }]}
      onBack={() => navigate('/influencer')}
      backLabel="Back to Assignments"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 1. Brief & Deliverables Card */}
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
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h2">Campaign Deliverables Brief</Typography>
                {assignment?.rateStatus && (
                  <StatusChip category="RATE_STATUS" code={assignment.rateStatus} />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Assigned on{' '}
                {assignment?.createdOn
                  ? new Date(assignment.createdOn).toLocaleDateString('en-IN')
                  : 'Recent'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
                onClick={() =>
                  navigate(`/influencer/chats?campaignId=${assignment?.campaignId}`)
                }
              >
                Message Agency
              </Button>

              <Button
                variant={isRateSubmitted ? 'outlined' : 'contained'}
                startIcon={<EditNoteRoundedIcon fontSize="small" />}
                onClick={() => setRateDialogOpen(true)}
                disabled={isLoading}
                sx={{ minWidth: 160 }}
              >
                {isRateSubmitted ? 'Revise Rate Quote' : 'Submit Commercial Rate'}
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              padding: '16px',
              backgroundColor: theme.palette.tokens.fieldBg,
              borderRadius: `${theme.customRadii.inner}px`,
              mb: 3,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', mb: 0.5 }}
            >
              DELIVERABLE SPECIFICATIONS
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {assignment?.deliverables ||
                '1x Instagram Reel (60s) + 2x Story Frames with swipe-up link'}
            </Typography>
          </Box>

          {/* Submitted Commercial Rate View */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2.5, sm: 4 },
              pt: 1,
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
              >
                MY COMMERCIAL QUOTE
              </Typography>
              {assignment?.influencerRate ? (
                <MoneyText
                  amount={assignment.influencerRate}
                  currency={assignment.currency}
                  variant="h3"
                />
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.tokens.accentText, fontWeight: 600 }}
                >
                  Quote Required
                </Typography>
              )}
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
              >
                AGREEMENT STATUS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: isApproved
                    ? theme.palette.tokens.positiveText
                    : theme.palette.tokens.textPrimary,
                }}
              >
                {isApproved ? 'Approved & Locked' : 'Pending Agency Review'}
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* 2. Approval Event Status Timeline */}
        <Card
          sx={{
            padding: `${theme.customSpacing.cardPadding}px`,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.surface,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
          }}
        >
          <SectionHeading
            title="Approval & Delivery Timeline"
            subtitle="Chronological milestone events for this campaign assignment"
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: '#DEF2E5',
                  color: '#2E9E5B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Deliverable Brief Assigned
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  Invited by agency partner to submit commercial rate
                </Typography>
              </Box>
            </Box>

            {isRateSubmitted && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: '#DCEAFA',
                    color: '#2F80ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleRoundedIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Commercial Rate Submitted
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                    Quote received and sent to agency for margin calculation
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: isApproved ? '#DEF2E5' : '#FBF2D6',
                  color: isApproved ? '#2E9E5B' : '#B45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScheduleRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {isApproved ? 'Rate Approved by Agency' : 'Awaiting Agency Review'}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  {isApproved
                    ? 'Deliverables verified and approved for brand campaign'
                    : 'Agency reviewing submitted commercial rate'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Rate Dialog */}
      {assignment && (
        <SubmitRateDialog
          open={rateDialogOpen}
          mapperId={assignment.id}
          campaignName={`Campaign #${assignment.campaignId.slice(0, 8)}`}
          deliverables={assignment.deliverables || undefined}
          currentRate={assignment.influencerRate}
          loading={submitRateMutation.isPending}
          onSubmit={handleSubmitRate}
          onClose={() => setRateDialogOpen(false)}
        />
      )}
    </DashboardLayout>
  );
};
