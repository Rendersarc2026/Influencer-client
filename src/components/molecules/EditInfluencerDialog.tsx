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
import { useCategories, useLocations } from '@api';
import { InfluencerResponse, UpdateInfluencerRequest, CategoryTypeCode } from '@contracts';
import {
  capitalizeWords,
  parseShorthandNumber,
  formatShorthandNumber,
  INFLUENCER_TIERS,
  getInfluencerTier,
  getTierInfo,
  InfluencerTier,
} from '@utils';

export interface EditInfluencerDialogProps {
  open: boolean;
  influencer: InfluencerResponse | null;
  loading?: boolean;
  onSubmit: (data: UpdateInfluencerRequest) => Promise<void> | void;
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
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [avgCommercialMin, setAvgCommercialMin] = useState('');
  const [avgCommercialMax, setAvgCommercialMax] = useState('');
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [followersError, setFollowersError] = useState('');
  const [instagramError, setInstagramError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  const normalizeSocialUrl = (val: string, domain: 'instagram.com' | 'youtube.com'): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
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

  const validatePhone = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    const stripped = trimmed.replace(/[\s()-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(stripped)) {
      return 'Must be a valid phone number (7-15 digits, optional + prefix)';
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
      setContactPhone(influencer.contactPhone || '');
      setInstagram(influencer.instagram || '');
      setYoutube(influencer.youtube || '');
      setAvgCommercialMin(influencer.avgCommercialMin ? String(influencer.avgCommercialMin) : '');
      setAvgCommercialMax(influencer.avgCommercialMax ? String(influencer.avgCommercialMax) : '');
      setError('');
      setNameError('');
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
    setPhoneError('');
    setFollowersError('');
    setInstagramError('');
    setYoutubeError('');

    const trimmedName = name.trim();
    let hasFieldErr = false;

    if (!trimmedName) {
      setNameError('Influencer name is required');
      hasFieldErr = true;
    }

    const trimmedPhone = contactPhone.trim();
    if (trimmedPhone) {
      const pErr = validatePhone(trimmedPhone);
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
        setFollowersError('Must be a valid positive number (e.g. 10k, 100k, 1m)');
        return;
      }
      parsedFollowers = parsed;
    }

    let min: number | undefined = undefined;
    let max: number | undefined = undefined;
    if (avgCommercialMin.trim()) {
      const parsedMin = Number(avgCommercialMin.replace(/,/g, ''));
      if (isNaN(parsedMin) || parsedMin < 0) {
        setError('Minimum rate must be a valid positive number.');
        return;
      }
      min = parsedMin;
    }
    if (avgCommercialMax.trim()) {
      const parsedMax = Number(avgCommercialMax.replace(/,/g, ''));
      if (isNaN(parsedMax) || parsedMax < 0) {
        setError('Maximum rate must be a valid positive number.');
        return;
      }
      max = parsedMax;
    }
    if (min !== undefined && max !== undefined && max < min) {
      setError('Maximum indicative rate cannot be less than minimum indicative rate.');
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

    const finalInstagram = instagram.trim() ? normalizeSocialUrl(instagram, 'instagram.com') : undefined;
    const finalYoutube = youtube.trim() ? normalizeSocialUrl(youtube, 'youtube.com') : undefined;

    const payload: UpdateInfluencerRequest = {
      name: trimmedName,
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
                <Typography variant="body2" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                  {error}
                </Typography>
              </Box>
            )}

            <TextField
              label="Influencer Name *"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                if (val.trim()) {
                  setNameError('');
                }
              }}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (!val) {
                  setNameError('Influencer name is required');
                } else {
                  setNameError('');
                }
              }}
              error={Boolean(nameError)}
              helperText={nameError || undefined}
              placeholder="e.g. Varsha, Neha Nazneen"
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Contact Phone"
              value={contactPhone}
              onChange={(e) => {
                const val = e.target.value;
                setContactPhone(val);
                if (phoneError) setPhoneError(validatePhone(val));
              }}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val) setPhoneError(validatePhone(val));
                else setPhoneError('');
              }}
              placeholder="+91 98765 43210"
              error={Boolean(phoneError)}
              helperText={phoneError || 'Influencer direct contact number'}
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
                  label="Influencer Niche / Category"
                  placeholder="Select or enter category (e.g. Fashion & Lifestyle)"
                  helperText="Influencer content niche / domain"
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(capitalizeWords(e.target.value))}
                placeholder="e.g. Calicut, Kochi"
                fullWidth
                disabled={loading}
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
                    : 'Format: 10k, 100k, 1m or select a tier above')
                }
                fullWidth
                disabled={loading}
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
              disabled={loading}
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
                  helperText="Key geographical target regions where this influencer's audience is strongest (optional)"
                  fullWidth
                />
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Instagram Profile URL"
                value={instagram}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  if (instagramError) setInstagramError(validateSocialUrl(e.target.value, 'Instagram URL'));
                }}
                onBlur={() => {
                  if (instagram.trim()) {
                    setInstagramError(validateSocialUrl(instagram, 'Instagram Profile URL'));
                  }
                }}
                placeholder="https://instagram.com/username"
                error={Boolean(instagramError)}
                helperText={instagramError || 'Full Instagram profile link'}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="YouTube Channel URL"
                value={youtube}
                onChange={(e) => {
                  setYoutube(e.target.value);
                  if (youtubeError) setYoutubeError(validateSocialUrl(e.target.value, 'YouTube URL'));
                }}
                onBlur={() => {
                  if (youtube.trim()) {
                    setYoutubeError(validateSocialUrl(youtube, 'YouTube Channel URL'));
                  }
                }}
                placeholder="https://youtube.com/@channel"
                error={Boolean(youtubeError)}
                helperText={youtubeError || 'Full YouTube channel link'}
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Indicative Rate — Min (₹)"
                value={avgCommercialMin}
                onChange={(e) => setAvgCommercialMin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 50000"
                helperText="Baseline quote minimum"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Indicative Rate — Max (₹)"
                value={avgCommercialMax}
                onChange={(e) => setAvgCommercialMax(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 150000"
                helperText="Baseline quote ceiling"
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
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
