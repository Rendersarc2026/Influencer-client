import React, { useState, useEffect, useMemo } from 'react';
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
import { capitalizeWords } from '@utils';

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
    if (!startDate) {
      setError('Start date is required');
      return;
    }
    if (!endDate) {
      setError('End date is required');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be on or after start date');
      return;
    }

    setError('');
    const payload: CreateCampaignRequest = {
      brandId,
      name: name.trim(),
      description: description.trim() || undefined,
      briefUrl: briefUrl.trim() || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    await onSubmit(payload);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '12px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 0, pt: 1, px: 2 }}>
          <SectionHeading
            title="Create New Campaign"
            subtitle="Setup campaign parameters under one of your client brands"
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              select
              label="Select Brand *"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              fullWidth
              disabled={loading || Boolean(defaultBrandId) || brands.length === 0}
              // The picker now lists only this agency's own brands, so an
              // agency with none yet would otherwise face an empty dropdown
              // with nothing explaining why.
              helperText={
                brands.length === 0
                  ? 'No client brands yet — add one from the Brands page first'
                  : undefined
              }
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
              onChange={(e) => setName(capitalizeWords(e.target.value))}
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (endDate && val && endDate < val) {
                    setEndDate('');
                  }
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: todayStr },
                }}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: startDate || todayStr },
                }}
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
            disabled={loading || !brandId || !name.trim() || !startDate || !endDate}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create Campaign'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
