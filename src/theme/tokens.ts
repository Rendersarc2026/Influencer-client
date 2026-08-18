export const tokens = {
  colors: {
    pageBg: '#EDF3F9',
    surface: '#FFFFFF',
    rail: '#1A1D23',
    textPrimary: '#101114',
    textSecondary: '#8A9099',
    divider: '#EEF0F3',
    accent: '#2F80ED',
    accentHover: '#256ECC',
    accentText: '#1D4ED8',
    accentBg: '#DCEAFA',
    positive: '#2E9E5B',
    positiveText: '#0F5132',
    positiveBg: '#DEF2E5',
    negative: '#E05252',
    negativeText: '#991B1B',
    negativeBg: '#FEE2E2',
    warningText: '#475569',
    warningBg: '#F1F4F8',
    purpleText: '#6B46C1',
    purpleBg: '#EDE7FB',
    fieldBg: '#F4F6F9',
    tableHover: '#F8FAFC',
    star: '#F59E0B',
  },
  tints: {
    lavender: '#F1F4F8',
    mint: '#F1F4F8',
    butter: '#F1F4F8',
    sky: '#F1F4F8',
  },
  radii: {
    card: 24,
    inner: 16,
    pill: 999,
    rail: 28,
    /** Phones sit the card against the viewport edge, so the corner reads
     *  heavier at the same radius — 16 keeps it optically equal to 24. */
    cardMobile: 16,
  },
  spacing: {
    base: 8,
    cardPadding: 24,
    cardGap: 20,
    /** A phone has ~360px of width to spend; 24px of chrome per side eats a
     *  seventh of the line. These are the same paddings dialled back. */
    cardPaddingMobile: 14,
    cardGapMobile: 14,
    dialogPaddingMobile: 16,
    /** Gap between the dialog sheet and the viewport edge on a phone. */
    dialogInsetMobile: 8,
  },
  typography: {
    fontFamily:
      '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' },
    h2: { fontSize: '22px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em' },
    h3: { fontSize: '18px', fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.02em' },
    /** Headings set for a desktop column are too loud on a ~360px line — a
     *  32px h1 eats four lines of a card. Applied below `sm` by `typography`. */
    h1Mobile: { fontSize: '24px' },
    h2Mobile: { fontSize: '18px' },
    h3Mobile: { fontSize: '16px' },
    body1: { fontSize: '14px', fontWeight: 500, lineHeight: 1.5 },
    /** iOS Safari zooms the viewport when a focused control's text is under
     *  16px. Every input therefore grows to this below `sm`. */
    inputMobile: { fontSize: '16px' },
    body2: { fontSize: '13px', fontWeight: 500, lineHeight: 1.5 },
    caption: { fontSize: '12px', fontWeight: 500, lineHeight: 1.45 },
  },
} as const;

export type CardTint = keyof typeof tokens.tints;
