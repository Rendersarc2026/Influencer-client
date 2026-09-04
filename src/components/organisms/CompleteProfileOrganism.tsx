import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import AlternateEmailRoundedIcon from '@mui/icons-material/AlternateEmailRounded';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useTheme } from '@mui/material/styles';
import { ConfirmDialog, PhoneField } from '@molecules';
import { useCategories, useLocations } from '@api';
import { UpdateProfileSchema, CategoryTypeCode } from '@contracts';
import { z } from 'zod';
import { useAuth, useToast } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';
import { capitalizeWords, parseShorthandNumber, formatShorthandNumber } from '@utils';
import { BrandLogo } from '@atoms';

export const CompleteProfileOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, roleCode, completeProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const isInfluencer = roleCode === 'INFLUENCER';
  const isBrand = roleCode === 'BRAND';

  const { data: influencerCategoriesData } = useCategories(CategoryTypeCode.INFLUENCER);
  const influencerCategoryOptions = (influencerCategoriesData || []).map((c) => c.name);

  const { data: locationsData } = useLocations();
  const locationOptions = (locationsData || []).map((l) => l.name);

  const { data: brandCategoriesData } = useCategories(CategoryTypeCode.BRAND);
  const brandCategoryOptions = (brandCategoriesData || []).map((c) => c.name);

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(
    user?.profile?.displayName || user?.brandName || '',
  );
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [brandCategory, setBrandCategory] = useState('');
  const [website, setWebsite] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  // Creator-only onboarding fields — they land on influencer_detail, not profile.
  const [city, setCity] = useState(user?.influencer?.location || '');
  const [regions, setRegions] = useState<string[]>(
    user?.influencer?.regions || user?.influencer?.influencingRegions || [],
  );
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

    const normalizeUrl = (val: string): string | undefined => {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      return `https://${trimmed}`;
    };

    let parsedFollowers: number | undefined = undefined;
    if (followers.trim()) {
      const parsed = parseShorthandNumber(followers);
      if (parsed === null || parsed < 0) {
        setFieldErrors({ followers: 'Must be a valid positive number (e.g. 10k, 100k, 1m)' });
        return;
      }
      parsedFollowers = parsed;
    }

    const normalizeSocialUrl = (
      val: string,
      domain: 'instagram.com' | 'youtube.com',
    ): string | undefined => {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith(domain) || trimmed.startsWith(`www.${domain}`))
        return `https://${trimmed}`;
      if (domain === 'instagram.com') {
        const handle = trimmed.replace(/^@/, '');
        return `https://instagram.com/${handle}`;
      }
      if (domain === 'youtube.com') {
        const handle = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
        return `https://youtube.com/${handle}`;
      }
      return `https://${trimmed}`;
    };

    const payload = {
      fullName: fullName.trim(),
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      city: city.trim() || undefined,
      ...(isBrand
        ? {
            industry: brandCategory.trim() || undefined,
            website: normalizeUrl(website),
            contactPhone: contactPhone.trim() || undefined,
            brand: {
              name: displayName.trim() || undefined,
              contactPerson: fullName.trim() || undefined,
              industry: brandCategory.trim() || undefined,
              website: normalizeUrl(website),
              city: city.trim() || undefined,
              contactPhone: contactPhone.trim() || undefined,
              bio: bio.trim() || undefined,
            },
          }
        : {}),
      ...(isInfluencer
        ? {
            influencer: {
              location: city.trim() || undefined,
              regions: regions.length > 0 ? regions : undefined,
              influencingRegions: regions.length > 0 ? regions : undefined,
              category: category.trim() || undefined,
              instagram: normalizeSocialUrl(instagram, 'instagram.com'),
              youtube: normalizeSocialUrl(youtube, 'youtube.com'),
              followers: parsedFollowers,
            },
          }
        : {}),
    };

    const validation = UpdateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err: z.ZodIssue) => {
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
        {/* Header with Brand Logo and Pill Badge */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3.5,
            textAlign: 'center',
          }}
        >
          <BrandLogo
            size={52}
            sx={{
              borderRadius: `${theme.customRadii.inner}px`,
              boxShadow: '0 8px 24px rgba(47, 128, 237, 0.16)',
              mb: 1.75,
            }}
          />
          <Chip
            label={
              isInfluencer ? 'CREATOR ONBOARDING' : isBrand ? 'BRAND ONBOARDING' : 'PROFILE SETUP'
            }
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
            Complete Your Profile
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.tokens.textSecondary,
              maxWidth: 440,
            }}
          >
            {isInfluencer
              ? 'Set up your channel details, categories, and follower base to begin receiving campaign deals.'
              : isBrand
                ? 'Configure your company profile and contact details to begin launching campaigns.'
                : `Setup your account details for the ${roleCode || 'user'} workspace.`}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Section 1: Basic Identity */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '7px',
                    backgroundColor: theme.palette.tokens.accentBg,
                    color: theme.palette.tokens.accentText,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: theme.palette.tokens.textSecondary,
                  }}
                >
                  {isBrand ? 'Company Identity' : 'Identity Details'}
                </Typography>
              </Box>

              <Box
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
              >
                <TextField
                  label="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(capitalizeWords(e.target.value))}
                  error={Boolean(fieldErrors.fullName)}
                  helperText={fieldErrors.fullName}
                  fullWidth
                  autoFocus
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineRoundedIcon
                          sx={{ fontSize: 19, color: theme.palette.tokens.textSecondary }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label={isBrand ? 'Brand Display Name *' : 'Display Name'}
                  value={displayName}
                  placeholder={isBrand ? 'e.g. Jos Alukkas' : 'e.g. Alex Influencer'}
                  onChange={(e) => setDisplayName(capitalizeWords(e.target.value))}
                  error={Boolean(fieldErrors.displayName)}
                  helperText={fieldErrors.displayName}
                  fullWidth
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AlternateEmailRoundedIcon
                          sx={{ fontSize: 18, color: theme.palette.tokens.textSecondary }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            {/* Section 2: Brand Company & Contact (Brand only) */}
            {isBrand && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '7px',
                      backgroundColor: theme.palette.tokens.positiveBg,
                      color: theme.palette.tokens.positiveText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BusinessRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: theme.palette.tokens.textSecondary,
                    }}
                  >
                    Company & Contact Info
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <PhoneField
                    label="Contact Phone"
                    value={contactPhone}
                    onChange={setContactPhone}
                    error={Boolean(fieldErrors.contactPhone)}
                    helperText={fieldErrors.contactPhone || 'Manager phone line'}
                    disabled={loading}
                  />

                  <TextField
                    label="Official Website"
                    placeholder="https://brand.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    error={Boolean(fieldErrors.website)}
                    helperText={fieldErrors.website}
                    fullWidth
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LanguageRoundedIcon
                            sx={{ fontSize: 18, color: theme.palette.tokens.textSecondary }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  <Autocomplete
                    freeSolo
                    options={brandCategoryOptions}
                    value={brandCategory}
                    onInputChange={(_, newInputValue) => setBrandCategory(newInputValue)}
                    onChange={(_, newValue) => setBrandCategory(newValue || '')}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Brand Category / Industry"
                        placeholder="Select or enter industry"
                        error={Boolean(fieldErrors.industry)}
                        helperText={fieldErrors.industry || 'Brand market domain'}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <CategoryRoundedIcon
                                  sx={{ fontSize: 18, color: theme.palette.tokens.textSecondary }}
                                />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={locationOptions}
                    value={city}
                    onInputChange={(_, newInputValue) => setCity(capitalizeWords(newInputValue))}
                    onChange={(_, newValue) => setCity(newValue ? capitalizeWords(newValue) : '')}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="City / Headquarters"
                        placeholder="e.g. Kochi, Mumbai"
                        error={Boolean(fieldErrors.city)}
                        helperText={fieldErrors.city}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <LocationOnOutlinedIcon
                                  sx={{ fontSize: 19, color: theme.palette.tokens.textSecondary }}
                                />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>
              </Box>
            )}

            {/* Section 2: Creator Channels & Metrics (Influencer only) */}
            {isInfluencer && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '7px',
                      backgroundColor: theme.palette.tokens.purpleBg,
                      color: theme.palette.tokens.purpleText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: theme.palette.tokens.textSecondary,
                    }}
                  >
                    Social Channels & Audience
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    label="Instagram Profile URL"
                    placeholder="https://instagram.com/username"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    error={Boolean(fieldErrors.instagram)}
                    helperText={fieldErrors.instagram || 'Full Instagram profile or handle'}
                    fullWidth
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InstagramIcon sx={{ fontSize: 20, color: '#E1306C' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    label="YouTube Channel URL"
                    placeholder="https://youtube.com/@channel"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    error={Boolean(fieldErrors.youtube)}
                    helperText={fieldErrors.youtube || 'Full YouTube channel link'}
                    fullWidth
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <YouTubeIcon sx={{ fontSize: 20, color: '#FF0000' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mb: 2,
                  }}
                >
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
                        placeholder="Select or enter category (e.g. Gaming & Esports)"
                        error={Boolean(fieldErrors.category)}
                        helperText={fieldErrors.category || 'Creator niche / content domain'}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <CategoryRoundedIcon
                                  sx={{ fontSize: 18, color: theme.palette.tokens.textSecondary }}
                                />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  <Autocomplete
                    fullWidth
                    freeSolo
                    options={locationOptions}
                    value={city}
                    onInputChange={(_, newInputValue) => setCity(capitalizeWords(newInputValue))}
                    onChange={(_, newValue) => setCity(newValue ? capitalizeWords(newValue) : '')}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="City / Base Location"
                        placeholder="Select or enter location (e.g. Mumbai)"
                        error={Boolean(fieldErrors.city)}
                        helperText={fieldErrors.city}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <LocationOnOutlinedIcon
                                  sx={{ fontSize: 19, color: theme.palette.tokens.textSecondary }}
                                />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={locationOptions}
                    value={regions}
                    onChange={(_, newValue) => {
                      const formatted = (newValue || [])
                        .map((v) => (typeof v === 'string' ? capitalizeWords(v.trim()) : v))
                        .filter(Boolean);
                      setRegions([...new Set(formatted)]);
                    }}
                    disabled={loading}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            sx={{
                              borderRadius: `${theme.customRadii.pill}px`,
                              backgroundColor: theme.palette.tokens.fieldBg,
                              fontWeight: 600,
                              fontSize: '12px',
                            }}
                            {...tagProps}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Influencing Regions (Optional)"
                        placeholder={
                          regions.length === 0
                            ? 'Select or type regions (e.g. Mumbai, Bangalore) and press Enter'
                            : ''
                        }
                        error={Boolean(fieldErrors.regions || fieldErrors.influencingRegions)}
                        helperText={
                          fieldErrors.regions ||
                          fieldErrors.influencingRegions ||
                          'Geographical regions or markets where your follower base is strongest'
                        }
                        fullWidth
                      />
                    )}
                  />
                </Box>

                <Box>
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PeopleAltRoundedIcon
                            sx={{ fontSize: 20, color: theme.palette.tokens.textSecondary }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Quick Preset Follower Badges */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      flexWrap: 'wrap',
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary, fontWeight: 600, mr: 0.5 }}
                    >
                      Quick select:
                    </Typography>
                    {['10k', '25k', '50k', '100k', '250k', '500k', '1M'].map((preset) => {
                      const isSelected = followers.toLowerCase() === preset.toLowerCase();
                      return (
                        <Chip
                          key={preset}
                          label={preset}
                          size="small"
                          clickable
                          onClick={() => {
                            setFollowers(preset);
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.followers;
                              return next;
                            });
                          }}
                          sx={{
                            height: 24,
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: `${theme.customRadii.pill}px`,
                            backgroundColor: isSelected
                              ? theme.palette.tokens.rail
                              : theme.palette.tokens.fieldBg,
                            color: isSelected ? '#FFFFFF' : theme.palette.tokens.textPrimary,
                            border: `1px solid ${isSelected ? theme.palette.tokens.rail : theme.palette.tokens.divider}`,
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              backgroundColor: isSelected
                                ? '#2D2E30'
                                : theme.palette.tokens.divider,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Section 3: Bio / Overview */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 0.5 }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '7px',
                    backgroundColor: theme.palette.tokens.fieldBg,
                    color: theme.palette.tokens.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <NotesRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: theme.palette.tokens.textSecondary,
                  }}
                >
                  {isBrand ? 'Company Overview' : 'About & Creator Bio'}
                </Typography>
              </Box>

              <TextField
                label={isBrand ? 'Company Bio / Overview' : 'Bio / Content Style'}
                placeholder={
                  isBrand
                    ? 'Brief description of your brand, industry positioning, and target campaign objectives...'
                    : 'Tell brands about your content niche, style, and audience demographics...'
                }
                multiline
                minRows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                error={Boolean(fieldErrors.bio)}
                helperText={fieldErrors.bio || 'Appears on your public profile summary (optional)'}
                fullWidth
                disabled={loading}
              />
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
                mt: 2.5,
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

          {/* Action Footer */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 3,
              mt: 3,
              borderTop: `1px solid ${theme.palette.tokens.divider}`,
              gap: 2,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            <Button
              variant="text"
              onClick={() => setConfirmLogoutOpen(true)}
              disabled={loading}
              startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                color: theme.palette.tokens.textSecondary,
                '&:hover': {
                  color: theme.palette.tokens.negative,
                  backgroundColor: theme.palette.tokens.negativeBg,
                },
              }}
            >
              Log Out
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !fullName.trim()}
              endIcon={loading ? undefined : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                minWidth: { xs: '100%', sm: 190 },
                height: 46,
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: `${theme.customRadii.pill}px`,
                boxShadow: '0 4px 14px rgba(47, 128, 237, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(47, 128, 237, 0.45)',
                },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Save & Continue'}
            </Button>
          </Box>

          {/* Security footnote */}
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
              Encrypted & secure connection • Role-isolated profile
            </Typography>
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
