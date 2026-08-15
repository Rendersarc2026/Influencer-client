import React, { useState, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { ToastContext, ToastSeverity } from './toast-context-def';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('success');

  const showToast = (msg: string, sev: ToastSeverity = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const showSuccess = (msg: string) => showToast(msg, 'success');
  const showError = (msg: string) => showToast(msg, 'error');

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 9999,
        }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            borderRadius: `${theme.customRadii.inner}px`,
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
            backgroundColor:
              severity === 'success'
                ? theme.palette.tokens.positive
                : severity === 'error'
                  ? theme.palette.tokens.negative
                  : undefined,
            color: '#FFFFFF',
            alignItems: 'center',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
