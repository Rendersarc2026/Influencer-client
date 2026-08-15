import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { ConfirmDialog } from '@molecules';
import { UpdateProfileSchema } from '@contracts';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const CompleteProfileOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, roleCode, completeProfile, logout } = useAuth();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const isInfluencer = roleCode === 'INFLUENCER';

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [instagram, setInstagram] = useState(user?.profile?.instagram || '');
  const [youtube, setYoutube] = useState(user?.profile?.youtube || '');
  const [followers, setFollowers] = useState<string>(
    user?.profile?.followers ? String(user.profile.followers) : '',
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const payload = {
      fullName: fullName.trim(),
      displayName: displayName.trim() || undefined,
      city: city.trim() || undefined,
      bio: bio.trim() || undefined,
      ...(isInfluencer
        ? {
            instagram: instagram.trim() || undefined,
            youtube: youtube.trim() || undefined,
            followers: followers ? parseInt(followers, 10) : undefined,
          }
        : {}),
    };

    const validation = UpdateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[String(err.path[0])] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const authResult = await completeProfile(payload);
      navigate(getRoleDashboardPath(authResult.roleCode), { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to complete profile.',
      );
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
          maxWidth: 540,
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
            <PersonOutlineRoundedIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h2">Complete Your Profile</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              Setup your account details for the {roleCode || 'user'} workspace
            </Typography>
          </Box>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={Boolean(fieldErrors.fullName)}
              helperText={fieldErrors.fullName}
              fullWidth
              autoFocus
              disabled={loading}
            />

            <TextField
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={Boolean(fieldErrors.displayName)}
              helperText={fieldErrors.displayName}
              fullWidth
              disabled={loading}
            />

            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={Boolean(fieldErrors.city)}
              helperText={fieldErrors.city}
              fullWidth
              disabled={loading}
            />

            {isInfluencer && (
              <>
                <TextField
                  label="Instagram Handle"
                  placeholder="@handle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  error={Boolean(fieldErrors.instagram)}
                  helperText={fieldErrors.instagram}
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="YouTube Channel"
                  placeholder="Channel name or link"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  error={Boolean(fieldErrors.youtube)}
                  helperText={fieldErrors.youtube}
                  fullWidth
                  disabled={loading}
                />

                <TextField
                  label="Estimated Total Followers"
                  type="number"
                  placeholder="e.g. 250000"
                  value={followers}
                  onChange={(e) => setFollowers(e.target.value)}
                  error={Boolean(fieldErrors.followers)}
                  helperText={fieldErrors.followers}
                  fullWidth
                  disabled={loading}
                />
              </>
            )}

            <TextField
              label="Bio / Overview"
              multiline
              minRows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              error={Boolean(fieldErrors.bio)}
              helperText={fieldErrors.bio}
              fullWidth
              disabled={loading}
            />
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
              type="submit"
              variant="contained"
              disabled={loading || !fullName.trim()}
              sx={{ minWidth: 160, height: 44 }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save & Continue'}
            </Button>
          </Box>
        </form>
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
