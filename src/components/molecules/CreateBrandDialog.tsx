import React, { useState, useEffect, useMemo } from 'react';
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
import { CreateBrandRequest, UpdateBrandRequest, BrandResponse, CategoryTypeCode} from '@contracts';
import { capitalizeWords } from '@utils';

export interface CreateBrandDialogProps {
  open: boolean;
  brandToEdit?: BrandResponse | null;
  /**
   * The brands already on this agency's client list, used only to warn about a
   * duplicate while typing. The server refuses the same name or contact email
   * regardless — this just surfaces the clash before the round trip.
   */
  existingBrands?: Array<BrandResponse>;
  loading?: boolean;
  onSubmit: (
    data: CreateBrandRequest | UpdateBrandRequest,
    brandId?: string,
  ) => Promise<void> | void;
  onClose: () => void;
}

const normalize = (value: string | null | undefined): string => (value || '').trim().toLowerCase();

export const CreateBrandDialog: React.FC<CreateBrandDialogProps> = ({
  open,
  brandToEdit,
  existingBrands = [],
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const { data: brandCategoriesData } = useCategories(CategoryTypeCode.BRAND);
  const brandCategoryOptions = useMemo(
    () => (brandCategoriesData || []).map((c) => c.name),
    [brandCategoriesData],
  );

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');

  const isEdit = Boolean(brandToEdit);
  const busy = loading;

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

  /**
   * The brand the typed details would duplicate, if any. Matched on name or
   * contact email, the two the server refuses a second registration on — so the
   * clash is visible while typing rather than only after a failed submit.
   */
  const duplicate = useMemo(() => {
    if (isEdit) return null;
    const typedName = normalize(name);
    const typedEmail = normalize(contactEmail);
    if (!typedName && !typedEmail) return null;

    return (
      existingBrands.find(
        (b) =>
          (typedName && normalize(b.name) === typedName) ||
          (typedEmail && normalize(b.contactEmail) === typedEmail),
      ) || null
    );
  }, [existingBrands, name, contactEmail, isEdit]);

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

    // The server refuses this too; stopping here keeps the user on the form
    // with the brand they collided with still named on screen.
    if (duplicate) {
      setError(`${duplicate.name} is already one of your client brands.`);
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

  const submitDisabled =
    busy || !name.trim() || !contactEmail.trim() || !contactPhone.trim() || Boolean(duplicate);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="xs"
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
            title={isEdit ? 'Edit Brand' : 'Create New Brand'}
            subtitle="Manage agency client brand accounts"
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
              label="Brand Name *"
              value={name}
              onChange={(e) => setName(capitalizeWords(e.target.value))}
              placeholder="e.g. GlowSkin Co."
              fullWidth
              disabled={busy}
              error={Boolean(duplicate)}
            />

            {duplicate && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  padding: '12px',
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: theme.palette.tokens.warningBg,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.tokens.warningText }}>
                  {duplicate.name} is already one of your client brands.
                </Typography>
              </Box>
            )}

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
              disabled={busy}
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
              helperText={phoneError || 'Required: the brand manager’s direct line'}
              placeholder="e.g. +91 9876543210"
              fullWidth
              disabled={busy}
            />

            <Autocomplete
              freeSolo
              options={brandCategoryOptions}
              value={industry}
              onInputChange={(_, newInputValue) => setIndustry(newInputValue)}
              onChange={(_, newValue) => setIndustry(newValue || '')}
              disabled={busy}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Brand Category"
                  placeholder="Select brand category (e.g. Fashion & Apparel)"
                  helperText="Industry classification for the brand"
                  fullWidth
                />
              )}
            />

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitDisabled} sx={{ minWidth: 120 }}>
            {busy ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Brand'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
