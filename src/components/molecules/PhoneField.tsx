import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { splitPhone } from '@contracts';
import { COUNTRY_CALLING_CODES, DEFAULT_CALLING_CODE } from '@utils';

export interface PhoneFieldProps {
  label: string;
  /** Full E.164 value, e.g. "+919876543210". Empty string when unset. */
  value: string;
  onChange: (next: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  sx?: object;
}

/**
 * Country code and subscriber number as two controls over one stored value.
 *
 * The single free-text field this replaces asked users to type the country code
 * themselves, so "+91" and a thirteen-digit number looked exactly as valid as a
 * real one. Splitting them means the code is always present and always known,
 * which is what the per-country length rule needs to key on.
 *
 * The value handed out is still one E.164 string — the parts are a detail of
 * editing, not of storage.
 */
export const PhoneField: React.FC<PhoneFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  required,
  placeholder = '9876543210',
  fullWidth = true,
  sx,
}) => {
  const parts = useMemo(() => splitPhone(value), [value]);
  const countryCode = parts?.countryCode ?? DEFAULT_CALLING_CODE;
  const nationalNumber = parts?.nationalNumber ?? '';

  const selected = COUNTRY_CALLING_CODES.find((c) => c.code === countryCode);
  const maxDigits = selected ? Math.max(...selected.lengths) : 15;

  const emit = (code: string, national: string) => {
    // An emptied number clears the whole value rather than leaving a bare "+91"
    // behind, which no schema would accept and no user meant to enter.
    onChange(national ? `+${code}${national}` : '');
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, width: fullWidth ? '100%' : 'auto', ...sx }}>
      <TextField
        select
        label="Code"
        value={selected ? countryCode : DEFAULT_CALLING_CODE}
        onChange={(e) => emit(e.target.value, nationalNumber)}
        disabled={disabled}
        sx={{ width: 132, flexShrink: 0 }}
        slotProps={{ select: { MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } } }}
      >
        {COUNTRY_CALLING_CODES.map((c) => (
          <MenuItem key={c.code} value={c.code}>
            +{c.code}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label={required ? `${label} *` : label}
        value={nationalNumber}
        onChange={(e) => {
          // Digits only, capped at what the selected country can hold: the old
          // field accepted any length and only complained on save.
          const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, maxDigits);
          emit(countryCode, digits);
        }}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        helperText={helperText}
        fullWidth
        inputMode="numeric"
      />
    </Box>
  );
};
