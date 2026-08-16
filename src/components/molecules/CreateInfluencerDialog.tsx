import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { CreateInfluencerRequest } from '@contracts';

export interface CreateInfluencerDialogProps {
  open: boolean;
  /** Shown only when the dialog is opened from the agency portal. */
  addsToRoster?: boolean;
  loading?: boolean;
  onSubmit: (data: CreateInfluencerRequest) => Promise<void> | void;
  onClose: () => void;
}

export const CreateInfluencerDialog: React.FC<CreateInfluencerDialogProps> = ({
  open,
  addsToRoster = false,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
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
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPhoneError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setError('Creator name is required');
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

    const min = avgCommercialMin ? Number(avgCommercialMin) : undefined;
    const max = avgCommercialMax ? Number(avgCommercialMax) : undefined;
    if (min !== undefined && max !== undefined && max < min) {
      setError('Max commercial must be greater than or equal to min commercial');
      return;
    }

    const payload: CreateInfluencerRequest = {
      name: trimmedName,
      email: trimmedEmail,
      category: category.trim() || undefined,
      location: location.trim() || undefined,
      followers: followers ? Number(followers) : undefined,
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
        errorObj?.response?.data?.message || errorObj?.message || 'Failed to add creator.';
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
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '12px',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <SectionHeading
            title="Add Creator"
            subtitle={
              addsToRoster
                ? 'Adds a directory entry and puts it straight on your roster'
                : 'A directory entry — no login required until the creator signs in themselves'
            }
          />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Creator Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                  emailError || 'Required: Creator will use this email address to log in'
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
                helperText={phoneError || 'Required: the creator\u2019s direct line'}
                placeholder="e.g. +91 9876543210"
                fullWidth
                disabled={loading}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Beauty & Lifestyle"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai"
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Followers"
                type="number"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="e.g. 50000"
                fullWidth
                disabled={loading}
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

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Indicative Rate — Min (₹)"
                type="number"
                value={avgCommercialMin}
                onChange={(e) => setAvgCommercialMin(e.target.value)}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="Indicative Rate — Max (₹)"
                type="number"
                value={avgCommercialMax}
                onChange={(e) => setAvgCommercialMax(e.target.value)}
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
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Add Creator'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
