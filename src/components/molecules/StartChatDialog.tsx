import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { useAgencyInfluencers, useAgencyBrands } from '@api';
import { InfluencerResponse, BrandResponse } from '@contracts';
import { safeImageUrl } from '@utils';

function formatDisplaySocial(urlOrHandle: string | null | undefined): string {
  if (!urlOrHandle) return '—';
  if (urlOrHandle.startsWith('http://') || urlOrHandle.startsWith('https://')) {
    try {
      const parsed = new URL(urlOrHandle);
      const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (path) {
        return `@${path.replace(/^@/, '')}`;
      }
      return parsed.hostname;
    } catch {
      return urlOrHandle;
    }
  }
  return urlOrHandle.startsWith('@') ? urlOrHandle : `@${urlOrHandle}`;
}

export interface StartChatDialogProps {
  open: boolean;
  loading?: boolean;
  preselectedType?: 'INFLUENCER' | 'BRAND';
  preselectedParticipantId?: string;
  onStartChat: (participantId: string) => Promise<void> | void;
  onClose: () => void;
}

export const StartChatDialog: React.FC<StartChatDialogProps> = ({
  open,
  loading = false,
  preselectedType = 'INFLUENCER',
  preselectedParticipantId,
  onStartChat,
  onClose,
}) => {
  const theme = useTheme();
  const [recipientType, setRecipientType] = useState<'INFLUENCER' | 'BRAND'>(preselectedType);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [error, setError] = useState('');

  const { data: influencersData, isLoading: influencersLoading } = useAgencyInfluencers({ limit: 100 });
  const { data: brandsData, isLoading: brandsLoading } = useAgencyBrands({ limit: 100 });

  const influencers: InfluencerResponse[] = React.useMemo(
    () => influencersData?.items || [],
    [influencersData],
  );
  const brands: BrandResponse[] = React.useMemo(
    () => brandsData?.items || [],
    [brandsData],
  );

  useEffect(() => {
    if (open) {
      setRecipientType(preselectedType);
      setError('');

      if (preselectedParticipantId) {
        if (preselectedType === 'INFLUENCER') {
          const match = influencers.find((i: InfluencerResponse) => i.id === preselectedParticipantId);
          setSelectedInfluencer(match || null);
          setSelectedBrand(null);
        } else {
          const match = brands.find((b: BrandResponse) => b.id === preselectedParticipantId);
          setSelectedBrand(match || null);
          setSelectedInfluencer(null);
        }
      } else {
        setSelectedInfluencer(null);
        setSelectedBrand(null);
      }
    }
  }, [open, preselectedType, preselectedParticipantId, influencers, brands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const participantId =
      recipientType === 'INFLUENCER' ? selectedInfluencer?.id : selectedBrand?.id;

    if (!participantId) {
      setError(`Please select ${recipientType === 'INFLUENCER' ? 'an influencer' : 'a brand'} to start a chat.`);
      return;
    }

    setError('');
    await onStartChat(participantId);
  };

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
            padding: '16px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 0, pt: 1, px: 1 }}>
          <SectionHeading
            title="Start New Conversation"
            subtitle="Connect directly with an assigned influencer or client brand"
            mb={0}
          />
        </DialogTitle>

        <DialogContent
          sx={{
            px: 1,
            pt: 0.5,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* 1. Recipient Type Segmented Toggle */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.tokens.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chat With
              </Typography>
              <ToggleButtonGroup
                value={recipientType}
                exclusive
                onChange={(_, val) => {
                  if (val) {
                    setRecipientType(val);
                    setError('');
                  }
                }}
                fullWidth
                size="small"
                disabled={loading || Boolean(preselectedParticipantId)}
                sx={{
                  backgroundColor: theme.palette.tokens.fieldBg,
                  borderRadius: `${theme.customRadii.inner}px`,
                  p: 0.5,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: `${theme.customRadii.inner - 2}px !important`,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    gap: 1,
                    color: theme.palette.tokens.textSecondary,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.tokens.surface,
                      color: theme.palette.tokens.textPrimary,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    },
                  },
                }}
              >
                <ToggleButton value="INFLUENCER">
                  <RecordVoiceOverRoundedIcon fontSize="small" />
                  Influencer
                </ToggleButton>
                <ToggleButton value="BRAND">
                  <StorefrontRoundedIcon fontSize="small" />
                  Client Brand
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* 2. Participant Autocomplete Picker */}
            {recipientType === 'INFLUENCER' ? (
              <Autocomplete
                options={influencers}
                value={selectedInfluencer}
                onChange={(_, val) => {
                  setSelectedInfluencer(val);
                  if (val) setError('');
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                loading={influencersLoading}
                disabled={loading || Boolean(preselectedParticipantId)}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: theme.palette.tokens.accentBg,
                        color: theme.palette.tokens.accentText,
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {option.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                        {option.instagram
                          ? formatDisplaySocial(option.instagram)
                          : option.category || 'Influencer'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Influencer *"
                    placeholder="Search influencer by name..."
                    error={Boolean(error && !selectedInfluencer)}
                    helperText={error && !selectedInfluencer ? error : undefined}
                    fullWidth
                  />
                )}
              />
            ) : (
              <Autocomplete
                options={brands}
                value={selectedBrand}
                onChange={(_, val) => {
                  setSelectedBrand(val);
                  if (val) setError('');
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                loading={brandsLoading}
                disabled={loading || Boolean(preselectedParticipantId)}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Avatar
                      src={safeImageUrl(option.logoUrl)}
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: theme.palette.tokens.fieldBg,
                        color: theme.palette.tokens.textPrimary,
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      {option.name[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                        {option.industry || option.contactPerson || 'Brand Account'}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Client Brand *"
                    placeholder="Search brand by name..."
                    error={Boolean(error && !selectedBrand)}
                    helperText={error && !selectedBrand ? error : undefined}
                    fullWidth
                  />
                )}
              />
            )}

            {error && (
              <Typography variant="body2" sx={{ color: theme.palette.tokens.negative }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1, px: 1, pt: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || (recipientType === 'INFLUENCER' ? !selectedInfluencer : !selectedBrand)}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Start Chat'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
