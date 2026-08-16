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
import { CreateBrandRequest, UpdateBrandRequest, BrandResponse } from '@contracts';

export interface CreateBrandDialogProps {
  open: boolean;
  brandToEdit?: BrandResponse | null;
  loading?: boolean;
  onSubmit: (
    data: CreateBrandRequest | UpdateBrandRequest,
    brandId?: string,
  ) => Promise<void> | void;
  onClose: () => void;
}

export const CreateBrandDialog: React.FC<CreateBrandDialogProps> = ({
  open,
  brandToEdit,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (val: string) => {
    if (!val) return '';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (val: string) => {
    if (!val) return '';
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
    if (!phoneRegex.test(val)) return 'Please enter a valid phone number (e.g. +91 9876543210)';
    return '';
  };

  useEffect(() => {
    if (open) {
      setName(brandToEdit?.name || '');
      setIndustry(brandToEdit?.industry || '');
      setContactEmail(brandToEdit?.contactEmail || '');
      setContactPhone(brandToEdit?.contactPhone || '');
      setEmailError('');
      setPhoneError('');
      setError('');
    }
  }, [open, brandToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPhoneError('');

    const trimmedName = name.trim();
    const trimmedEmail = contactEmail.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setError('Brand name is required');
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

    const payload = {
      name: trimmedName,
      industry: industry.trim() || undefined,
      contactEmail: trimmedEmail,
      contactPhone: trimmedPhone,
    };

    try {
      await onSubmit(payload, brandToEdit?.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errorObj?.response?.data?.message || errorObj?.message || 'Failed to save brand.';
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
      maxWidth="xs"
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
            title={brandToEdit ? 'Edit Brand' : 'Create New Brand'}
            subtitle="Manage agency client brand accounts"
          />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Brand Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GlowSkin Co."
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Login / Contact Email *"
              value={contactEmail}
              onChange={(e) => {
                const val = e.target.value;
                setContactEmail(val);
                if (emailError) {
                  if (!val.trim()) setEmailError('Email is required');
                  else setEmailError(validateEmail(val));
                }
              }}
              onBlur={() => {
                if (!contactEmail.trim()) {
                  setEmailError('Email is required');
                } else {
                  setEmailError(validateEmail(contactEmail));
                }
              }}
              error={Boolean(emailError)}
              helperText={
                emailError || 'Required: Brand manager will use this email address to log in'
              }
              placeholder="e.g. manager@brand.com"
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
              helperText={phoneError || 'Required: the brand manager\u2019s direct line'}
              placeholder="e.g. +91 9876543210"
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Industry / Category"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Beauty & Wellness"
              fullWidth
              disabled={loading}
            />

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
            disabled={loading || !name.trim() || !contactEmail.trim() || !contactPhone.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : brandToEdit ? (
              'Save Changes'
            ) : (
              'Create Brand'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
