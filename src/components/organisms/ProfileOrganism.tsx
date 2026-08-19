import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { getNavItemsForRole } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { apiClient, useCategories, useLocations, useBrandProfile, useUpdateBrandProfile } from '@api';
import {
  UpdateProfileSchema,
  UpdateProfileRequest,
  UpdateBrandSchema,
  UpdateBrandRequest,
  UserResponse,
  CategoryTypeCode,
} from '@contracts';
import { z } from 'zod';
import { useAuth, useToast } from '@hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { capitalizeWords, parseShorthandNumber, formatShorthandNumber, safeImageUrl } from '@utils';

const normalizeUrl = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export const ProfileOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { user, roleCode, logout, refetchUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const isInfluencer = roleCode === 'INFLUENCER';
  const isBrand = roleCode === 'BRAND';

  const { data: influencerCategoriesData } = useCategories(CategoryTypeCode.INFLUENCER);
  const influencerCategoryOptions = (influencerCategoriesData || []).map((c) => c.name);

  const { data: locationsData } = useLocations();
  const locationOptions = (locationsData || []).map((l) => l.name);

  const { data: brandCategoriesData } = useCategories(CategoryTypeCode.BRAND);
  const brandCategoryOptions = (brandCategoriesData || []).map((c) => c.name);

  const { data: brandData } = useBrandProfile(isBrand);
  const updateBrandProfileMutation = useUpdateBrandProfile();

  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '');
  const [brandCategory, setBrandCategory] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(user?.influencer?.location || '');
  const [regions, setRegions] = useState<string[]>(
    user?.influencer?.regions || user?.influencer?.influencingRegions || [],
  );
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
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isBrand && brandData) {
      setFullName(brandData.contactPerson || user?.profile?.fullName || '');
      setDisplayName(brandData.name || user?.profile?.displayName || '');
      setBrandCategory(brandData.industry || '');
      setContactPhone(brandData.contactPhone || user?.phone || '');
      setWebsite(brandData.website || '');
      setCity(brandData.city || '');
      setAddress(brandData.address || '');
      setLogoUrl(brandData.logoUrl || user?.profile?.avatarUrl || '');
      setBio(brandData.bio || user?.profile?.bio || '');
    } else if (user?.profile) {
      setFullName(user.profile.fullName || '');
      setDisplayName(user.profile.displayName || '');
      setBio(user.profile.bio || '');
    }
    const detail = user?.influencer;
    if (detail) {
      setCity(detail.location || '');
      setRegions(detail.regions || detail.influencingRegions || []);
      setCategory(detail.category || '');
      setInstagram(detail.instagram || '');
      setYoutube(detail.youtube || '');
      setFollowers(detail.followers ? formatShorthandNumber(detail.followers) : '');
      setCommercialMin(detail.avgCommercialMin ? String(detail.avgCommercialMin) : '');
      setCommercialMax(detail.avgCommercialMax ? String(detail.avgCommercialMax) : '');
    }
  }, [user, brandData, isBrand]);

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
      showSuccess('Profile updated successfully.');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to update profile.';
      setErrorMsg(msg);
      showError(msg);
    },
  });

  const fieldsLocked = updateProfileMutation.isPending || updateBrandProfileMutation.isPending;

  const validatePhone = (val: string) => {
    if (!val) return '';
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
    if (!phoneRegex.test(val)) return 'Please enter a valid phone number (e.g. +91 9876543210)';
    return '';
  };

  const validateHttpUrl = (val: string) => {
    if (!val.trim()) return '';
    const normalized = normalizeUrl(val);
    if (!normalized) return '';
    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        return 'Please enter a valid URL (e.g. https://brand.com)';
      }
      return '';
    } catch {
      return 'Please enter a valid URL (e.g. https://brand.com)';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setErrorMsg('');
    setFieldErrors({});

    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      setFieldErrors({ fullName: 'Full Legal Name is required and cannot be whitespace only' });
      return;
    }

    if (isBrand) {
      const trimmedDisplayName = displayName.trim();
      if (!trimmedDisplayName) {
        setFieldErrors({ displayName: 'Brand Name is required' });
        return;
      }

      if (contactPhone.trim()) {
        const pErr = validatePhone(contactPhone.trim());
        if (pErr) {
          setFieldErrors({ contactPhone: pErr });
          return;
        }
      }

      if (website.trim()) {
        const wErr = validateHttpUrl(website);
        if (wErr) {
          setFieldErrors({ website: wErr });
          return;
        }
      }

      if (logoUrl.trim()) {
        const lErr = validateHttpUrl(logoUrl);
        if (lErr) {
          setFieldErrors({ logoUrl: lErr });
          return;
        }
      }

      const brandPayload: UpdateBrandRequest = {
        name: trimmedDisplayName,
        contactPerson: trimmedFullName,
        industry: brandCategory.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        website: normalizeUrl(website),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        logoUrl: normalizeUrl(logoUrl),
        bio: bio.trim() || undefined,
      };

      const validation = UpdateBrandSchema.safeParse(brandPayload);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach((err: z.ZodIssue) => {
          const field = err.path[err.path.length - 1];
          if (field !== undefined) {
            errors[String(field)] = err.message;
          }
        });
        setFieldErrors(errors);
        return;
      }

      try {
        await updateBrandProfileMutation.mutateAsync(brandPayload);
        await queryClient.invalidateQueries({ queryKey: ['brand', 'profile'] });
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        await queryClient.invalidateQueries({ queryKey: ['agency', 'brands'] });
        await refetchUser();
        showSuccess('Brand details saved successfully.');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        const msg =
          errorObj?.response?.data?.message || errorObj?.message || 'Failed to update brand details.';
        setErrorMsg(msg);
        showError(msg);
      }
      return;
    }

    let parsedFollowers: number | undefined = undefined;
    if (followers.trim()) {
      const parsed = parseShorthandNumber(followers);
      if (parsed === null || parsed < 0) {
        setFieldErrors({ followers: 'Must be a valid positive number (e.g. 10k, 100k, 1m)' });
        return;
      }
      parsedFollowers = parsed;
    }

    const normalizeSocialUrl = (val: string, domain: 'instagram.com' | 'youtube.com'): string | undefined => {
      const trimmed = val.trim();
      if (!trimmed) return undefined;
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith(domain) || trimmed.startsWith(`www.${domain}`)) return `https://${trimmed}`;
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

    const payload: UpdateProfileRequest = {
      fullName: trimmedFullName,
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
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
              avgCommercialMin: commercialMin ? Number(commercialMin) : undefined,
              avgCommercialMax: commercialMax ? Number(commercialMax) : undefined,
            },
          }
        : {}),
    };

    const validation = UpdateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err: z.ZodIssue) => {
        const field = err.path[err.path.length - 1];
        if (field !== undefined) {
          errors[String(field)] = err.message;
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
        return 'Influencer Profile & Handles';
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
        roleCode: roleCode || 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ width: '100%', maxWidth: 880, pb: 4 }}>
        <Card
          sx={{
            padding: `${theme.customSpacing.cardPadding}px`,
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.surface,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isBrand && (logoUrl || brandData?.logoUrl) ? (
                <Avatar
                  src={safeImageUrl(logoUrl || brandData?.logoUrl)}
                  alt={displayName || brandData?.name || 'Brand Logo'}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: `${theme.customRadii.inner}px`,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    border: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  {(displayName || brandData?.name || 'B').charAt(0).toUpperCase()}
                </Avatar>
              ) : (
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
                  {isBrand ? (
                    <BusinessRoundedIcon fontSize="medium" />
                  ) : (
                    <PersonOutlineRoundedIcon fontSize="medium" />
                  )}
                </Box>
              )}
              <Box>
                <Typography variant="h2">
                  {isBrand
                    ? displayName || brandData?.name || fullName || 'Brand Profile'
                    : user?.profile?.fullName || 'User Profile'}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                  {brandData?.contactEmail || user?.email}
                </Typography>
              </Box>
            </Box>
            <Chip label={roleCode || 'USER'} size="small" />
          </Box>

          <SectionHeading
            title={isBrand ? 'Personal & Brand Details' : 'Personal & Workspace Details'}
            subtitle={
              isBrand
                ? 'Update your organization profile, team contact details, and brand representation'
                : 'Update your personal details and contact information'
            }
          />

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 3 }}>
              {/* Brand Manager specific full form */}
              {isBrand ? (
                <>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Full Legal Name / Contact Person *"
                      value={fullName}
                      onChange={(e) => setFullName(capitalizeWords(e.target.value))}
                      error={Boolean(fieldErrors.fullName || fieldErrors.contactPerson)}
                      helperText={fieldErrors.fullName || fieldErrors.contactPerson}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      label="Public Brand Name *"
                      value={displayName}
                      placeholder="e.g. Jos Alukkas"
                      onChange={(e) => setDisplayName(capitalizeWords(e.target.value))}
                      error={Boolean(fieldErrors.displayName || fieldErrors.name)}
                      helperText={fieldErrors.displayName || fieldErrors.name}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Account Email (Read-Only)"
                      value={brandData?.contactEmail || user?.email || ''}
                      disabled
                      fullWidth
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      label="Contact Phone"
                      placeholder="e.g. +91 9876543210"
                      value={contactPhone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactPhone(val);
                        if (fieldErrors.contactPhone) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.contactPhone;
                            return next;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.contactPhone)}
                      helperText={fieldErrors.contactPhone || 'Direct phone line for campaign coordination'}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Autocomplete
                      fullWidth
                      freeSolo
                      options={brandCategoryOptions}
                      value={brandCategory}
                      onInputChange={(_, newInputValue) => setBrandCategory(newInputValue)}
                      onChange={(_, newValue) => setBrandCategory(newValue || '')}
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Brand Category / Industry"
                          placeholder="Select or enter industry (e.g. Fashion & Apparel)"
                          error={Boolean(fieldErrors.industry || fieldErrors.category)}
                          helperText={fieldErrors.industry || fieldErrors.category || 'Industry classification for your brand'}
                          fullWidth
                        />
                      )}
                    />

                    <TextField
                      label="Official Website URL"
                      placeholder="https://brand.com"
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        if (fieldErrors.website) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.website;
                            return next;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.website)}
                      helperText={fieldErrors.website || 'Official brand website'}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Brand Logo / Avatar URL"
                      placeholder="https://brand.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        if (fieldErrors.logoUrl) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.logoUrl;
                            return next;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.logoUrl)}
                      helperText={fieldErrors.logoUrl || 'Direct public URL to brand logo'}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />

                    <Autocomplete
                      fullWidth
                      freeSolo
                      options={locationOptions}
                      value={city}
                      onInputChange={(_, newInputValue) => setCity(capitalizeWords(newInputValue))}
                      onChange={(_, newValue) => setCity(newValue ? capitalizeWords(newValue) : '')}
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City / Location"
                          placeholder="Select or enter location (e.g. Kochi, Mumbai)"
                          error={Boolean(fieldErrors.city)}
                          helperText={fieldErrors.city}
                          fullWidth
                        />
                      )}
                    />
                  </Box>

                  <TextField
                    label="Office Address"
                    multiline
                    rows={2}
                    placeholder="e.g. 123 Corporate Tower, MG Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={Boolean(fieldErrors.address)}
                    helperText={fieldErrors.address}
                    fullWidth
                    disabled={fieldsLocked}
                  />
                </>
              ) : (
                /* Influencer and Agency/Default Profile */
                <>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      label="Full Legal Name *"
                      value={fullName}
                      onChange={(e) => setFullName(capitalizeWords(e.target.value))}
                      error={Boolean(fieldErrors.fullName)}
                      helperText={fieldErrors.fullName}
                      fullWidth
                      disabled={fieldsLocked}
                    />

                    <TextField
                      label="Public Display Name"
                      value={displayName}
                      placeholder="e.g. Alex Influencer"
                      onChange={(e) => setDisplayName(capitalizeWords(e.target.value))}
                      error={Boolean(fieldErrors.displayName)}
                      helperText={fieldErrors.displayName}
                      fullWidth
                      disabled={fieldsLocked}
                    />
                  </Box>

                  <TextField
                    label="Account Email (Read-Only)"
                    value={user?.email || ''}
                    disabled
                    fullWidth
                  />

                  {isInfluencer && (
                    <>
                      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={locationOptions}
                          value={city}
                          onInputChange={(_, newInputValue) => setCity(capitalizeWords(newInputValue))}
                          onChange={(_, newValue) => setCity(newValue ? capitalizeWords(newValue) : '')}
                          disabled={fieldsLocked}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="City / Location"
                              placeholder="Select or enter location (e.g. Kochi, Trivandrum)"
                              error={Boolean(fieldErrors.location)}
                              helperText={fieldErrors.location}
                              fullWidth
                            />
                          )}
                        />

                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={influencerCategoryOptions}
                          value={category}
                          onInputChange={(_, newInputValue) => setCategory(newInputValue)}
                          onChange={(_, newValue) => setCategory(newValue || '')}
                          disabled={fieldsLocked}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Influencer Category"
                              placeholder="Select or enter category (e.g. Fashion & Lifestyle)"
                              error={Boolean(fieldErrors.category)}
                              helperText={fieldErrors.category || 'Influencer niche / content domain'}
                              fullWidth
                            />
                          )}
                        />
                      </Box>

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
                        disabled={fieldsLocked}
                        renderTags={(value: readonly string[], getTagProps) =>
                          value.map((option: string, index: number) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                              <Chip
                                key={key}
                                label={option}
                                size="small"
                                {...tagProps}
                              />
                            );
                          })
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Influencing Regions (Optional)"
                            placeholder={regions.length === 0 ? "Select or type regions (e.g. Kochi, Calicut, Malabar) and press Enter" : ""}
                            error={Boolean(fieldErrors.regions || fieldErrors.influencingRegions)}
                            helperText={
                              fieldErrors.regions ||
                              fieldErrors.influencingRegions ||
                              'Geographical regions or markets where your influence and follower base are strongest (optional)'
                            }
                            fullWidth
                          />
                        )}
                      />

                      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                          label="Instagram Profile URL"
                          placeholder="https://instagram.com/username"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          error={Boolean(fieldErrors.instagram)}
                          helperText={fieldErrors.instagram || 'Full Instagram profile link'}
                          fullWidth
                          disabled={fieldsLocked}
                        />

                        <TextField
                          label="YouTube Channel URL"
                          placeholder="https://youtube.com/@channel"
                          value={youtube}
                          onChange={(e) => setYoutube(e.target.value)}
                          error={Boolean(fieldErrors.youtube)}
                          helperText={fieldErrors.youtube || 'Full YouTube channel link'}
                          fullWidth
                          disabled={fieldsLocked}
                        />
                      </Box>

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
                        disabled={fieldsLocked}
                      />

                      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                          label="Avg Commercial Min (₹)"
                          placeholder="e.g. 5000"
                          value={commercialMin}
                          onChange={(e) => setCommercialMin(e.target.value.replace(/[^0-9]/g, ''))}
                          error={Boolean(fieldErrors.avgCommercialMin)}
                          helperText={fieldErrors.avgCommercialMin}
                          fullWidth
                          disabled={fieldsLocked}
                        />

                        <TextField
                          label="Avg Commercial Max (₹)"
                          placeholder="e.g. 25000"
                          value={commercialMax}
                          onChange={(e) => setCommercialMax(e.target.value.replace(/[^0-9]/g, ''))}
                          error={Boolean(fieldErrors.avgCommercialMax)}
                          helperText={fieldErrors.avgCommercialMax}
                          fullWidth
                          disabled={fieldsLocked}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              <TextField
                label="Bio & Overview"
                multiline
                rows={3}
                placeholder={
                  isBrand
                    ? 'Short description of your brand legacy, product categories, or marketing focus'
                    : 'Short description of your background or representation'
                }
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                error={Boolean(fieldErrors.bio)}
                helperText={fieldErrors.bio}
                fullWidth
                disabled={fieldsLocked}
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
                    ✓ {isBrand ? 'Brand details' : 'Profile details'} saved successfully!
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
                  disabled={fieldsLocked || !fullName.trim() || (isBrand && !displayName.trim())}
                  sx={{ minWidth: 160, height: 44 }}
                >
                  {fieldsLocked ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : isBrand ? (
                    'Save Brand Profile'
                  ) : (
                    'Save Profile'
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Card>
      </Box>
    </DashboardLayout>
  );
};

