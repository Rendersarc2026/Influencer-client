import React from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTheme } from '@mui/material/styles';
import { safeImageUrl } from '@utils';

export interface ImagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  open,
  onClose,
  imageUrl,
  title,
}) => {
  const theme = useTheme();
  const safeSrc = safeImageUrl(imageUrl);
  const displaySrc =
    safeSrc || (typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : '');

  if (!open || !displaySrc) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(16, 17, 20, 0.85)',
            backdropFilter: 'blur(6px)',
          },
        },
        paper: {
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'none',
            overflow: 'visible',
            m: { xs: 1, sm: 2 },
            p: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            maxWidth: '92vw',
            maxHeight: '90vh',
          },
        },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Floating Close (X) Button */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          size="small"
          aria-label="Close preview"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 20,
            color: '#FFFFFF',
            backgroundColor: 'rgba(16, 17, 20, 0.65)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            p: 0.85,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(16, 17, 20, 0.95)',
              transform: 'scale(1.08)',
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: '20px' }} />
        </IconButton>

        {/* Floating Image */}
        <Box
          component="img"
          src={displaySrc}
          alt={title || 'Preview image'}
          sx={{
            display: 'block',
            maxWidth: { xs: '92vw', sm: '85vw', md: '80vw' },
            maxHeight: '85vh',
            width: 'auto',
            height: 'auto',
            borderRadius: `${theme.customRadii.card}px`,
            objectFit: 'contain',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.65)',
            backgroundColor: theme.palette.tokens.fieldBg,
          }}
        />
      </Box>
    </Dialog>
  );
};
