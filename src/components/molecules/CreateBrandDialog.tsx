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
import { SectionHeading, Pill } from '@atoms';
import { useCategories } from '@api';
import { CreateBrandRequest, UpdateBrandRequest, BrandResponse } from '@contracts';

/** Adding an existing client versus registering one that is new to the platform. */
type BrandDialogMode = 'EXISTING' | 'NEW';

export interface CreateBrandDialogProps {
  open: boolean;
  brandToEdit?: BrandResponse | null;
  /**
   * Every active brand on the platform. Feeds the "add existing" picker and
   * the duplicate check on the create form — a brand is registered once
   * platform-wide, so the same one must not be signed up twice.
   */
  directory?: Array<BrandResponse>;
  /** The directory is fetched when the dialog opens, so the picker has to say
   *  "loading" rather than "there are none" while it is in flight. */
  directoryLoading?: boolean;
  /** The acting agency, so brands it already manages drop out of the picker. */
  agencyId?: string | null;
  loading?: boolean;
  /** The link request, which is a different mutation from the create. */
  linking?: boolean;
  onSubmit: (
    data: CreateBrandRequest | UpdateBrandRequest,
    brandId?: string,
  ) => Promise<void> | void;
  /** Omitted where linking is not offered — the admin portal edits in place. */
  onLinkExisting?: (brandId: string) => Promise<void> | void;
  onClose: () => void;
}

const normalize = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase();

export const CreateBrandDialog: React.FC<CreateBrandDialogProps> = ({
  open,
  brandToEdit,
  directory = [],
  directoryLoading = false,
  agencyId,
  loading = false,
  linking = false,
  onSubmit,
  onLinkExisting,
  onClose,
}) => {
  const theme = useTheme();
  const { data: brandCategoriesData } = useCategories('BRAND');
  const brandCategoryOptions = useMemo(
    () => (brandCategoriesData || []).map((c) => c.name),
    [brandCategoriesData],
  );

  const [mode, setMode] = useState<BrandDialogMode>('EXISTING');
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');

  // Editing an existing brand is a single-purpose form: the mode switch and
  // the picker only make sense while adding one.
  const isEdit = Boolean(brandToEdit);
  const canLink = Boolean(onLinkExisting) && !isEdit;
  const busy = loading || linking;

  /** Brands this agency does not manage yet — the only ones worth linking. */
  const linkableBrands = useMemo(
    () => directory.filter((b) => !agencyId || !b.agencyIds.includes(agencyId)),
    [directory, agencyId],
  );

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
      setMode(canLink ? 'EXISTING' : 'NEW');
      setSelectedBrand(null);
      setName(brandToEdit?.name || '');
      setIndustry(brandToEdit?.industry || '');
      setContactEmail(brandToEdit?.contactEmail || '');
      setContactPhone(brandToEdit?.contactPhone || '');
      setEmailError('');
      setPhoneError('');
      setError('');
    }
  }, [open, brandToEdit, canLink]);

  /**
   * The brand the typed details would duplicate, if any. Matched on name or
   * contact email, the two the server refuses a second registration on — so
   * the clash is visible while typing rather than only after a failed submit.
   */
  const duplicate = useMemo(() => {
    if (isEdit) return null;
    const typedName = normalize(name);
    const typedEmail = normalize(contactEmail);
    if (!typedName && !typedEmail) return null;

    return (
      directory.find(
        (b) =>
          (typedName && normalize(b.name) === typedName) ||
          (typedEmail && normalize(b.contactEmail) === typedEmail),
      ) || null
    );
  }, [directory, name, contactEmail, isEdit]);

  const duplicateIsManaged = Boolean(
    duplicate && agencyId && duplicate.agencyIds.includes(agencyId),
  );

  const handleUseExisting = () => {
    if (!duplicate) return;
    setMode('EXISTING');
    setSelectedBrand(duplicate);
    setError('');
  };

  const handleLink = async () => {
    if (!selectedBrand || !onLinkExisting) return;
    setError('');
    try {
      await onLinkExisting(selectedBrand.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to add brand.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'EXISTING') {
      if (!selectedBrand) {
        setError('Please select a brand');
        return;
      }
      await handleLink();
      return;
    }

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
      setError(
        duplicateIsManaged
          ? `${duplicate.name} is already one of your client brands.`
          : `${duplicate.name} is already registered. Add the existing brand instead.`,
      );
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
    busy ||
    (mode === 'EXISTING'
      ? !selectedBrand
      : !name.trim() || !contactEmail.trim() || !contactPhone.trim() || Boolean(duplicate));

  const submitLabel = isEdit ? 'Save Changes' : mode === 'EXISTING' ? 'Add Brand' : 'Create Brand';

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
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
            title={isEdit ? 'Edit Brand' : canLink ? 'Add a Client Brand' : 'Create New Brand'}
            subtitle={
              canLink && !isEdit
                ? 'Take on a brand already on the platform, or register a new one'
                : 'Manage agency client brand accounts'
            }
          />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {canLink && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Pill
                  label="Existing Brand"
                  selected={mode === 'EXISTING'}
                  onClick={() => {
                    setMode('EXISTING');
                    setError('');
                  }}
                />
                <Pill
                  label="New Brand"
                  selected={mode === 'NEW'}
                  onClick={() => {
                    setMode('NEW');
                    setError('');
                  }}
                />
              </Box>
            )}

            {mode === 'EXISTING' && canLink ? (
              <>
                <Autocomplete<BrandResponse>
                  options={linkableBrands}
                  value={selectedBrand}
                  onChange={(_, value) => {
                    setSelectedBrand(value);
                    setError('');
                  }}
                  disabled={busy}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={directoryLoading}
                  noOptionsText={
                    directoryLoading
                      ? 'Loading brands…'
                      : directory.length
                        ? 'Every brand on the platform is already yours'
                        : 'No brands on the platform yet'
                  }
                  renderOption={(props, option) => (
                    // `props` carries the option's key; spreading it is the
                    // documented pattern for MUI's Autocomplete on React 18.
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {option.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: theme.palette.tokens.textSecondary }}
                        >
                          {option.industry || 'General Industry'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Brand *"
                      placeholder="Search brands by name"
                      helperText="Adds an existing brand to your client list — its details stay as they are"
                    />
                  )}
                />

                {selectedBrand && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      padding: '12px',
                      borderRadius: `${theme.customRadii.inner}px`,
                      backgroundColor: theme.palette.tokens.fieldBg,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedBrand.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary }}
                    >
                      {selectedBrand.industry || 'General Industry'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary }}
                    >
                      {selectedBrand.contactEmail || 'No contact email on file'}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <>
                <TextField
                  label="Brand Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                      {duplicateIsManaged
                        ? `${duplicate.name} is already one of your client brands.`
                        : `${duplicate.name} is already registered on the platform. Add the existing brand instead of creating it again.`}
                    </Typography>
                    {!duplicateIsManaged && canLink && (
                      <Button variant="outlined" size="small" onClick={handleUseExisting}>
                        Add existing brand
                      </Button>
                    )}
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
              </>
            )}

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
          <Button
            type="submit"
            variant="contained"
            disabled={submitDisabled}
            sx={{ minWidth: 120 }}
          >
            {busy ? <CircularProgress size={20} color="inherit" /> : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
