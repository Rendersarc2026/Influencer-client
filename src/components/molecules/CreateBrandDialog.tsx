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
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { useCategories, useLocations } from '@api';
import { CreateBrandRequest, UpdateBrandRequest, BrandResponse, CategoryTypeCode } from '@contracts';
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

const normalizeUrl = (val: string): string | undefined => {
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

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

  const { data: locationsData } = useLocations();
  const locationOptions = useMemo(
    () => (locationsData || []).map((l) => l.name),
    [locationsData],
  );

  const isEdit = Boolean(brandToEdit);
  const busy = loading;

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [websiteError, setWebsiteError] = useState('');
  const [logoUrlError, setLogoUrlError] = useState('');
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

  useEffect(() => {
    if (open) {
      setName(brandToEdit?.name || '');
      setIndustry(brandToEdit?.industry || '');
      setContactPerson(brandToEdit?.contactPerson || '');
      setContactEmail(brandToEdit?.contactEmail || '');
      setContactPhone(brandToEdit?.contactPhone || '');
      setWebsite(brandToEdit?.website || '');
      setCity(brandToEdit?.city || '');
      setAddress(brandToEdit?.address || '');
      setLogoUrl(brandToEdit?.logoUrl || '');
      setBio(brandToEdit?.bio || '');
      setIsActive(brandToEdit?.isActive ?? true);

      setEmailError('');
      setPhoneError('');
      setWebsiteError('');
      setLogoUrlError('');
      setError('');
    }
  }, [open, brandToEdit]);

  /**
   * The brand the typed details would duplicate, if any. Matched on name or
   * contact email, the two the server refuses a second registration on — so the
   * clash is visible while typing rather than only after a failed submit.
   */
  const duplicate = useMemo(() => {
    const typedName = normalize(name);
    const typedEmail = normalize(contactEmail);
    if (!typedName && !typedEmail) return null;

    return (
      existingBrands.find(
        (b) =>
          b.id !== brandToEdit?.id &&
          ((typedName && normalize(b.name) === typedName) ||
            (typedEmail && normalize(b.contactEmail) === typedEmail)),
      ) || null
    );
  }, [existingBrands, name, contactEmail, brandToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setEmailError('');
    setPhoneError('');
    setWebsiteError('');
    setLogoUrlError('');

    const trimmedName = name.trim();
    const trimmedEmail = contactEmail.trim().toLowerCase();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setError('Brand name is required');
      return;
    }

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

    if (website.trim()) {
      const wErr = validateHttpUrl(website);
      if (wErr) {
        setWebsiteError(wErr);
        return;
      }
    }

    if (logoUrl.trim()) {
      const lErr = validateHttpUrl(logoUrl);
      if (lErr) {
        setLogoUrlError(lErr);
        return;
      }
    }

    const payload: CreateBrandRequest | UpdateBrandRequest = {
      name: trimmedName,
      industry: industry.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      contactEmail: trimmedEmail,
      contactPhone: trimmedPhone,
      website: normalizeUrl(website),
      city: city.trim() || undefined,
      address: address.trim() || undefined,
      logoUrl: normalizeUrl(logoUrl),
      bio: bio.trim() || undefined,
      ...(isEdit ? { isActive } : {}),
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
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: {
              xs: `${theme.customSpacing.dialogPaddingMobile}px`,
              sm: `${theme.customSpacing.cardPadding}px`,
            },
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 0, px: 0, pt: 0 }}>
          <SectionHeading
            title={isEdit ? 'Edit Brand Details' : 'Create New Brand'}
            subtitle={
              isEdit
                ? 'Update brand profile, contact personnel, and account settings'
                : 'Enter complete brand profile, contact information, and representation details'
            }
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            px: 0,
            pt: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Section: Brand Information */}
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Brand Information
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Brand Name *"
                value={name}
                onChange={(e) => setName(capitalizeWords(e.target.value))}
                placeholder="e.g. GlowSkin Co."
                fullWidth
                disabled={busy}
                error={Boolean(duplicate)}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                freeSolo
                options={brandCategoryOptions}
                value={industry}
                onInputChange={(_, newInputValue) => setIndustry(newInputValue)}
                onChange={(_, newValue) => setIndustry(newValue || '')}
                disabled={busy}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Brand Category / Industry"
                    placeholder="Select or enter category"
                    fullWidth
                  />
                )}
              />
            </Box>

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

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Website URL"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value);
                  if (websiteError) setWebsiteError('');
                }}
                onBlur={() => {
                  if (website.trim()) {
                    setWebsiteError(validateHttpUrl(website));
                  }
                }}
                error={Boolean(websiteError)}
                helperText={websiteError || 'Official website link'}
                placeholder="https://brand.com"
                fullWidth
                disabled={busy}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Logo / Avatar URL"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  if (logoUrlError) setLogoUrlError('');
                }}
                onBlur={() => {
                  if (logoUrl.trim()) {
                    setLogoUrlError(validateHttpUrl(logoUrl));
                  }
                }}
                error={Boolean(logoUrlError)}
                helperText={logoUrlError || 'Public image URL for brand logo'}
                placeholder="https://brand.com/logo.png"
                fullWidth
                disabled={busy}
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              label="Bio & Brand Overview"
              multiline
              rows={3}
              placeholder="Short description of brand positioning, products, and campaign focus"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              fullWidth
              disabled={busy}
            />

            {/* Section: Contact & Location Details */}
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mt: 1,
              }}
            >
              Contact & Location Details
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Contact Person"
                value={contactPerson}
                onChange={(e) => setContactPerson(capitalizeWords(e.target.value))}
                placeholder="e.g. Varghese Alukkas"
                fullWidth
                disabled={busy}
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
                helperText={phoneError || 'Direct phone number for manager'}
                placeholder="e.g. +91 9876543210"
                fullWidth
                disabled={busy}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
                  emailError || 'Brand manager will use this email address to log in'
                }
                placeholder="e.g. manager@brand.com"
                fullWidth
                disabled={busy}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                freeSolo
                options={locationOptions}
                value={city}
                onInputChange={(_, newInputValue) => setCity(capitalizeWords(newInputValue))}
                onChange={(_, newValue) => setCity(newValue ? capitalizeWords(newValue) : '')}
                disabled={busy}
                sx={{ flex: 1 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="City / Region"
                    placeholder="Select or enter location (e.g. Kochi, Mumbai)"
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
              fullWidth
              disabled={busy}
            />

            {isEdit && (
              <TextField
                select
                label="Account Status"
                value={isActive ? 'ACTIVE' : 'ARCHIVED'}
                onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                fullWidth
                disabled={busy}
              >
                <MenuItem value="ACTIVE">Active Account</MenuItem>
                <MenuItem value="ARCHIVED">Archived / Inactive Account</MenuItem>
              </TextField>
            )}

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, px: 0, pb: 0, pt: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitDisabled} sx={{ minWidth: 140 }}>
            {busy ? (
              <CircularProgress size={20} color="inherit" />
            ) : isEdit ? (
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

