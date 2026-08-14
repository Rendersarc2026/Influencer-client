import React, { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'neutral';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'neutral',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '8px',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h2" sx={{ fontSize: '20px' }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 1 }}>
        {typeof body === 'string' ? (
          <Typography variant="body1" sx={{ color: theme.palette.tokens.textSecondary }}>
            {body}
          </Typography>
        ) : (
          body
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 2, pb: 1, px: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'contained' : 'dark'}
          onClick={onConfirm}
          disabled={loading}
          sx={
            variant === 'destructive'
              ? {
                  backgroundColor: theme.palette.tokens.negative,
                  '&:hover': { backgroundColor: '#B91C1C' },
                }
              : undefined
          }
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
