import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { ConfirmDialog } from '@molecules';
import { useCategories } from '@api';
import { UpdateProfileSchema } from '@contracts';
import { useAuth, useToast } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';
import { capitalizeWords, parseShorthandNumber, formatShorthandNumber } from '@utils';

export const CompleteProfileOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, roleCode, completeProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const isInfluencer = roleCode === 'INFLUENCER';
  const { data: influencerCategoriesData } = useCategories('INFLUENCER');
  const influencerCategoryOptions = (influencerCategoriesData || []).map((c) => c.name);

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  // Creator-only onboarding fields — they land on influencer_detail, not profile.
  const [city, setCity] = useState(user?.influencer?.location || '');
  const [category, setCategory] = useState(user?.influencer?.category || '');
  const [instagram, setInstagram] = useState(user?.influencer?.instagram || '');
  const [youtube, setYoutube] = useState(user?.influencer?.youtube || '');
  const [followers, setFollowers] = useState<string>(
    user?.influencer?.followers ? formatShorthandNumber(user.influencer.followers) : '',
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    let parsedFollowers: number | undefined = undefined;
    if (followers.trim()) {
      const parsed = parseShorthandNumber(followers);
      if (parsed === null || parsed < 0) {
        setFieldErrors({ followers: 'Must be a valid positive number (e.g. 10k, 100k, 1m)' });
        return;
      }
      parsedFollowers = parsed;
    }

    const payload = {
      fullName: fullName.trim(),
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      ...(isInfluencer
        ? {
            influencer: {
              location: city.trim() || undefined,
              category: category.trim() || undefined,
              instagram: instagram.trim() || undefined,
              youtube: youtube.trim() || undefined,
              followers: parsedFollowers,
            },
          }
        : {}),
    };

    const validation = UpdateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        // Creator fields are nested under influencerDetail; key on the leaf.
        const field = err.path[err.path.length - 1];
        if (field !== undefined) {
          errors[String(field)] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const authResult = await completeProfile(payload);
      showSuccess('Profile updated successfully.');
      navigate(getRoleDashboardPath(authResult.roleCode), { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to complete profile.';
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
              onChange={(e) => setFullName(capitalizeWords(e.target.value))}
              error={Boolean(fieldErrors.fullName)}
              helperText={fieldErrors.fullName}
              fullWidth
              autoFocus
              disabled={loading}
            />

            <TextField
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(capitalizeWords(e.target.value))}
              error={Boolean(fieldErrors.displayName)}
              helperText={fieldErrors.displayName}
              fullWidth
              disabled={loading}
            />

            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(capitalizeWords(e.target.value))}
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

                <Autocomplete
                  freeSolo
                  options={influencerCategoryOptions}
                  value={category}
                  onInputChange={(_, newInputValue) => setCategory(newInputValue)}
                  onChange={(_, newValue) => setCategory(newValue || '')}
                  disabled={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Influencer Category"
                      placeholder="Select or enter category (e.g. Fashion & Lifestyle)"
                      error={Boolean(fieldErrors.category)}
                      helperText={fieldErrors.category || 'Creator niche / content domain'}
                      fullWidth
                    />
                  )}
                />

                <TextField
                  label="Estimated Total Followers"
                  placeholder="e.g. 10k, 100k, 1m"
                  value={followers}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/-/g, '');
                    setFollowers(cleaned);
                    if (cleaned.trim() && parseShorthandNumber(cleaned) === null) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        followers: 'Enter valid followers (e.g. 10k, 100k, 1m)',
                      }));
                    } else {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.followers;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => {
                    if (followers.trim()) {
                      const parsed = parseShorthandNumber(followers);
                      if (parsed !== null) {
                        setFollowers(formatShorthandNumber(parsed));
                      }
                    }
                  }}
                  error={Boolean(fieldErrors.followers)}
                  helperText={
                    fieldErrors.followers ||
                    (followers && parseShorthandNumber(followers) !== null
                      ? `${parseShorthandNumber(followers)?.toLocaleString('en-IN')} followers`
                      : 'Format: 10k, 100k, 1m')
                  }
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
