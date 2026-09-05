import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { PhoneField } from './PhoneField';
import { useCategories, useLocations } from '@api';
import { CreateInfluencerRequest, CategoryTypeCode } from '@contracts';
import {
  capitalizeWords,
  parseShorthandNumber,
  formatShorthandNumber,
  INFLUENCER_TIERS,
  getInfluencerTier,
  getTierInfo,
  InfluencerTier,
  validatePhoneNumber,
  validatePersonName,
  wordPrefixFilterOptions,
} from '@utils';

export interface CreateInfluencerDialogProps {
  open: boolean;
  loading?: boolean;
  onSubmit: (data: CreateInfluencerRequest) => Promise<void> | void;
  onClose: () => void;
}

export const CreateInfluencerDialog: React.FC<CreateInfluencerDialogProps> = ({
  open,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const { data: influencerCategoriesData } = useCategories(CategoryTypeCode.INFLUENCER);
  const influencerCategoryOptions = (influencerCategoriesData || []).map((c) => c.name);

  const { data: locationsData } = useLocations();
  const locationOptions = (locationsData || []).map((l) => l.name);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState<InfluencerTier | null>(null);
  const [location, setLocation] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [followers, setFollowers] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [avgCommercialMin, setAvgCommercialMin] = useState('');
  const [avgCommercialMax, setAvgCommercialMax] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [followersError, setFollowersError] = useState('');
  const [instagramError, setInstagramError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  const normalizeSocialUrl = (val: string, domain: 'instagram.com' | 'youtube.com'): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
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

  const validateSocialUrl = (val: string, label: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    const normalized = normalizeSocialUrl(
      trimmed,
      label.toLowerCase().includes('instagram') ? 'instagram.com' : 'youtube.com',
    );
    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
        return `Please enter a valid ${label}`;
      }
    } catch {
      return `Please enter a valid ${label} (e.g. https://${label.toLowerCase().includes('instagram') ? 'instagram.com/creator' : 'youtube.com/@channel'})`;
    }
    return '';
  };

  const validateEmail = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Must be a valid email address (e.g. riya@gmail.com)';
    }
    return '';
  };

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setCategory('');
      setSelectedTier(null);
      setLocation('');
      setRegions([]);
      setFollowers('');
      setContactPhone('');
      setInstagram('');
      setYoutube('');
      setAvgCommercialMin('');
      setAvgCommercialMax('');
      setError('');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setFollowersError('');
      setInstagramError('');
      setYoutubeError('');
    }
  }, [open]);

  const handleSelectTier = (tierKey: InfluencerTier) => {
    setSelectedTier(tierKey);
    const tierInfo = getTierInfo(tierKey);
    if (!tierInfo) return;

    const currentParsed = parseShorthandNumber(followers);
    if (
      currentParsed === null ||
      currentParsed < tierInfo.min ||
      (tierInfo.max !== Infinity && currentParsed >= tierInfo.max)
    ) {
      setFollowers(formatShorthandNumber(tierInfo.defaultFollowers));
      setFollowersError('');
    }
  };

  const handleFollowersChange = (val: string) => {
    const cleaned = val.replace(/-/g, '');
    setFollowers(cleaned);
    if (cleaned.trim()) {
      const parsed = parseShorthandNumber(cleaned);
      if (parsed === null) {
        setFollowersError('Enter valid followers (e.g. 10k, 100k, 1m)');
        setSelectedTier(null);
      } else {
        setFollowersError('');
        setSelectedTier(getInfluencerTier(parsed));
      }
    } else {
      setFollowersError('');
      setSelectedTier(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setFollowersError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    let hasFieldErr = false;

    const nameErr = validatePersonName(trimmedName, {
      required: true,
      fieldLabel: 'Influencer name',
      max: 200,
    });
    if (nameErr) {
      setNameError(nameErr);
      hasFieldErr = true;
    }

    if (!trimmedEmail) {
      setEmailError('Email is required');
      hasFieldErr = true;
    } else {
      const eErr = validateEmail(trimmedEmail);
      if (eErr) {
        setEmailError(eErr);
        hasFieldErr = true;
      }
    }

    if (!trimmedPhone) {
      setPhoneError('Phone number is required');
      hasFieldErr = true;
    } else {
      const pErr = validatePhoneNumber(trimmedPhone);
      if (pErr) {
        setPhoneError(pErr);
        hasFieldErr = true;
      }
    }

    if (hasFieldErr) {
      return;
    }

    let parsedFollowers: number | undefined = undefined;
    if (followers.trim()) {
      const parsed = parseShorthandNumber(followers);
      if (parsed === null || parsed < 0) {
        setFollowersError('Must be a valid positive value (e.g. 10k, 100k, 1m)');
        return;
      }
      parsedFollowers = parsed;
    }

    const min = avgCommercialMin ? Number(avgCommercialMin) : undefined;
    const max = avgCommercialMax ? Number(avgCommercialMax) : undefined;
    if (min !== undefined && min < 0) {
      setError('Min commercial rate cannot be negative');
      return;
    }
    if (max !== undefined && max < 0) {
      setError('Max commercial rate cannot be negative');
      return;
    }
    if (min !== undefined && max !== undefined && max < min) {
      setError('Max commercial must be greater than or equal to min commercial');
      return;
    }

    if (instagram.trim()) {
      const igErr = validateSocialUrl(instagram, 'Instagram Profile URL');
      if (igErr) {
        setInstagramError(igErr);
        return;
      }
    }
    if (youtube.trim()) {
      const ytErr = validateSocialUrl(youtube, 'YouTube Channel URL');
      if (ytErr) {
        setYoutubeError(ytErr);
        return;
      }
    }

    const finalInstagram = instagram.trim()
      ? normalizeSocialUrl(instagram, 'instagram.com')
      : undefined;
    const finalYoutube = youtube.trim() ? normalizeSocialUrl(youtube, 'youtube.com') : undefined;

    const payload: CreateInfluencerRequest = {
      name: trimmedName,
      email: trimmedEmail,
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      regions: regions.length > 0 ? regions : undefined,
      influencingRegions: regions.length > 0 ? regions : undefined,
      followers: parsedFollowers,
      contactPhone: trimmedPhone,
      instagram: finalInstagram,
      youtube: finalYoutube,
      avgCommercialMin: min,
      avgCommercialMax: max,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to add influencer.';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      }
      setError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '12px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 0, pt: 1, px: 2 }}>
          <SectionHeading
            title="Add Influencer"
            subtitle="Added to the influencers you represent; no login is needed until they first sign in"
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Influencer Name *"
              value={name}
              onChange={(e) => {
                const val = capitalizeWords(e.target.value);
                setName(val);
                if (nameError) {
                  setNameError(
                    validatePersonName(val, {
                      required: true,
                      fieldLabel: 'Influencer name',
                      max: 200,
                    }),
                  );
                } else if (/[\d\p{N}]/u.test(val)) {
                  setNameError('Numbers are not allowed in name');
                }
              }}
              onBlur={(e) => {
                setNameError(
                  validatePersonName(e.target.value, {
                    required: true,
                    fieldLabel: 'Influencer name',
                    max: 200,
                  }),
                );
              }}
              error={Boolean(nameError)}
              helperText={nameError || undefined}
              placeholder="e.g. Riya Malhotra"
              fullWidth
              disabled={loading}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <TextField
                label="Login / Contact Email *"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (val.trim()) {
                    setEmailError(validateEmail(val));
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (!val) {
                    setEmailError('Email is required');
                  } else {
                    setEmailError(validateEmail(val));
                  }
                }}
                error={Boolean(emailError)}
                helperText={emailError || undefined}
                placeholder="e.g. riya@gmail.com"
                fullWidth
                disabled={loading}
              />
              <PhoneField
                label="Contact Phone"
                required
                value={contactPhone}
                onChange={(next) => {
                  setContactPhone(next);
                  if (next.trim()) setPhoneError(validatePhoneNumber(next));
                  else setPhoneError('');
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
                disabled={loading}
              />
            </Box>

            <Autocomplete
              fullWidth
              freeSolo
              options={influencerCategoryOptions}
              filterOptions={wordPrefixFilterOptions}
              value={category}
              onInputChange={(_, newInputValue) => setCategory(newInputValue)}
              onChange={(_, newValue) => setCategory(newValue || '')}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Influencer Niche / Category"
                  placeholder="Select or enter category (e.g. Fashion & Lifestyle)"
                  fullWidth
                />
              )}
            />

            {/* Influencer Tier / Follower Category (Nano, Micro, Macro, Mega) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.tokens.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Influencer Tier & Category
                </Typography>
                {selectedTier && (
                  <Chip
                    size="small"
                    label={`${getTierInfo(selectedTier)?.label} (${getTierInfo(selectedTier)?.rangeLabel})`}
                    sx={{
                      height: 22,
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: getTierInfo(selectedTier)?.color.bg,
                      color: getTierInfo(selectedTier)?.color.text,
                      border: `1px solid ${getTierInfo(selectedTier)?.color.border}`,
                    }}
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.25,
                }}
              >
                {INFLUENCER_TIERS.map((t) => {
                  const isSelected = selectedTier === t.key;
                  return (
                    <ButtonBase
                      key={t.key}
                      onClick={() => handleSelectTier(t.key)}
                      disabled={loading}
                      type="button"
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 8px',
                        borderRadius: `${theme.customRadii.inner}px`,
                        border: `1.5px solid ${isSelected ? t.color.border : theme.palette.tokens.divider}`,
                        backgroundColor: isSelected ? t.color.bg : theme.palette.tokens.fieldBg,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: t.color.border,
                          backgroundColor: isSelected ? t.color.bg : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: isSelected ? t.color.text : theme.palette.tokens.textPrimary,
                        }}
                      >
                        {t.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          color: isSelected ? t.color.text : theme.palette.tokens.textSecondary,
                          fontWeight: isSelected ? 600 : 400,
                          mt: 0.25,
                        }}
                      >
                        {t.rangeLabel}
                      </Typography>
                    </ButtonBase>
                  );
                })}
              </Box>
            </Box>

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <Autocomplete
                freeSolo
                options={locationOptions}
                filterOptions={wordPrefixFilterOptions}
                value={location}
                onInputChange={(_, newInputValue) => setLocation(capitalizeWords(newInputValue))}
                onChange={(_, newValue) => setLocation(newValue ? capitalizeWords(newValue) : '')}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    placeholder="Select or enter location (e.g. Mumbai)"
                    fullWidth
                  />
                )}
              />
              <TextField
                label="Followers"
                value={followers}
                onChange={(e) => handleFollowersChange(e.target.value)}
                onBlur={() => {
                  if (followers.trim()) {
                    const parsed = parseShorthandNumber(followers);
                    if (parsed !== null) {
                      setFollowers(formatShorthandNumber(parsed));
                    }
                  }
                }}
                placeholder="e.g. 10k, 100k, 1m"
                error={Boolean(followersError)}
                helperText={
                  followersError ||
                  (followers && parseShorthandNumber(followers) !== null
                    ? `${parseShorthandNumber(followers)?.toLocaleString('en-IN')} followers (${getTierInfo(selectedTier)?.label || ''} Tier)`
                    : undefined)
                }
                fullWidth
                disabled={loading}
              />
            </Box>

            <Autocomplete
              multiple
              freeSolo
              options={locationOptions}
              filterOptions={wordPrefixFilterOptions}
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
                  fullWidth
                />
              )}
            />

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Instagram Profile URL"
                value={instagram}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  if (instagramError)
                    setInstagramError(validateSocialUrl(e.target.value, 'Instagram URL'));
                }}
                onBlur={() => {
                  if (instagram.trim()) {
                    setInstagramError(validateSocialUrl(instagram, 'Instagram Profile URL'));
                  }
                }}
                placeholder="https://instagram.com/username"
                error={Boolean(instagramError)}
                helperText={instagramError || undefined}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="YouTube Channel URL"
                value={youtube}
                onChange={(e) => {
                  setYoutube(e.target.value);
                  if (youtubeError)
                    setYoutubeError(validateSocialUrl(e.target.value, 'YouTube URL'));
                }}
                onBlur={() => {
                  if (youtube.trim()) {
                    setYoutubeError(validateSocialUrl(youtube, 'YouTube Channel URL'));
                  }
                }}
                placeholder="https://youtube.com/@channel"
                error={Boolean(youtubeError)}
                helperText={youtubeError || undefined}
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Indicative Rate — Min (₹)"
                value={avgCommercialMin}
                onChange={(e) => setAvgCommercialMin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 5000"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Indicative Rate — Max (₹)"
                value={avgCommercialMax}
                onChange={(e) => setAvgCommercialMax(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 15000"
                fullWidth
                disabled={loading}
              />
            </Box>

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim() || !email.trim() || !contactPhone.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Add Influencer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
