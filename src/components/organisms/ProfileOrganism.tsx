import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { getNavItemsForRole } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { apiClient } from '@api';
import { UpdateProfileSchema, UpdateProfileRequest, UserResponse } from '@contracts';
import { useAuth } from '@hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const ProfileOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, roleCode, logout, refetchUser } = useAuth();
  const queryClient = useQueryClient();

  const isInfluencer = roleCode === 'INFLUENCER';

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
  const [errorMsg, setErrorMsg] = useState('');
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

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await apiClient.put<{ message: string; user: UserResponse }>(
        '/users/profile',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refetchUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to update profile.',
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg('');
    setFieldErrors({});

    const payload: UpdateProfileRequest = {
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

    await updateProfileMutation.mutateAsync(payload);
  };

  const getPageTitle = () => {
    switch (roleCode) {
      case 'INFLUENCER':
        return 'Creator Profile & Handles';
      case 'BRAND':
        return 'Brand Manager Profile';
      case 'AGENCY':
        return 'Agency Profile & Settings';
      default:
        return 'Account Profile';
    }
  };

  const getPageSubtitle = () => {
    switch (roleCode) {
      case 'INFLUENCER':
        return 'Manage your public handle representation, audience size, and commercial bio';
      case 'BRAND':
        return 'Manage your organization profile, team contact details, and display preferences';
      case 'AGENCY':
        return 'Manage agency lead information, workspace representation, and contact details';
      default:
        return 'Manage your administrator account details and platform preferences';
    }
  };

  return (
    <DashboardLayout
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
      navItems={getNavItemsForRole(roleCode || undefined)}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || user?.email || 'User',
        email: user?.email,
        roleCode: roleCode || 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Card
        sx={{
          maxWidth: 720,
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                color: theme.palette.tokens.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonOutlineRoundedIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h2">{user?.profile?.fullName || 'User Profile'}</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Chip label={roleCode || 'USER'} size="small" />
        </Box>

        <SectionHeading
          title="Personal & Workspace Details"
          subtitle="Update your personal details and contact information"
        />

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                placeholder="e.g. Alex Creator"
                onChange={(e) => setDisplayName(e.target.value)}
                error={Boolean(fieldErrors.displayName)}
                helperText={fieldErrors.displayName}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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

              <TextField
                label="Account Email (Read-Only)"
                value={user?.email || ''}
                disabled
                fullWidth
              />
            </Box>

            {isInfluencer && (
              <>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
              </>
            )}

            <TextField
              label="Bio & Overview"
              multiline
              minRows={3}
              placeholder="A brief overview of your background, experience, or channel category..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              error={Boolean(fieldErrors.bio)}
              helperText={fieldErrors.bio}
              fullWidth
              disabled={updateProfileMutation.isPending}
            />

            {savedSuccess && (
              <Box
                sx={{
                  padding: '10px 14px',
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: '#DEF2E5',
                  border: `1px solid ${theme.palette.tokens.positive}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.tokens.positive, fontWeight: 600 }}
                >
                  ✓ Profile details saved successfully!
                </Typography>
              </Box>
            )}

            {errorMsg && (
              <Box
                sx={{
                  padding: '10px 14px',
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: '#FDE8E8',
                  border: `1px solid ${theme.palette.tokens.negative}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.tokens.negative, fontWeight: 600 }}
                >
                  {errorMsg}
                </Typography>
              </Box>
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
