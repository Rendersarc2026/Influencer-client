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
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: `${tokens.radii.inner}px`,
        backgroundColor: tokens.colors.fieldBg,
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
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
          backgroundColor: tokens.colors.divider,
        },
      },
      input: {
        padding: '14px 16px',
        fontSize: '14px',
        fontWeight: 500,
        color: tokens.colors.textPrimary,
        height: 'auto',
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      outlined: {
        color: tokens.colors.textSecondary,
        fontSize: '14px',
        fontWeight: 500,
        transform: 'translate(16px, 14px) scale(1)',
        '&.MuiInputLabel-shrink': {
          transform: 'translate(14px, -9px) scale(0.75)',
          backgroundColor: tokens.colors.surface,
          paddingLeft: '4px',
          paddingRight: '4px',
          borderRadius: '4px',
          fontWeight: 600,
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
        transform: 'translate(16px, 16px) scale(1)',
        fontSize: '14px',
        fontWeight: 500,
        '&.MuiInputLabel-shrink': {
          transform: 'translate(16px, 6px) scale(0.75)',
          fontWeight: 600,
        },
        '&.Mui-focused': {
          color: tokens.colors.accent,
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
};
