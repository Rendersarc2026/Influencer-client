import { createTheme, Shadows } from '@mui/material/styles';
import { tokens } from './tokens';
import { palette } from './palette';
import { typography } from './typography';
import { components } from './components';

import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

export * from './tokens';
export * from './palette';
export * from './typography';
export * from './components';

// Zero/near-invisible shadow array to strip all MUI default elevation drop shadows
const flatShadows = Array(25).fill('none') as Shadows;

export const theme = createTheme({
  palette,
  typography,
  components,
  shadows: flatShadows,
  shape: {
    borderRadius: tokens.radii.inner,
  },
  spacing: tokens.spacing.base,
  customRadii: tokens.radii,
  customSpacing: tokens.spacing,
});
