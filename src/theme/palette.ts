import { PaletteOptions } from '@mui/material/styles';
import { tokens } from './tokens';

export const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: tokens.colors.accent,
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: tokens.colors.rail,
    contrastText: '#FFFFFF',
  },
  success: {
    main: tokens.colors.positive,
    contrastText: '#FFFFFF',
  },
  error: {
    main: tokens.colors.negative,
    contrastText: '#FFFFFF',
  },
  background: {
    default: tokens.colors.pageBg,
    paper: tokens.colors.surface,
  },
  text: {
    primary: tokens.colors.textPrimary,
    secondary: tokens.colors.textSecondary,
    disabled: tokens.colors.textSecondary,
  },
  divider: tokens.colors.divider,
  tokens: {
    pageBg: tokens.colors.pageBg,
    surface: tokens.colors.surface,
    rail: tokens.colors.rail,
    textPrimary: tokens.colors.textPrimary,
    textSecondary: tokens.colors.textSecondary,
    divider: tokens.colors.divider,
    accent: tokens.colors.accent,
    accentHover: tokens.colors.accentHover,
    accentText: tokens.colors.accentText,
    accentBg: tokens.colors.accentBg,
    positive: tokens.colors.positive,
    positiveText: tokens.colors.positiveText,
    positiveBg: tokens.colors.positiveBg,
    negative: tokens.colors.negative,
    negativeText: tokens.colors.negativeText,
    negativeBg: tokens.colors.negativeBg,
    warningText: tokens.colors.warningText,
    warningBg: tokens.colors.warningBg,
    purpleText: tokens.colors.purpleText,
    purpleBg: tokens.colors.purpleBg,
    fieldBg: tokens.colors.fieldBg,
    tableHover: tokens.colors.tableHover,
    star: tokens.colors.star,
  },
  tints: {
    lavender: tokens.tints.lavender,
    mint: tokens.tints.mint,
    butter: tokens.tints.butter,
    sky: tokens.tints.sky,
  },
  rail: tokens.colors.rail,
  field: tokens.colors.fieldBg,
};
