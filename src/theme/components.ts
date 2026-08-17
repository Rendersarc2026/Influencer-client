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
      paper: {
        borderRadius: `${tokens.radii.card}px`,
        backgroundImage: 'none',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        padding: '24px 24px 12px 24px',
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '16px 24px 16px 24px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px 24px 24px',
        gap: '12px',
      },
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
      input: {
        padding: '13px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: tokens.colors.textPrimary,
        height: 'auto',
      },
      inputSizeSmall: {
        padding: '8px 14px',
        fontSize: '13px',
      },
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
      select: {
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
        },
      },
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
      root: {
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
        },
      },
    },
  },
  MuiTableBody: {
    styleOverrides: {
      root: {
        '& .MuiTableRow-root': {
          height: 64,
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: tokens.colors.tableHover,
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
        },
      },
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
};
