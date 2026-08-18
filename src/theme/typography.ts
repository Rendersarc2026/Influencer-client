import { TypographyOptions } from '@mui/material/styles/createTypography';
import { tokens } from './tokens';

// MUI's default `sm` breakpoint. Written out because typography variants are
// resolved before the theme exists, so `theme.breakpoints` isn't reachable here.
const belowSm = '@media (max-width:599.95px)';

export const typography: TypographyOptions = {
  fontFamily: tokens.typography.fontFamily,
  h1: {
    fontSize: tokens.typography.h1.fontSize,
    fontWeight: tokens.typography.h1.fontWeight,
    lineHeight: tokens.typography.h1.lineHeight,
    letterSpacing: tokens.typography.h1.letterSpacing,
    color: tokens.colors.textPrimary,
    [belowSm]: { fontSize: tokens.typography.h1Mobile.fontSize },
  },
  h2: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    lineHeight: tokens.typography.h2.lineHeight,
    letterSpacing: tokens.typography.h2.letterSpacing,
    color: tokens.colors.textPrimary,
    [belowSm]: { fontSize: tokens.typography.h2Mobile.fontSize },
  },
  h3: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    lineHeight: tokens.typography.h3.lineHeight,
    letterSpacing: tokens.typography.h3.letterSpacing,
    color: tokens.colors.textPrimary,
    [belowSm]: { fontSize: tokens.typography.h3Mobile.fontSize },
  },
  h4: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    lineHeight: tokens.typography.h3.lineHeight,
    letterSpacing: tokens.typography.h3.letterSpacing,
    color: tokens.colors.textPrimary,
    [belowSm]: { fontSize: tokens.typography.h3Mobile.fontSize },
  },
  h5: {
    fontSize: tokens.typography.h3.fontSize,
    fontWeight: tokens.typography.h3.fontWeight,
    lineHeight: tokens.typography.h3.lineHeight,
    color: tokens.colors.textPrimary,
  },
  h6: {
    fontSize: tokens.typography.body1.fontSize,
    fontWeight: 600,
    lineHeight: tokens.typography.body1.lineHeight,
    color: tokens.colors.textPrimary,
  },
  body1: {
    fontSize: tokens.typography.body1.fontSize,
    fontWeight: tokens.typography.body1.fontWeight,
    lineHeight: tokens.typography.body1.lineHeight,
    color: tokens.colors.textPrimary,
  },
  body2: {
    fontSize: tokens.typography.body2.fontSize,
    fontWeight: tokens.typography.body2.fontWeight,
    lineHeight: tokens.typography.body2.lineHeight,
    color: tokens.colors.textSecondary,
  },
  caption: {
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.caption.fontWeight,
    lineHeight: tokens.typography.caption.lineHeight,
    color: tokens.colors.textSecondary,
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: tokens.typography.body1.fontSize,
  },
};
