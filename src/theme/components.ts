import { Components, Theme } from '@mui/material/styles';
import { tokens } from './tokens';

export const components: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: tokens.colors.pageBg,
        color: tokens.colors.textPrimary,
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        boxShadow: 'none',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      // Every elevation shadow is stripped to 'none', so a dropdown panel has
      // nothing separating it from the rows behind it. The same 1px line the
      // fields carry gives it an edge.
      paper: {
        border: `1px solid ${tokens.colors.divider}`,
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: ({ ownerState }) => {
        const tint = ownerState.tint;
        if (tint && tokens.tints[tint]) {
          return {
            borderRadius: tokens.radii.card,
            backgroundColor: tokens.tints[tint],
            border: 'none',
            boxShadow: 'none',
            backgroundImage: 'none',
          };
        }
        return {
          borderRadius: tokens.radii.card,
          backgroundColor: tokens.colors.surface,
          border: `1px solid ${tokens.colors.divider}`,
          boxShadow: 'none',
          backgroundImage: 'none',
        };
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: tokens.radii.pill,
        textTransform: 'none',
        height: 44,
        paddingLeft: 20,
        paddingRight: 20,
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
      contained: {
        backgroundColor: tokens.colors.accent,
        color: '#FFFFFF',
        '&:hover': {
          backgroundColor: '#256ECC',
          boxShadow: 'none',
        },
        '&.Mui-disabled': {
          backgroundColor: tokens.colors.fieldBg,
          color: tokens.colors.textSecondary,
        },
      },
      outlined: {
        borderColor: tokens.colors.divider,
        color: tokens.colors.textPrimary,
        '&:hover': {
          borderColor: tokens.colors.textSecondary,
          backgroundColor: tokens.colors.fieldBg,
        },
      },
      text: {
        color: tokens.colors.textPrimary,
        '&:hover': {
          backgroundColor: tokens.colors.fieldBg,
        },
      },
    },
    variants: [
      {
        props: { variant: 'dark' },
        style: {
          backgroundColor: tokens.colors.rail,
          color: '#FFFFFF',
          borderRadius: tokens.radii.pill,
          textTransform: 'none',
          height: 44,
          paddingLeft: 20,
          paddingRight: 20,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#2D2E30',
            boxShadow: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: tokens.colors.fieldBg,
            color: tokens.colors.textSecondary,
          },
        },
      },
    ],
  },
  MuiDialog: {
    defaultProps: {
      disableEscapeKeyDown: true,
    },
    styleOverrides: {
      // A `maxWidth="sm"` dialog floating in 32px of margin leaves a phone
      // roughly 290 usable pixels. Below `sm` every dialog — whatever maxWidth
      // it asked for — becomes a near-full-bleed sheet instead.
      paper: ({ theme }) => ({
        borderRadius: `${tokens.radii.card}px`,
        backgroundImage: 'none',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        [theme.breakpoints.down('sm')]: {
          borderRadius: `${tokens.radii.cardMobile}px`,
          margin: `${tokens.spacing.dialogInsetMobile}px`,
          width: `calc(100% - ${tokens.spacing.dialogInsetMobile * 2}px)`,
          maxWidth: `calc(100% - ${tokens.spacing.dialogInsetMobile * 2}px)`,
          maxHeight: `calc(100% - ${tokens.spacing.dialogInsetMobile * 2}px)`,
        },
      }),
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '24px 24px 12px 24px',
        [theme.breakpoints.down('sm')]: {
          padding: `${tokens.spacing.dialogPaddingMobile}px ${tokens.spacing.dialogPaddingMobile}px 8px ${tokens.spacing.dialogPaddingMobile}px`,
        },
      }),
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: '12px 24px 16px 24px',
        '&.MuiDialogContent-root': {
          paddingTop: '8px',
        },
        '&:not(:first-of-type)': {
          paddingTop: '8px',
        },
        '.MuiDialogTitle-root + &': {
          paddingTop: '8px',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        [theme.breakpoints.down('sm')]: {
          padding: `8px ${tokens.spacing.dialogPaddingMobile}px`,
          '&.MuiDialogContent-root': {
            paddingTop: '6px',
          },
          '&:not(:first-of-type)': {
            paddingTop: '6px',
          },
          '.MuiDialogTitle-root + &': {
            paddingTop: '6px',
          },
        },
      }),
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      // Dialogs pair a "Cancel" with a primary action. Side by side those are
      // narrow thumb targets on a phone, so below `sm` they split the full
      // width evenly instead of hugging the right edge.
      root: ({ theme }) => ({
        padding: '16px 24px 24px 24px',
        gap: '12px',
        [theme.breakpoints.down('sm')]: {
          padding: `12px ${tokens.spacing.dialogPaddingMobile}px ${tokens.spacing.dialogPaddingMobile}px ${tokens.spacing.dialogPaddingMobile}px`,
          flexWrap: 'wrap',
          '& > .MuiButton-root': {
            flex: '1 1 auto',
            minWidth: 0,
          },
        },
      }),
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: `${tokens.radii.inner}px`,
        backgroundColor: tokens.colors.surface,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        '& fieldset': {
          borderColor: tokens.colors.divider,
          borderRadius: `${tokens.radii.inner}px`,
        },
        '&:hover fieldset': {
          borderColor: tokens.colors.textSecondary,
        },
        '&.Mui-focused': {
          backgroundColor: tokens.colors.surface,
          '& fieldset': {
            borderColor: tokens.colors.accent,
            borderWidth: '2px',
          },
        },
        '&.Mui-error fieldset': {
          borderColor: tokens.colors.negative,
        },
        '&.Mui-disabled': {
          backgroundColor: tokens.colors.fieldBg,
          '& fieldset': {
            borderColor: tokens.colors.divider,
          },
        },
      },
      input: ({ theme }) => ({
        padding: '13px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: tokens.colors.textPrimary,
        height: 'auto',
        [theme.breakpoints.down('sm')]: {
          fontSize: tokens.typography.inputMobile.fontSize,
        },
      }),
      inputSizeSmall: ({ theme }) => ({
        padding: '8px 14px',
        fontSize: '13px',
        [theme.breakpoints.down('sm')]: {
          fontSize: tokens.typography.inputMobile.fontSize,
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      outlined: {
        color: tokens.colors.textSecondary,
        fontSize: '14px',
        fontWeight: 500,
        '&.MuiInputLabel-shrink': {
          backgroundColor: tokens.colors.surface,
          paddingLeft: '6px',
          paddingRight: '6px',
          borderRadius: '4px',
          fontWeight: 600,
          zIndex: 1,
        },
        '&.Mui-focused': {
          color: tokens.colors.accent,
        },
        '&.Mui-error': {
          color: tokens.colors.negative,
        },
      },
      filled: {
        color: tokens.colors.textSecondary,
        fontSize: '14px',
        fontWeight: 500,
        '&.MuiInputLabel-shrink': {
          fontWeight: 600,
        },
        '&.Mui-focused': {
          color: tokens.colors.accent,
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      // Scoped away from TablePagination: these are form-field metrics, and the
      // 16px right padding is narrower than the arrow, so letting them reach the
      // "rows per page" select drops the arrow on top of the value.
      select: ({ theme }) => ({
        '&:not(.MuiTablePagination-select)': {
          padding: '13px 16px',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          minHeight: 'auto',
          '&.MuiInputBase-inputSizeSmall': {
            padding: '8px 14px',
            fontSize: '13px',
          },
          [theme.breakpoints.down('sm')]: {
            fontSize: tokens.typography.inputMobile.fontSize,
            '&.MuiInputBase-inputSizeSmall': {
              fontSize: tokens.typography.inputMobile.fontSize,
            },
          },
        },
      }),
      icon: {
        color: tokens.colors.textSecondary,
        '&:not(.MuiTablePagination-selectIcon)': {
          right: 12,
        },
      },
    },
  },
  MuiFilledInput: {
    styleOverrides: {
      root: {
        backgroundColor: tokens.colors.fieldBg,
        borderRadius: tokens.radii.inner,
        '&:before, &:after': {
          display: 'none',
        },
      },
      input: {
        paddingTop: 24,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: tokens.radii.pill,
        border: 'none',
        backgroundColor: tokens.tints.sky,
        color: tokens.colors.textPrimary,
        fontWeight: 500,
        fontSize: tokens.typography.caption.fontSize,
      },
      sizeSmall: {
        height: 24,
        fontSize: tokens.typography.caption.fontSize,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        width: 40,
        height: 40,
        borderRadius: tokens.radii.pill,
        backgroundColor: tokens.colors.fieldBg,
        color: tokens.colors.textPrimary,
        '&:hover': {
          backgroundColor: tokens.colors.divider,
        },
      },
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiTableCell-root': {
          color: tokens.colors.textSecondary,
          fontSize: tokens.typography.caption.fontSize,
          fontWeight: 600,
          textTransform: 'none',
          borderBottom: `1px solid ${tokens.colors.divider}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          padding: '16px 20px',
          // Tablets still get a real table; tightening the gutters is what
          // keeps a five-column one from needing a horizontal scroll there.
          [theme.breakpoints.down('md')]: {
            padding: '12px 14px',
          },
        },
      }),
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiTableRow-root': {
          height: 64,
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: tokens.colors.tableHover,
          },
          [theme.breakpoints.down('md')]: {
            height: 56,
          },
        },
        '& .MuiTableCell-root': {
          borderBottom: `1px solid ${tokens.colors.divider}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          padding: '16px 20px',
          color: tokens.colors.textPrimary,
          fontSize: tokens.typography.body1.fontSize,
          [theme.breakpoints.down('md')]: {
            padding: '12px 14px',
          },
        },
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderLeft: 'none',
        borderRight: 'none',
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        color: tokens.colors.textSecondary,
        fontSize: tokens.typography.caption.fontSize,
        borderTop: `1px solid ${tokens.colors.divider}`,
        borderBottom: 'none',
      },
      select: {
        color: tokens.colors.textPrimary,
        fontWeight: 600,
        fontSize: tokens.typography.caption.fontSize,
      },
      selectIcon: {
        color: tokens.colors.textSecondary,
      },
      displayedRows: {
        color: tokens.colors.textSecondary,
        fontSize: tokens.typography.caption.fontSize,
        fontWeight: 500,
      },
      actions: {
        color: tokens.colors.textPrimary,
        '& .MuiIconButton-root': {
          width: 32,
          height: 32,
          color: tokens.colors.textPrimary,
          backgroundColor: tokens.colors.fieldBg,
          '&:hover': {
            backgroundColor: tokens.colors.divider,
          },
          '&.Mui-disabled': {
            backgroundColor: 'transparent',
            color: tokens.colors.textSecondary,
            opacity: 0.5,
          },
        },
      },
    },
  },
  // Speed up the shimmer wave animation — default is 1.6s which feels sluggish
  MuiSkeleton: {
    styleOverrides: {
      root: {
        '&.MuiSkeleton-wave::after': {
          animationDuration: '0.9s',
        },
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      arrow: true,
    },
    styleOverrides: {
      tooltip: {
        backgroundColor: '#1E293B',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: `${tokens.radii.inner}px`,
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
      },
      arrow: {
        color: '#1E293B',
      },
    },
  },
};
