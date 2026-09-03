import React from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
  subtitle,
  actions,
}) => {
  const theme = useTheme();
  const safeSrc = safeImageUrl(imageUrl);

  if (!safeSrc) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(16, 17, 20, 0.7)',
            backdropFilter: 'blur(4px)',
          },
        },
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            backgroundImage: 'none',
            backgroundColor: theme.palette.tokens.surface,
            m: 2,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: { xs: '92vw', sm: '80vw', md: '720px' },
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: '16px',
              color: theme.palette.tokens.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title || 'Image Preview'}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.tokens.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close preview"
          sx={{
            color: theme.palette.tokens.textSecondary,
            backgroundColor: theme.palette.tokens.fieldBg,
            borderRadius: `${theme.customRadii.inner}px`,
            p: 0.75,
            flexShrink: 0,
            '&:hover': {
              backgroundColor: theme.palette.tokens.divider,
              color: theme.palette.tokens.textPrimary,
            },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1.5, sm: 2.5 },
          backgroundColor: theme.palette.tokens.fieldBg,
          minHeight: 220,
        }}
      >
        <Box
          component="img"
          src={safeSrc}
          alt={title || 'Preview image'}
          sx={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '70vh',
            width: 'auto',
            height: 'auto',
            borderRadius: `${theme.customRadii.inner}px`,
            objectFit: 'contain',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        />
      </Box>

      {actions && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
            backgroundColor: theme.palette.tokens.surface,
          }}
        >
          {actions}
        </Box>
      )}
    </Dialog>
  );
};
