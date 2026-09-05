import React, { useState, useEffect, useRef } from 'react';
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
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { invalidateEntity } from '@api';
import { ConfirmDialog, PhoneField } from '@molecules';

import { getNavItemsForRole } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import {
  apiClient,
  useCategories,
  useLocations,
  useBrandProfile,
  useUpdateBrandProfile,
  uploadAvatar,
  removeAvatar,
} from '@api';

import {
  UpdateProfileSchema,
  UpdateProfileRequest,
  UpdateBrandSchema,
  UpdateBrandRequest,
  UserResponse,
  BrandResponse,
  CategoryTypeCode,
} from '@contracts';
import { z } from 'zod';
import { useAuth, useToast } from '@hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  capitalizeWords,
  parseShorthandNumber,
  formatShorthandNumber,
  safeImageUrl,
  validatePhoneNumber,
  validatePersonName,
  validateBrandName,
} from '@utils';

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size <= 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showError('Image size exceeds 5MB limit. Please upload an image smaller than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate MIME
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ];
    if (!allowed.includes(file.type.toLowerCase())) {
      showError('Unsupported file type. Please upload a JPEG, PNG, WEBP, GIF, or SVG image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar(file);
      if (isBrand && res.avatarUrl) {
        setLogoUrl(res.avatarUrl);
        // Write the stored value straight into the cached brand row. The brand
        // profile query keeps previous data across a refetch, so without this
        // the render and the form-sync effect keep seeing the pre-upload row
        // (no logo) until the refetch lands — which is what made the new logo
        // "disappear" a moment after it showed.
        queryClient.setQueryData<BrandResponse>(['brand', 'profile'], (prev) =>
          prev ? { ...prev, logoUrl: res.avatarUrl } : prev,
        );
      }
      invalidateEntity(queryClient, 'profile');
      await Promise.all([
        refetchUser(),
        queryClient.invalidateQueries({ queryKey: ['brand', 'profile'] }),
      ]);
      showSuccess(
        isBrand ? 'Brand logo uploaded successfully.' : 'Profile picture uploaded successfully.',
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        'Failed to upload image. Please try again.';
      showError(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setRemovingAvatar(true);
      await removeAvatar();
      // A brand's logo and its avatar are the same column, so the locally held
      // logo has to be cleared too or the old image survives until a reload.
      setLogoUrl('');
      // Same reason as the upload path: clear it in the cached brand row now,
      // or keepPreviousData re-serves the old logo to the render and the
      // form-sync effect and the removed image flickers back.
      if (isBrand) {
        queryClient.setQueryData<BrandResponse>(['brand', 'profile'], (prev) =>
          prev ? { ...prev, logoUrl: null } : prev,
        );
      }
      invalidateEntity(queryClient, 'profile');
      await Promise.all([
        refetchUser(),
        queryClient.invalidateQueries({ queryKey: ['brand', 'profile'] }),
      ]);
      setConfirmRemoveOpen(false);
      setPreviewOpen(false);
      showSuccess(isBrand ? 'Brand logo removed.' : 'Profile picture removed.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(
        errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to remove image. Please try again.',
      );
    } finally {
      setRemovingAvatar(false);
    }
  };

  // The session snapshot behind `user` is cached for a day and deliberately does
  // not refetch on focus, so this screen would otherwise open on whatever the
  // creator row looked like at sign-in. The agency edits that row — a creator's
  // location or category can change between visits — and the stale copy both
  // displayed the old value and would have been saved straight back over the
  // agency's edit. Re-read the session once per visit so the form starts from
  // what is actually stored.
  useEffect(() => {
    void refetchUser();
  }, [refetchUser]);

  /**
   * What the creator branch below hydrates from. Folded into the hydration key
   * so a refetch that brings *different* server values re-fills the fields,
   * rather than the fields staying pinned to whatever the first render saw.
   */
  const influencerSnapshot = JSON.stringify([
    user?.profile?.fullName ?? null,
    user?.profile?.displayName ?? null,
    user?.profile?.bio ?? null,
    user?.influencer?.location ?? null,
    user?.influencer?.regions ?? null,
    user?.influencer?.influencingRegions ?? null,
    user?.influencer?.category ?? null,
    user?.influencer?.instagram ?? null,
    user?.influencer?.youtube ?? null,
    user?.influencer?.followers ?? null,
    user?.influencer?.avgCommercialMin ?? null,
    user?.influencer?.avgCommercialMax ?? null,
  ]);

  // Hydrate the editable fields from server state.
  //
  // This used to run on every `user` / `brandData` reference change. The brand
  // profile query keeps previous data across a refetch, so a refetch triggered
  // by an avatar upload / remove / save briefly re-serves the *old* row — and
  // re-running here wrote that stale copy back over the just-changed logo (and
  // any in-progress edit to another field). The brand branch is therefore still
  // keyed on identity alone and hydrates once.
  //
  // The session query has no such stale replay — it holds the last response
  // until the next one lands — so the creator branch is keyed on the values too
  // and re-hydrates when the server's copy genuinely differs.
  const hydratedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const hydrationKey = isBrand
      ? (brandData?.id ?? null)
      : user?.id
        ? `${user.id}|${influencerSnapshot}`
        : null;
    if (!hydrationKey || hydratedKeyRef.current === hydrationKey) return;

    if (isBrand && brandData) {
      hydratedKeyRef.current = hydrationKey;
      setFullName(brandData.contactPerson || user?.profile?.fullName || '');
      setDisplayName(brandData.name || user?.profile?.displayName || '');
      setBrandCategory(brandData.industry || '');
      setContactPhone(brandData.contactPhone || user?.phone || '');
      setWebsite(brandData.website || '');
      setCity(brandData.city || '');
      setAddress(brandData.address || '');
      setLogoUrl(brandData.logoUrl || '');
      setBio(brandData.bio || user?.profile?.bio || '');
      return;
    }

    if (!isBrand && user?.profile) {
      hydratedKeyRef.current = hydrationKey;
      setFullName(user.profile.fullName || '');
      setDisplayName(user.profile.displayName || '');
      setBio(user.profile.bio || '');

      const detail = user.influencer;
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
    }
  }, [user, brandData, isBrand, influencerSnapshot]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await apiClient.put<{ message: string; user: UserResponse }>(
        '/users/profile',
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      invalidateEntity(queryClient, 'profile');
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

  // The one URL the avatar, the zoom view and the remove control all read, so
  // they can never disagree about whether a picture is actually set. For a
  // brand this is `logoUrl` (kept live by the avatar handlers) backed by the
  // brand row; `user.profile.avatarUrl` is deliberately not a fallback here —
  // it lags the brand row and was flashing a just-removed logo back.
  const currentAvatarUrl = safeImageUrl(
    isBrand ? logoUrl || brandData?.logoUrl || undefined : user?.profile?.avatarUrl,
  );
  const hasAvatar = Boolean(currentAvatarUrl);
  const avatarBusy = uploadingAvatar || removingAvatar;

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

    const fnErr = validatePersonName(fullName, {
      required: true,
      fieldLabel: 'Full Legal Name',
      max: 200,
    });
    if (fnErr) {
      setFieldErrors({ fullName: fnErr, contactPerson: fnErr });
      return;
    }

    if (isBrand) {
      const dnErr = validateBrandName(displayName, {
        required: true,
        fieldLabel: 'Brand Name',
        max: 200,
      });
      if (dnErr) {
        setFieldErrors({ displayName: dnErr, name: dnErr });
        return;
      }

      if (contactPhone.trim()) {
        const pErr = validatePhoneNumber(contactPhone.trim());
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
        name: displayName.trim(),
        contactPerson: fullName.trim(),
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
        invalidateEntity(queryClient, 'profile', 'brand');
        await refetchUser();
        showSuccess('Brand details saved successfully.');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        const msg =
          errorObj?.response?.data?.message ||
          errorObj?.message ||
          'Failed to update brand details.';
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

    if (displayName.trim()) {
      const dnErr = validatePersonName(displayName, {
        required: false,
        fieldLabel: 'Public Display Name',
        max: 120,
      });
      if (dnErr) {
        setFieldErrors({ displayName: dnErr });
        return;
      }
    }

    const payload: UpdateProfileRequest = {
      fullName: fullName.trim(),
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, minWidth: 0 }}>
              <Box
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: `${theme.customRadii.card}px`,
                  flexShrink: 0,
                  '&:hover .avatar-upload-overlay': {
                    opacity: 1,
                  },
                }}
                // With a picture set, the click is a request to look at it —
                // opening the file dialog instead is what made it impossible to
                // view one at full size. With none set, there is nothing to
                // view, so the click still means "upload".
                onClick={() => {
                  if (avatarBusy) return;
                  if (hasAvatar) {
                    setPreviewOpen(true);
                  } else if (!fieldsLocked) {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={hasAvatar ? 'View profile picture' : 'Upload profile picture'}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  if (avatarBusy) return;
                  if (hasAvatar) {
                    setPreviewOpen(true);
                  } else if (!fieldsLocked) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Avatar
                  src={currentAvatarUrl}
                  alt={displayName || brandData?.name || fullName || 'Profile Photo'}
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: theme.palette.tokens.fieldBg,
                    border: `1.5px solid ${theme.palette.tokens.divider}`,
                    color: theme.palette.tokens.accentText,
                    fontWeight: 700,
                    fontSize: '24px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {isBrand
                    ? (displayName || brandData?.name || fullName || 'B').charAt(0).toUpperCase()
                    : (fullName || user?.profile?.fullName || 'U').charAt(0).toUpperCase()}
                </Avatar>

                {/* Hover overlay: zoom when there is a picture to open, camera when there is not */}
                <Box
                  className="avatar-upload-overlay"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: avatarBusy ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    color: '#FFFFFF',
                  }}
                >
                  {avatarBusy ? (
                    <CircularProgress size={22} sx={{ color: '#FFFFFF' }} />
                  ) : (
                    <>
                      {hasAvatar ? (
                        <ZoomInRoundedIcon sx={{ fontSize: '20px' }} />
                      ) : (
                        <PhotoCameraRoundedIcon sx={{ fontSize: '20px' }} />
                      )}
                      <Typography
                        sx={{ fontSize: '10px', fontWeight: 700, mt: 0.25, color: '#FFFFFF' }}
                      >
                        {hasAvatar ? 'View' : 'Upload'}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}
                >
                  <Typography variant="h2" sx={{ fontSize: '18px', fontWeight: 700 }}>
                    {isBrand
                      ? displayName || brandData?.name || fullName || 'Brand Profile'
                      : fullName || user?.profile?.fullName || 'User Profile'}
                  </Typography>
                  <Chip label={roleCode || 'USER'} size="small" />
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.tokens.textSecondary, display: 'block', mb: 1 }}
                >
                  {brandData?.contactEmail || user?.email}
                </Typography>

                {/* Upload action button and format tip */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      uploadingAvatar ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <PhotoCameraRoundedIcon fontSize="small" />
                      )
                    }
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar || fieldsLocked}
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'none',
                      height: 30,
                      px: 1.5,
                      borderRadius: `${theme.customRadii.pill}px`,
                      borderColor: theme.palette.tokens.divider,
                      color: theme.palette.tokens.textPrimary,
                      backgroundColor: theme.palette.tokens.fieldBg,
                      '&:hover': {
                        borderColor: theme.palette.tokens.accent,
                        backgroundColor: theme.palette.tokens.surface,
                      },
                    }}
                  >
                    {uploadingAvatar
                      ? 'Uploading...'
                      : isBrand
                        ? hasAvatar
                          ? 'Change Brand Logo'
                          : 'Upload Brand Logo'
                        : hasAvatar
                          ? 'Change Picture'
                          : 'Upload Picture'}
                  </Button>

                  {/* Removal is only offered when there is something to remove,
                      so the control never sits there doing nothing. */}
                  {hasAvatar && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        removingAvatar ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        )
                      }
                      onClick={() => setConfirmRemoveOpen(true)}
                      disabled={avatarBusy || fieldsLocked}
                      sx={{
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'none',
                        height: 30,
                        px: 1.5,
                        borderRadius: `${theme.customRadii.pill}px`,
                        borderColor: theme.palette.tokens.divider,
                        color: theme.palette.error.main,
                        backgroundColor: theme.palette.tokens.fieldBg,
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          backgroundColor: theme.palette.tokens.surface,
                        },
                      }}
                    >
                      {removingAvatar ? 'Removing...' : isBrand ? 'Remove Logo' : 'Remove Picture'}
                    </Button>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.tokens.textSecondary, fontSize: '11px' }}
                  >
                    JPG, PNG, WEBP or SVG (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Box>
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
                      onChange={(e) => {
                        const val = capitalizeWords(e.target.value);
                        setFullName(val);
                        if (fieldErrors.fullName || fieldErrors.contactPerson) {
                          const err = validatePersonName(val, {
                            required: true,
                            fieldLabel: 'Full Legal Name',
                            max: 200,
                          });
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            if (err) {
                              next.fullName = err;
                              next.contactPerson = err;
                            } else {
                              delete next.fullName;
                              delete next.contactPerson;
                            }
                            return next;
                          });
                        } else if (/[\d\p{N}]/u.test(val)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            fullName: 'Numbers are not allowed in name',
                            contactPerson: 'Numbers are not allowed in name',
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        const err = validatePersonName(e.target.value, {
                          required: true,
                          fieldLabel: 'Full Legal Name',
                          max: 200,
                        });
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          if (err) {
                            next.fullName = err;
                            next.contactPerson = err;
                          } else {
                            delete next.fullName;
                            delete next.contactPerson;
                          }
                          return next;
                        });
                      }}
                      error={Boolean(fieldErrors.fullName || fieldErrors.contactPerson)}
                      helperText={fieldErrors.fullName || fieldErrors.contactPerson || undefined}
                      fullWidth
                      disabled={fieldsLocked}
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      label="Public Brand Name *"
                      value={displayName}
                      placeholder="e.g. Jos Alukkas"
                      onChange={(e) => {
                        const val = capitalizeWords(e.target.value);
                        setDisplayName(val);
                        if (fieldErrors.displayName || fieldErrors.name) {
                          const err = validateBrandName(val, {
                            required: true,
                            fieldLabel: 'Brand Name',
                            max: 200,
                          });
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            if (err) {
                              next.displayName = err;
                              next.name = err;
                            } else {
                              delete next.displayName;
                              delete next.name;
                            }
                            return next;
                          });
                        }
                      }}
                      onBlur={(e) => {
                        const err = validateBrandName(e.target.value, {
                          required: true,
                          fieldLabel: 'Brand Name',
                          max: 200,
                        });
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          if (err) {
                            next.displayName = err;
                            next.name = err;
                          } else {
                            delete next.displayName;
                            delete next.name;
                          }
                          return next;
                        });
                      }}
                      error={Boolean(fieldErrors.displayName || fieldErrors.name)}
                      helperText={fieldErrors.displayName || fieldErrors.name || undefined}
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

                    <PhoneField
                      label="Contact Phone"
                      value={contactPhone}
                      onChange={(next) => {
                        setContactPhone(next);
                        if (fieldErrors.contactPhone) {
                          setFieldErrors((prev) => {
                            const nextErrors = { ...prev };
                            delete nextErrors.contactPhone;
                            return nextErrors;
                          });
                        }
                      }}
                      error={Boolean(fieldErrors.contactPhone)}
                      helperText={
                        fieldErrors.contactPhone || 'Direct phone line for campaign coordination'
                      }
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
                          helperText={
                            fieldErrors.industry ||
                            fieldErrors.category ||
                            'Industry classification for your brand'
                          }
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
                      onChange={(e) => {
                        const val = capitalizeWords(e.target.value);
                        setFullName(val);
                        if (fieldErrors.fullName) {
                          const err = validatePersonName(val, {
                            required: true,
                            fieldLabel: 'Full Legal Name',
                            max: 200,
                          });
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            if (err) next.fullName = err;
                            else delete next.fullName;
                            return next;
                          });
                        } else if (/[\d\p{N}]/u.test(val)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            fullName: 'Numbers are not allowed in name',
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        const err = validatePersonName(e.target.value, {
                          required: true,
                          fieldLabel: 'Full Legal Name',
                          max: 200,
                        });
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          if (err) next.fullName = err;
                          else delete next.fullName;
                          return next;
                        });
                      }}
                      error={Boolean(fieldErrors.fullName)}
                      helperText={fieldErrors.fullName || undefined}
                      fullWidth
                      disabled={fieldsLocked}
                    />

                    <TextField
                      label="Public Display Name"
                      value={displayName}
                      placeholder="e.g. Alex Influencer"
                      onChange={(e) => {
                        const val = capitalizeWords(e.target.value);
                        setDisplayName(val);
                        if (fieldErrors.displayName) {
                          const err = val.trim()
                            ? validatePersonName(val, {
                                required: false,
                                fieldLabel: 'Public Display Name',
                                max: 120,
                              })
                            : '';
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            if (err) next.displayName = err;
                            else delete next.displayName;
                            return next;
                          });
                        } else if (/[\d\p{N}]/u.test(val)) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            displayName: 'Numbers are not allowed in name',
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        const err = e.target.value.trim()
                          ? validatePersonName(e.target.value, {
                              required: false,
                              fieldLabel: 'Public Display Name',
                              max: 120,
                            })
                          : '';
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          if (err) next.displayName = err;
                          else delete next.displayName;
                          return next;
                        });
                      }}
                      error={Boolean(fieldErrors.displayName)}
                      helperText={fieldErrors.displayName || undefined}
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
                      <Box
                        sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}
                      >
                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={locationOptions}
                          value={city}
                          onInputChange={(_, newInputValue) =>
                            setCity(capitalizeWords(newInputValue))
                          }
                          onChange={(_, newValue) =>
                            setCity(newValue ? capitalizeWords(newValue) : '')
                          }
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
                              helperText={
                                fieldErrors.category || 'Influencer niche / content domain'
                              }
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
                            return <Chip key={key} label={option} size="small" {...tagProps} />;
                          })
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Influencing Regions (Optional)"
                            placeholder={
                              regions.length === 0
                                ? 'Select or type regions (e.g. Kochi, Calicut, Malabar) and press Enter'
                                : ''
                            }
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

                      <Box
                        sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}
                      >
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

                      <Box
                        sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}
                      >
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

      {/* Full-size view. The avatar itself is 68px, so the only way to actually
          look at an uploaded picture is to open it at its natural size. */}
      <Dialog
        open={previewOpen && hasAvatar}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${theme.customRadii.card}px`,
              backgroundImage: 'none',
              backgroundColor: theme.palette.tokens.surface,
              m: 2,
              position: 'relative',
              overflow: 'hidden',
            },
          },
        }}
      >
        <IconButton
          onClick={() => setPreviewOpen(false)}
          aria-label="Close preview"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            color: '#FFFFFF',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.75)' },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>

        <Box
          component="img"
          src={currentAvatarUrl}
          alt={displayName || brandData?.name || fullName || 'Profile picture'}
          sx={{
            display: 'block',
            maxWidth: '86vw',
            maxHeight: '80vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            backgroundColor: theme.palette.tokens.fieldBg,
          }}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.25,
            p: 1.5,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<PhotoCameraRoundedIcon fontSize="small" />}
            onClick={() => {
              setPreviewOpen(false);
              fileInputRef.current?.click();
            }}
            disabled={avatarBusy || fieldsLocked}
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              height: 30,
              px: 1.5,
              borderRadius: `${theme.customRadii.pill}px`,
              borderColor: theme.palette.tokens.divider,
              color: theme.palette.tokens.textPrimary,
            }}
          >
            Change
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
            onClick={() => setConfirmRemoveOpen(true)}
            disabled={avatarBusy || fieldsLocked}
            sx={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'none',
              height: 30,
              px: 1.5,
              borderRadius: `${theme.customRadii.pill}px`,
              borderColor: theme.palette.tokens.divider,
              color: theme.palette.error.main,
            }}
          >
            Remove
          </Button>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={confirmRemoveOpen}
        title={isBrand ? 'Remove Brand Logo?' : 'Remove Profile Picture?'}
        body={
          isBrand
            ? 'This deletes your brand logo. The brand will fall back to its initial until a new logo is uploaded.'
            : 'This deletes your profile picture. Your profile will fall back to your initial until a new picture is uploaded.'
        }
        confirmText={isBrand ? 'Remove Logo' : 'Remove Picture'}
        variant="destructive"
        loading={removingAvatar}
        onConfirm={handleRemoveAvatar}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </DashboardLayout>
  );
};
