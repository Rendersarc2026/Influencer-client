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
import { InfluencerResponse, AgencyUpdateInfluencerRequest, CategoryTypeCode } from '@contracts';
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

export interface EditInfluencerDialogProps {
  open: boolean;
  influencer: InfluencerResponse | null;
  loading?: boolean;
  onSubmit: (data: AgencyUpdateInfluencerRequest) => Promise<void> | void;
  onClose: () => void;
}

export const EditInfluencerDialog: React.FC<EditInfluencerDialogProps> = ({
  open,
  influencer,
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
  const [category, setCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState<InfluencerTier | null>(null);
  const [location, setLocation] = useState('');
  const [regions, setRegions] = useState<string[]>([]);
  const [followers, setFollowers] = useState('');
  const [email, setEmail] = useState('');
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

  const validateEmail = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Must be a valid email address (e.g. riya@gmail.com)';
    }
    return '';
  };

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
      return `Please enter a valid ${label} (e.g. https://${label.toLowerCase().includes('instagram') ? 'instagram.com/influencer' : 'youtube.com/@channel'})`;
    }
    return '';
  };

  useEffect(() => {
    if (open && influencer) {
      setName(influencer.name || '');
      setCategory(influencer.category || '');
      setLocation(influencer.location || '');
      setRegions(influencer.regions || influencer.influencingRegions || []);
      const fVal = influencer.followers ? formatShorthandNumber(influencer.followers) : '';
      setFollowers(fVal);
      setSelectedTier(influencer.followers ? getInfluencerTier(influencer.followers) : null);
      setEmail(influencer.email || '');
      setContactPhone(influencer.contactPhone || '');
      setInstagram(influencer.instagram || '');
      setYoutube(influencer.youtube || '');
      setAvgCommercialMin(influencer.avgCommercialMin ? String(influencer.avgCommercialMin) : '');
      setAvgCommercialMax(influencer.avgCommercialMax ? String(influencer.avgCommercialMax) : '');
      setError('');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setFollowersError('');
      setInstagramError('');
      setYoutubeError('');
    }
  }, [open, influencer]);

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
    setInstagramError('');
    setYoutubeError('');

    const trimmedName = name.trim();
    // Lowercased and trimmed here because the server's `email` primitive runs
    // its format check before trimming, so a pasted address with a stray space
    // would be rejected rather than cleaned up.
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    // One validation pass over every field, so a submit marks all of the
    // offending fields red at once instead of one per failed click.
    const nameErr = validatePersonName(trimmedName, {
      required: true,
      fieldLabel: 'Influencer name',
      max: 200,
    });

    const emailErr = trimmedEmail ? validateEmail(trimmedEmail) : '';
    const phoneErr = trimmedPhone ? validatePhoneNumber(trimmedPhone) : '';

    let parsedFollowers: number | undefined = undefined;
    let followersErr = '';
    if (followers.trim()) {
      const parsed = parseShorthandNumber(followers);
      if (parsed === null || parsed < 0) {
        followersErr = 'Must be a valid positive number (e.g. 10k, 100k, 1m)';
      } else {
        parsedFollowers = parsed;
      }
    }

    const igErr = instagram.trim() ? validateSocialUrl(instagram, 'Instagram Profile URL') : '';
    const ytErr = youtube.trim() ? validateSocialUrl(youtube, 'YouTube Channel URL') : '';

    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    let formErr = '';
    if (avgCommercialMin.trim()) {
      const parsedMin = Number(avgCommercialMin.replace(/,/g, ''));
      if (isNaN(parsedMin) || parsedMin < 0) {
        formErr = 'Minimum rate must be a valid positive number.';
      } else {
        min = parsedMin;
      }
    }
    if (!formErr && avgCommercialMax.trim()) {
      const parsedMax = Number(avgCommercialMax.replace(/,/g, ''));
      if (isNaN(parsedMax) || parsedMax < 0) {
        formErr = 'Maximum rate must be a valid positive number.';
      } else {
        max = parsedMax;
      }
    }
    if (!formErr && min !== undefined && max !== undefined && max < min) {
      formErr = 'Maximum indicative rate cannot be less than minimum indicative rate.';
    }

    setNameError(nameErr);
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    setFollowersError(followersErr);
    setInstagramError(igErr);
    setYoutubeError(ytErr);
    setError(formErr);

    if (nameErr || emailErr || phoneErr || followersErr || igErr || ytErr || formErr) return;

    const finalInstagram = instagram.trim()
      ? normalizeSocialUrl(instagram, 'instagram.com')
      : undefined;
    const finalYoutube = youtube.trim() ? normalizeSocialUrl(youtube, 'youtube.com') : undefined;

    const payload: AgencyUpdateInfluencerRequest = {
      name: trimmedName,
      // Only sent when it actually changed: this rewrites the creator's login,
      // and an unchanged address should not clear their email verification.
      email:
        trimmedEmail && trimmedEmail !== (influencer?.email || '').toLowerCase()
          ? trimmedEmail
          : undefined,
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      regions: regions.length > 0 ? regions : [],
      influencingRegions: regions.length > 0 ? regions : [],
      followers: parsedFollowers,
      contactPhone: trimmedPhone || undefined,
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
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to update influencer.';
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
      }
      setError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
            title="Edit Influencer Details"
            subtitle="Update profile, category niche, target regions, socials and indicative commercials"
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
            {error && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.error.main + '14',
                  border: `1px solid ${theme.palette.error.main}30`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.error.main, fontWeight: 600 }}
                >
                  {error}
                </Typography>
              </Box>
            )}

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
                // Leaving a still-empty box is not an error yet — the dialog's
                // focus trap blurs this field on open, and the confirm button is
                // what reports a missing value. Only a filled-in value is checked.
                if (!e.target.value.trim()) {
                  setNameError('');
                  return;
                }
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
              placeholder="e.g. Varsha, Neha Nazneen"
              fullWidth
              disabled={loading}
            />

            {/* The creator's login. The agency provisions it when it enters
                them, so the agency is also the only party that can correct a
                typo in it — nobody else, including the creator, can edit this
                address from their own screens. */}
            <TextField
              label="Login / Contact Email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (val.trim()) {
                  setEmailError(validateEmail(val));
                } else {
                  setEmailError('');
                }
              }}
              onBlur={(e) => {
                const val = e.target.value.trim();
                setEmailError(val ? validateEmail(val) : '');
              }}
              error={Boolean(emailError)}
              helperText={
                emailError ||
                'Changing this changes the address this creator signs in with'
              }
              placeholder="e.g. riya@gmail.com"
              fullWidth
              disabled={loading}
            />

            <PhoneField
              label="Contact Phone"
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

            <Autocomplete
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

            {/* Tier Selector Chips */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.tokens.textSecondary,
                  display: 'block',
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Influencer Tier & Category
              </Typography>
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
                forcePopupIcon
                openOnFocus
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
                    placeholder="Select or enter location (e.g. Calicut, Kochi)"
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
                label="Commercial Rate — Min (₹)"
                value={avgCommercialMin}
                onChange={(e) => setAvgCommercialMin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 50000"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Commercial Rate — Max (₹)"
                value={avgCommercialMax}
                onChange={(e) => setAvgCommercialMax(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 150000"
                fullWidth
                disabled={loading}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
