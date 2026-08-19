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
import {
  CampaignResponse,
  UpdateCampaignRequest,
  CampaignStatus,
  CampaignStatusCode,
} from '@contracts';
import { capitalizeWords } from '@utils';

export interface EditCampaignDialogProps {
  open: boolean;
  campaign: CampaignResponse | null;
  loading?: boolean;
  onSubmit: (data: UpdateCampaignRequest) => Promise<void> | void;
  onClose: () => void;
}

function toDateInputValue(date?: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export const EditCampaignDialog: React.FC<EditCampaignDialogProps> = ({
  open,
  campaign,
  loading = false,
  onSubmit,
  onClose,
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CampaignStatus>(CampaignStatusCode.DRAFT);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      setBriefUrl(campaign.briefUrl || '');
      setStartDate(toDateInputValue(campaign.startDate));
      setEndDate(toDateInputValue(campaign.endDate));
      setStatus(campaign.status ?? CampaignStatusCode.DRAFT);
      setError('');
    }
  }, [open, campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    const payload: UpdateCampaignRequest = {
      name: name.trim(),
      description: description.trim() || null,
      briefUrl: briefUrl.trim() || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
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

  const minStartDate = useMemo(() => {
    const origStart = campaign?.startDate ? toDateInputValue(campaign.startDate) : '';
    if (origStart && origStart < todayStr) {
      return origStart;
    }
    return todayStr;
  }, [campaign?.startDate, todayStr]);

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
            title="Edit Campaign Details"
            subtitle="Update campaign parameters, timeline, briefs, and deliverables"
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
              label="Campaign Name *"
              value={name}
              onChange={(e) => setName(capitalizeWords(e.target.value))}
              placeholder="e.g. Summer Glow Skincare Launch"
              fullWidth
              disabled={loading}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                label="Campaign Status"
                value={status}
                onChange={(e) => setStatus(Number(e.target.value) as CampaignStatus)}
                fullWidth
                disabled={loading}
              >
                <MenuItem value={CampaignStatusCode.DRAFT}>Draft</MenuItem>
                <MenuItem value={CampaignStatusCode.ACTIVE}>Active</MenuItem>
                <MenuItem value={CampaignStatusCode.COMPLETED}>Completed</MenuItem>
                <MenuItem value={CampaignStatusCode.CANCELLED}>Cancelled</MenuItem>
              </TextField>

              <TextField
                label="Brief URL (Optional)"
                value={briefUrl}
                onChange={(e) => setBriefUrl(e.target.value)}
                placeholder="https://drive.google.com/brief.pdf"
                fullWidth
                disabled={loading}
              />
            </Box>

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
                  htmlInput: { min: minStartDate },
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
            disabled={loading || !name.trim() || !startDate || !endDate}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
