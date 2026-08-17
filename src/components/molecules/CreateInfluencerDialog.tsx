import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { useCategories } from '@api';
import { CreateInfluencerRequest, CategoryTypeCode } from '@contracts';
import { capitalizeWords, parseShorthandNumber, formatShorthandNumber } from '@utils';

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

            <Box sx={{ display: 'flex', gap: 2 }}>
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
                sx={{ flex: 1 }}
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
                helperText={phoneError || 'Required: the influencer\u2019s direct line'}
                placeholder="e.g. +91 9876543210"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
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
                  label="Influencer Category"
                  placeholder="Select or enter category (e.g. Fashion & Lifestyle)"
                  helperText="Influencer niche / content domain"
                  fullWidth
                />
              )}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(capitalizeWords(e.target.value))}
                placeholder="e.g. Mumbai"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Followers"
                value={followers}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/-/g, '');
                  setFollowers(cleaned);
                  if (cleaned.trim()) {
                    const parsed = parseShorthandNumber(cleaned);
                    if (parsed === null) {
                      setFollowersError('Enter valid followers (e.g. 10k, 100k, 1m)');
                    } else {
                      setFollowersError('');
                    }
                  } else {
                    setFollowersError('');
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
                placeholder="e.g. 10k, 100k, 1m"
                error={Boolean(followersError)}
                helperText={
                  followersError ||
                  (followers && parseShorthandNumber(followers) !== null
                    ? `${parseShorthandNumber(followers)?.toLocaleString('en-IN')} followers`
                    : 'Format: 10k, 100k, 1m')
                }
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Instagram Handle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="e.g. @riya.malhotra"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <TextField
                label="YouTube Handle"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="e.g. @riyamalhotra"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Indicative Rate — Min (₹)"
                value={avgCommercialMin}
                onChange={(e) => setAvgCommercialMin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 5000"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Indicative Rate — Max (₹)"
                value={avgCommercialMax}
                onChange={(e) => setAvgCommercialMax(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 15000"
                fullWidth
                disabled={loading}
                sx={{ flex: 1 }}
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
