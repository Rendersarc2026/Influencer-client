import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { useTheme } from '@mui/material/styles';
import { ConfirmDialog } from '@molecules';
import { useAuth, useToast } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const AcceptTermsOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { acceptTerms, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      const authResult = await acceptTerms();
      showSuccess('Platform terms accepted successfully.');
      if (!authResult.profileComplete) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate(getRoleDashboardPath(authResult.roleCode), { replace: true });
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to accept terms. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 600,
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldRoundedIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h2">Platform Terms & Conditions</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              Version 1.0 — Effective August 2026
            </Typography>
          </Box>
        </Box>

        {/* Scrollable Terms Content */}
        <Box
          sx={{
            maxHeight: 280,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: theme.palette.tokens.fieldBg,
            borderRadius: `${theme.customRadii.inner}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            mb: 3,
          }}
        >
          <Typography
            variant="body2"
            sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.tokens.textPrimary }}
          >
            1. Commercial Terms & Segregated Rates
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.tokens.textSecondary, display: 'block', mb: 2 }}
          >
            Influencers submit binding rates for campaign deliverables. Agencies manage and approve
            client margins. Brand users review final agreed client rates.
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.tokens.textPrimary }}
          >
            2. Confidentiality & Data Privacy
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.tokens.textSecondary, display: 'block', mb: 2 }}
          >
            All campaign briefs, rate structures, engagement metrics, and chat communications are
            confidential and protected by role-based isolation.
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 1.5, fontWeight: 600, color: theme.palette.tokens.textPrimary }}
          >
            3. Deliverables & Compliance
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
          >
            Creators agree to deliver content aligned with agreed deadlines. Payments are disbursed
            upon agency verification and brand approval.
          </Typography>
        </Box>

        {error && (
          <Typography
            variant="body2"
            sx={{ color: theme.palette.tokens.negative, mb: 2, textAlign: 'center' }}
          >
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="text"
            onClick={() => setConfirmLogoutOpen(true)}
            disabled={loading}
            sx={{ color: theme.palette.tokens.textSecondary }}
          >
            Log Out
          </Button>

          <Button
            variant="contained"
            onClick={handleAccept}
            disabled={loading}
            sx={{ minWidth: 160, height: 44 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Accept & Proceed'}
          </Button>
        </Box>
      </Card>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Log Out?"
        body="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          setConfirmLogoutOpen(false);
          await logout();
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </Box>
  );
};
