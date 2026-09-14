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
import { capitalizeWords, validateCampaignName } from '@utils';

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
  const [nameError, setNameError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      setBriefUrl(campaign.briefUrl || '');
      setStartDate(toDateInputValue(campaign.startDate));
      setEndDate(toDateInputValue(campaign.endDate));
      setStatus(campaign.status ?? CampaignStatusCode.DRAFT);
      setNameError('');
      setStartDateError('');
      setEndDateError('');
      setError('');
    }
  }, [open, campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // One validation pass over every field, so a submit marks all of the
    // offending fields red at once instead of one per failed click.
    const nErr = validateCampaignName(name, {
      required: true,
      fieldLabel: 'Campaign name',
      max: 200,
    });
    const sErr = startDate ? '' : 'Start date is required';
    const eErr = !endDate
      ? 'End date is required'
      : startDate && new Date(endDate) < new Date(startDate)
        ? 'End date must be on or after start date'
        : '';

    setNameError(nErr);
    setStartDateError(sErr);
    setEndDateError(eErr);
    setError('');

    if (nErr || sErr || eErr) return;

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
              onChange={(e) => {
                const val = capitalizeWords(e.target.value);
                setName(val);
                if (nameError) {
                  setNameError(
                    validateCampaignName(val, {
                      required: true,
                      fieldLabel: 'Campaign name',
                      max: 200,
                    }),
                  );
                }
              }}
              onBlur={(e) => {
                // Leaving a still-empty box is not an error yet — the dialog's
                // focus trap blurs this field on open, and the confirm button is
                // what reports a missing value. Only a filled-in value is checked.
                if (!e.target.value.trim()) {
                  setNameError('');
                  return;
                }
                setNameError(
                  validateCampaignName(e.target.value, {
                    required: true,
                    fieldLabel: 'Campaign name',
                    max: 200,
                  }),
                );
              }}
              placeholder="e.g. Summer Glow Skincare Launch"
              fullWidth
              disabled={loading}
              error={Boolean(nameError)}
              helperText={nameError || undefined}
            />

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
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

            <Box
              sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
            >
              <TextField
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  if (startDateError) setStartDateError('');
                  // Clearing the end date silently left the form unsubmittable
                  // with no explanation; say what happened.
                  if (endDate && val && endDate < val) {
                    setEndDate('');
                    setError('End date was cleared because it fell before the new start date.');
                  }
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: minStartDate },
                }}
                error={Boolean(startDateError)}
                helperText={startDateError || undefined}
                fullWidth
                disabled={loading}
              />
              <TextField
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (error) setError('');
                  if (endDateError) setEndDateError('');
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { min: startDate || todayStr },
                }}
                error={Boolean(endDateError)}
                helperText={endDateError || undefined}
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
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 140 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
