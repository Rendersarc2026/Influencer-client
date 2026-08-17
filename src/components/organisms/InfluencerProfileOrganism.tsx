import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { useUpdateInfluencerProfile, useCategories } from '@api';
import { UpdateProfileSchema, UpdateProfileRequest, CategoryTypeCode} from '@contracts';
import { useAuth, useToast } from '@hooks';
import { capitalizeWords, parseShorthandNumber, formatShorthandNumber } from '@utils';

export const InfluencerProfileOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const updateProfileMutation = useUpdateInfluencerProfile();
  const { data: influencerCategoriesData } = useCategories(CategoryTypeCode.INFLUENCER);
  const influencerCategoryOptions = (influencerCategoriesData || []).map((c) => c.name);

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  // Location, handles and reach live on the creator's detail row now.
  const [city, setCity] = useState(user?.influencer?.location || '');
  const [category, setCategory] = useState(user?.influencer?.category || '');
  const [instagram, setInstagram] = useState(user?.influencer?.instagram || '');
  const [youtube, setYoutube] = useState(user?.influencer?.youtube || '');
  const [followers, setFollowers] = useState(
    user?.influencer?.followers ? formatShorthandNumber(user.influencer.followers) : '',
  );
  const [commercialMin, setCommercialMin] = useState(
    user?.influencer?.avgCommercialMin ? String(user.influencer.avgCommercialMin) : '',
  );
  const [commercialMax, setCommercialMax] = useState(
    user?.influencer?.avgCommercialMax ? String(user.influencer.avgCommercialMax) : '',
  );
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.fullName || '');
      setDisplayName(user.profile.displayName || '');
      setBio(user.profile.bio || '');
    }
    const detail = user?.influencer;
    if (detail) {
      setCity(detail.location || '');
      setCategory(detail.category || '');
      setInstagram(detail.instagram || '');
      setYoutube(detail.youtube || '');
      setFollowers(detail.followers ? formatShorthandNumber(detail.followers) : '');
      setCommercialMin(detail.avgCommercialMin ? String(detail.avgCommercialMin) : '');
      setCommercialMax(detail.avgCommercialMax ? String(detail.avgCommercialMax) : '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
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

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      influencer: {
        location: city.trim() || undefined,
        category: category.trim() || undefined,
        instagram: instagram.trim() || undefined,
        youtube: youtube.trim() || undefined,
        followers: parsedFollowers,
        avgCommercialMin: commercialMin ? Number(commercialMin) : undefined,
        avgCommercialMax: commercialMax ? Number(commercialMax) : undefined,
      },
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
      await updateProfileMutation.mutateAsync(payload);
      showSuccess('Profile updated successfully.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to update profile.');
    }
  };

  return (
    <DashboardLayout
      title="Influencer Profile & Handles"
      subtitle="Manage your public handle representation, audience size, and commercial bio"
      navItems={navConfig.INFLUENCER}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Influencer',
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
                onChange={(e) => setFullName(capitalizeWords(e.target.value))}
                error={Boolean(fieldErrors.fullName)}
                helperText={fieldErrors.fullName}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />

              <TextField
                label="Public Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(capitalizeWords(e.target.value))}
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
                disabled={updateProfileMutation.isPending}
              />

              <TextField
                label="City / Location"
                placeholder="e.g. Mumbai, Bengaluru"
                value={city}
                onChange={(e) => setCity(capitalizeWords(e.target.value))}
                error={Boolean(fieldErrors.city)}
                helperText={fieldErrors.city}
                fullWidth
                disabled={updateProfileMutation.isPending}
              />
            </Box>

            <Autocomplete
              freeSolo
              options={influencerCategoryOptions}
              value={category}
              onInputChange={(_, newInputValue) => setCategory(newInputValue)}
              onChange={(_, newValue) => setCategory(newValue || '')}
              disabled={updateProfileMutation.isPending}
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
