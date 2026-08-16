import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { CreateCampaignRequest, BrandResponse } from '@contracts';

export interface CreateCampaignDialogProps {
  open: boolean;
  brands: BrandResponse[];
  defaultBrandId?: string;
  loading?: boolean;
  onSubmit: (data: CreateCampaignRequest) => Promise<void> | void;
  onClose: () => void;
}

export const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({
  open,
  brands,
  defaultBrandId,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [brandId, setBrandId] = useState(defaultBrandId || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setBrandId(defaultBrandId || (brands.length > 0 ? brands[0].id : ''));
      setName('');
      setDescription('');
      setBriefUrl('');
      setStartDate('');
      setEndDate('');
      setError('');
    }
  }, [open, defaultBrandId, brands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      setError('Please select a brand');
      return;
    }
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    setError('');
    const payload: CreateCampaignRequest = {
      brandId,
      name: name.trim(),
      description: description.trim() || undefined,
      briefUrl: briefUrl.trim() || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
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
            title="Create New Campaign"
            subtitle="Setup campaign parameters under a brand — picking one you don't manage yet adds it to your account"
          />
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Brand *"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              fullWidth
              disabled={loading || Boolean(defaultBrandId)}
            >
              {brands.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Campaign Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Glow Skincare Launch"
              fullWidth
              disabled={loading}
            />

            <TextField
              label="Brief URL (Optional)"
              value={briefUrl}
              onChange={(e) => setBriefUrl(e.target.value)}
              placeholder="https://drive.google.com/brief.pdf"
              fullWidth
              disabled={loading}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={loading}
              />
            </Box>

            <TextField
              label="Description & Campaign Objectives"
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, channels, key messaging..."
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
            disabled={loading || !brandId || !name.trim()}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Campaign'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
