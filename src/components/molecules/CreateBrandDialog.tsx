import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { CreateBrandRequest, UpdateBrandRequest, BrandResponse } from '@contracts';

export interface CreateBrandDialogProps {
  open: boolean;
  brandToEdit?: BrandResponse | null;
  loading?: boolean;
  onSubmit: (
    data: CreateBrandRequest | UpdateBrandRequest,
    brandId?: string,
  ) => Promise<void> | void;
  onClose: () => void;
}

export const CreateBrandDialog: React.FC<CreateBrandDialogProps> = ({
  open,
  brandToEdit,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(brandToEdit?.name || '');
      setIndustry(brandToEdit?.industry || '');
      setError('');
    }
  }, [open, brandToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Brand name is required');
      return;
    }

    setError('');
    const payload = {
      name: name.trim(),
      industry: industry.trim() || undefined,
    };

    await onSubmit(payload, brandToEdit?.id);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '12px',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <SectionHeading
            title={brandToEdit ? 'Edit Brand' : 'Create New Brand'}
            subtitle="Manage agency client brand accounts"
          />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Brand Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GlowSkin Co."
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Industry / Category"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Beauty & Wellness"
              fullWidth
              disabled={loading}
            />

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : brandToEdit ? (
              'Save Changes'
            ) : (
              'Create Brand'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
