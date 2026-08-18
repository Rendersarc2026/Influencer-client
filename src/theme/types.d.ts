import '@mui/material/styles';
import '@mui/material/Card';
import '@mui/material/Button';
import { CardTint } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    tokens: {
      pageBg: string;
      surface: string;
      rail: string;
      textPrimary: string;
      textSecondary: string;
      divider: string;
      accent: string;
      accentHover: string;
      accentText: string;
      accentBg: string;
      positive: string;
      positiveText: string;
      positiveBg: string;
      negative: string;
      negativeText: string;
      negativeBg: string;
      warningText: string;
      warningBg: string;
      purpleText: string;
      purpleBg: string;
      fieldBg: string;
      tableHover: string;
      star: string;
    };
    tints: {
      lavender: string;
      mint: string;
      butter: string;
      sky: string;
    };
    rail: string;
    field: string;
  }

  interface PaletteOptions {
    tokens?: {
      pageBg?: string;
      surface?: string;
      rail?: string;
      textPrimary?: string;
      textSecondary?: string;
      divider?: string;
      accent?: string;
      accentHover?: string;
      accentText?: string;
      accentBg?: string;
      positive?: string;
      positiveText?: string;
      positiveBg?: string;
      negative?: string;
      negativeText?: string;
      negativeBg?: string;
      warningText?: string;
      warningBg?: string;
      purpleText?: string;
      purpleBg?: string;
      fieldBg?: string;
      tableHover?: string;
      star?: string;
    };
    tints?: {
      lavender?: string;
      mint?: string;
      butter?: string;
      sky?: string;
    };
    rail?: string;
    field?: string;
  }

  interface Theme {
    customRadii: {
      card: number;
      inner: number;
      pill: number;
      rail: number;
      cardMobile: number;
    };
    customSpacing: {
      base: number;
      cardPadding: number;
      cardGap: number;
      cardPaddingMobile: number;
      cardGapMobile: number;
      dialogPaddingMobile: number;
      dialogInsetMobile: number;
    };
  }

  interface ThemeOptions {
    customRadii?: {
      card?: number;
      inner?: number;
      pill?: number;
      rail?: number;
      cardMobile?: number;
    };
    customSpacing?: {
      base?: number;
      cardPadding?: number;
      cardGap?: number;
      cardPaddingMobile?: number;
      cardGapMobile?: number;
      dialogPaddingMobile?: number;
      dialogInsetMobile?: number;
    };
  }
}

declare module '@mui/material/Card' {
  interface CardPropsVariantOverrides {
    default: true;
  }
  interface CardOwnProps {
    tint?: CardTint;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    dark: true;
  }
}
