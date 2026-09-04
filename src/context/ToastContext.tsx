import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import { ToastContext, ToastSeverity } from './toast-context-def';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<ToastSeverity>('success');

  // Stable identities: consumers put these in effect deps (NotificationProvider
  // binds its socket listeners against them), so a new function each render
  // meant a full unsubscribe/resubscribe cycle on every toast.
  const showToast = useCallback((msg: string, sev: ToastSeverity = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);

  const contextValue = useMemo(
    () => ({ showToast, showSuccess, showError }),
    [showToast, showSuccess, showError],
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/*
        Centred, not corner-anchored. Pinned to the right it sat under the
        notification bell and the account menu — the two things a user is most
        likely to be looking away from at the moment an action completes — so
        confirmations were being missed. Centre-top is the one position that
        reads the same on every page and at every width.

        `right` is deliberately not set: MUI centres a top-centre Snackbar with
        `left: 50%` + `translateX(-50%)`, and a competing `right` offset would
        drag it back off centre.
      */}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: { xs: 16, sm: 24 },
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
            // Centred, the banner grows from the middle outwards, so a long
            // server error would otherwise stretch most of a desktop width.
            // Capped it wraps to a second line and stays a readable block.
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '100%', sm: 560 },
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
