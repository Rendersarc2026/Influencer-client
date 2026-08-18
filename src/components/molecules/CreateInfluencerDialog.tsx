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
import { useCategories } from '@api';
import { CreateInfluencerRequest, CategoryTypeCode } from '@contracts';
import {
  capitalizeWords,
  parseShorthandNumber,
  formatShorthandNumber,
  INFLUENCER_TIERS,
  getInfluencerTier,
  getTierInfo,
  InfluencerTier,
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTier, setSelectedTier] = useState<InfluencerTier | null>(null);
  const [location, setLocation] = useState('');
  const [followers, setFollowers] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [avgCommercialMin, setAvgCommercialMin] = useState('');
  const [avgCommercialMax, setAvgCommercialMax] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [followersError, setFollowersError] = useState('');

  const validateEmail = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Must be a valid email address (e.g. riya@gmail.com)';
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
    if (open) {
      setName('');
      setEmail('');
      setCategory('');
      setSelectedTier(null);
      setLocation('');
      setFollowers('');
      setContactPhone('');
      setInstagram('');
      setYoutube('');
      setAvgCommercialMin('');
      setAvgCommercialMax('');
      setError('');
      setEmailError('');
      setPhoneError('');
      setFollowersError('');
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
    setEmailError('');
    setPhoneError('');
    setFollowersError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setError('Influencer name is required');
      return;
    }

    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }

    const eErr = validateEmail(trimmedEmail);
    if (eErr) {
      setEmailError(eErr);
      return;
    }

    if (!trimmedPhone) {
      setPhoneError('Phone number is required');
      return;
    }

    const pErr = validatePhone(trimmedPhone);
    if (pErr) {
      setPhoneError(pErr);
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

    const payload: CreateInfluencerRequest = {
      name: trimmedName,
      email: trimmedEmail,
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      followers: parsedFollowers,
      contactPhone: trimmedPhone,
      instagram: instagram.trim() || undefined,
      youtube: youtube.trim() || undefined,
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
        <DialogTitle sx={{ pb: 1 }}>
          <SectionHeading
            title="Add Influencer"
            subtitle="Added to the influencers you represent; no login is needed until they first sign in"
          />
        </DialogTitle>

        <DialogContent
          sx={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Influencer Name *"
              value={name}
              onChange={(e) => setName(capitalizeWords(e.target.value))}
              placeholder="e.g. Riya Malhotra"
              fullWidth
              disabled={loading}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Login / Contact Email *"
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (emailError) {
                    if (!val.trim()) setEmailError('Email is required');
                    else setEmailError(validateEmail(val));
                  }
                }}
                onBlur={() => {
                  if (!email.trim()) {
                    setEmailError('Email is required');
                  } else {
                    setEmailError(validateEmail(email));
                  }
                }}
                error={Boolean(emailError)}
                helperText={
                  emailError || 'Required: Influencer will use this email address to log in'
                }
                placeholder="e.g. riya@gmail.com"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Contact Phone *"
                value={contactPhone}
                onChange={(e) => {
                  const val = e.target.value;
                  setContactPhone(val);
                  if (phoneError) {
                    if (!val.trim()) setPhoneError('Phone number is required');
                    else setPhoneError(validatePhone(val));
                  }
                }}
                onBlur={() => {
                  if (!contactPhone.trim()) {
                    setPhoneError('Phone number is required');
                  } else {
                    setPhoneError(validatePhone(contactPhone));
                  }
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || 'Required: the influencer’s direct line'}
                placeholder="e.g. +91 9876543210"
                fullWidth
                disabled={loading}
              />
            </Box>

            <Autocomplete
              fullWidth
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(capitalizeWords(e.target.value))}
                placeholder="e.g. Mumbai"
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Instagram Handle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. @riya.malhotra"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="YouTube Handle"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="e.g. @riyamalhotra"
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
