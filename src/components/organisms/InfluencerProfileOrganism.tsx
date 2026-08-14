import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { useUpdateInfluencerProfile } from '@api';
import { UpdateProfileSchema, UpdateProfileRequest } from '@contracts';
import { useAuth } from '@hooks';

export const InfluencerProfileOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const updateProfileMutation = useUpdateInfluencerProfile();

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [instagram, setInstagram] = useState(user?.profile?.instagram || '');
  const [youtube, setYoutube] = useState(user?.profile?.youtube || '');
  const [followers, setFollowers] = useState(
    user?.profile?.followers ? String(user.profile.followers) : '',
  );
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.fullName || '');
      setDisplayName(user.profile.displayName || '');
      setCity(user.profile.city || '');
      setInstagram(user.profile.instagram || '');
      setYoutube(user.profile.youtube || '');
      setFollowers(user.profile.followers ? String(user.profile.followers) : '');
      setBio(user.profile.bio || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setFieldErrors({});

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      displayName: displayName.trim() || undefined,
      city: city.trim() || undefined,
      instagram: instagram.trim() || undefined,
      youtube: youtube.trim() || undefined,
      followers: followers ? parseInt(followers, 10) : undefined,
      bio: bio.trim() || undefined,
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

    await updateProfileMutation.mutateAsync(payload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout
      title="Creator Profile & Handles"
      subtitle="Manage your public handle representation, audience size, and commercial bio"
      navItems={navConfig.INFLUENCER}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Creator',
        email: user?.email,
        roleCode: 'INFLUENCER',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Card
        sx={{
          maxWidth: 680,
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
        }}
      >
        <SectionHeading
          title="Account & Channel Information"
          subtitle="Accurate handles allow agencies and brands to discover your content"
        />

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Full Legal Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={Boolean(fieldErrors.fullName)}
                helperText={fieldErrors.fullName}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />

              <TextField
                label="Public Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={Boolean(fieldErrors.displayName)}
                helperText={fieldErrors.displayName}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Instagram Handle"
                placeholder="@handle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                error={Boolean(fieldErrors.instagram)}
                helperText={fieldErrors.instagram}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />

              <TextField
                label="YouTube Channel"
                placeholder="Channel URL or Handle"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                error={Boolean(fieldErrors.youtube)}
                helperText={fieldErrors.youtube}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Estimated Followers"
                type="number"
                placeholder="e.g. 350000"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                error={Boolean(fieldErrors.followers)}
                helperText={fieldErrors.followers}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />

              <TextField
                label="City / Location"
                placeholder="e.g. Mumbai, Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={Boolean(fieldErrors.city)}
                helperText={fieldErrors.city}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />
            </Box>

            <TextField
              label="Bio & Category Focus"
              multiline
              minRows={3}
              placeholder="Tell agencies about your content style, audience demographics, and past brand collaborations..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              error={Boolean(fieldErrors.bio)}
              helperText={fieldErrors.bio}
              fullWidth
              disabled={updateProfileMutation.isPending}
            />

            {savedSuccess && (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.tokens.positive, fontWeight: 600 }}
              >
                Profile details saved successfully!
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveRoundedIcon fontSize="small" />}
                disabled={updateProfileMutation.isPending || !fullName.trim()}
                sx={{ minWidth: 160, height: 44 }}
              >
                {updateProfileMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Save Profile'
                )}
              </Button>
            </Box>
          </Box>
        </form>
      </Card>
    </DashboardLayout>
  );
};
