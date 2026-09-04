import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { ConfirmDialog } from '@molecules';
import { useAuth, useToast } from '@hooks';
import { prefetchForRoute } from '@api';
import { getRoleDashboardPath } from '@routes/navConfig';

export const AcceptTermsOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { acceptTerms, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      const authResult = await acceptTerms();
      showSuccess('Platform terms accepted successfully.');
      if (!authResult.profileComplete) {
        navigate('/complete-profile', { replace: true });
      } else {
        const target = getRoleDashboardPath(authResult.roleCode);
        // Warm the dashboard's queries while the route chunk loads.
        prefetchForRoute(target);
        navigate(target, { replace: true });
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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: theme.palette.tokens.pageBg,
        backgroundImage: `radial-gradient(ellipse at 50% 0%, rgba(47, 128, 237, 0.08) 0%, rgba(237, 243, 249, 0) 65%)`,
        padding: { xs: '24px 16px 40px', sm: '40px 24px 60px' },
      }}
    >
      <Card
        sx={{
          position: 'relative',
          my: 'auto',
          width: '100%',
          maxWidth: 620,
          flexShrink: 0,
          padding: {
            xs: '24px 18px 28px',
            sm: '36px 36px 32px',
          },
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: '0 20px 48px -12px rgba(16, 24, 40, 0.07), 0 2px 6px rgba(16, 24, 40, 0.03)',
        }}
      >
        {/* Top-Right Close Button */}
        <IconButton
          aria-label="close"
          onClick={() => setConfirmCloseOpen(true)}
          disabled={loading}
          sx={{
            position: 'absolute',
            top: { xs: 14, sm: 20 },
            right: { xs: 14, sm: 20 },
            color: theme.palette.tokens.textSecondary,
            '&:hover': {
              backgroundColor: theme.palette.tokens.fieldBg,
              color: theme.palette.tokens.textPrimary,
            },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        {/* Brand / Header Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(47, 128, 237, 0.16)',
              mb: 1.75,
            }}
          >
            <ShieldRoundedIcon sx={{ fontSize: 28 }} />
          </Box>

          <Chip
            label="TERMS & COMPLIANCE"
            size="small"
            sx={{
              height: 24,
              px: 1,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              backgroundColor: theme.palette.tokens.accentBg,
              color: theme.palette.tokens.accentText,
              borderRadius: `${theme.customRadii.pill}px`,
              mb: 1,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '22px', sm: '26px' },
              fontWeight: 700,
              color: theme.palette.tokens.textPrimary,
              mb: 0.5,
            }}
          >
            Platform Terms & Conditions
          </Typography>

          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            Version 1.0 — Effective August 2026
          </Typography>
        </Box>

        {/* Scrollable Terms Content */}
        <Box
          sx={{
            maxHeight: 290,
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: theme.palette.tokens.fieldBg,
            borderRadius: `${theme.customRadii.inner}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            mb: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 700, color: theme.palette.tokens.textPrimary }}
            >
              1. Commercial Terms & Segregated Rates
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', lineHeight: 1.6 }}
            >
              Influencers submit binding rates for campaign deliverables. Agencies manage and
              approve client margins. Brand users review final agreed client rates. Rates and
              commercials are strictly confidential and segregated by role.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 700, color: theme.palette.tokens.textPrimary }}
            >
              2. Confidentiality & Data Privacy
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', lineHeight: 1.6 }}
            >
              All campaign briefs, rate structures, performance metrics, and chat communications are
              confidential and protected by end-to-end role-based data isolation.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 700, color: theme.palette.tokens.textPrimary }}
            >
              3. Deliverables & Timeline Compliance
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', lineHeight: 1.6 }}
            >
              Creators agree to deliver content aligned with agreed deadlines and guidelines.
              Payments are disbursed following agency verification and brand approval.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="body2"
              sx={{ mb: 0.5, fontWeight: 700, color: theme.palette.tokens.textPrimary }}
            >
              4. Code of Conduct & Integrity
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, display: 'block', lineHeight: 1.6 }}
            >
              Users must represent metrics and deliverables truthfully. Fraudulent activity or
              artificial engagement inflation is grounds for immediate account termination.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Box
            sx={{
              padding: '12px 16px',
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tokens.negativeBg,
              border: `1px solid ${theme.palette.tokens.negative}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2.5,
            }}
          >
            <ErrorOutlineRoundedIcon
              sx={{ color: theme.palette.tokens.negative, fontSize: 20, flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.tokens.negativeText, fontWeight: 600 }}
            >
              {error}
            </Typography>
          </Box>
        )}

        {/* Footer Actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 2.5,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}
        >
          <Button
            variant="text"
            onClick={() => setConfirmCloseOpen(true)}
            disabled={loading}
            startIcon={<CloseRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              color: theme.palette.tokens.textSecondary,
              fontWeight: 600,
              '&:hover': {
                color: theme.palette.tokens.negative,
                backgroundColor: theme.palette.tokens.negativeBg,
              },
            }}
          >
            Close
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={handleAccept}
            disabled={loading}
            endIcon={loading ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              minWidth: { xs: '100%', sm: 190 },
              height: 46,
              fontSize: '15px',
              fontWeight: 800,
              borderRadius: `${theme.customRadii.pill}px`,
              boxShadow: '0 4px 14px rgba(47, 128, 237, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(47, 128, 237, 0.45)',
              },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Accept & Proceed'}
          </Button>
        </Box>

        {/* Security assurance */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            mt: 2.5,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 14, color: theme.palette.tokens.textSecondary }} />
          <Typography
            variant="caption"
            sx={{ color: theme.palette.tokens.textSecondary, fontSize: '11px' }}
          >
            Protected by Fetch platform security & role-based isolation
          </Typography>
        </Box>
      </Card>

      {/* Close / Logout Confirmation Dialog */}
      <ConfirmDialog
        open={confirmCloseOpen}
        title="Exit Terms Acceptance?"
        body="You must accept the platform Terms & Conditions to access your account workspace. If you close now, you will be returned to the login screen."
        confirmText="Exit to Login"
        cancelText="Review Terms"
        variant="destructive"
        onConfirm={async () => {
          setConfirmCloseOpen(false);
          await logout();
        }}
        onCancel={() => setConfirmCloseOpen(false)}
      />
    </Box>
  );
};
