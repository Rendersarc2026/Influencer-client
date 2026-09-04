import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
import { useTheme } from '@mui/material/styles';
import { SectionHeading } from '@atoms';
import { useInfiniteAgencyInfluencers, useInfiniteAgencyBrands } from '@api';
import { InfluencerResponse, BrandResponse, ChatResponse, ChatTypeCode } from '@contracts';
import { safeImageUrl } from '@utils';
import { InfiniteAutocomplete } from './InfiniteAutocomplete';

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
  existingChats?: ChatResponse[];
  onStartChat: (participantId: string) => Promise<void> | void;
  onClose: () => void;
}

export const StartChatDialog: React.FC<StartChatDialogProps> = ({
  open,
  loading = false,
  preselectedType = 'INFLUENCER',
  preselectedParticipantId,
  existingChats,
  onStartChat,
  onClose,
}) => {
  const theme = useTheme();
  const [recipientType, setRecipientType] = useState<'INFLUENCER' | 'BRAND'>(preselectedType);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerResponse | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandResponse | null>(null);
  const [error, setError] = useState('');

  // Infinite queries with debounced search & scroll loading (limit 20 per page)
  const [influencerSearch, setInfluencerSearch] = useState('');
  const {
    data: influencersInfiniteData,
    isLoading: influencersLoading,
    isFetchingNextPage: influencersFetchingNext,
    hasNextPage: influencersHasNextPage,
    fetchNextPage: influencersFetchNextPage,
  } = useInfiniteAgencyInfluencers({
    limit: 20,
    search: influencerSearch,
    enabled: open && recipientType === 'INFLUENCER',
  });

  const [brandSearch, setBrandSearch] = useState('');
  const {
    data: brandsInfiniteData,
    isLoading: brandsLoading,
    isFetchingNextPage: brandsFetchingNext,
    hasNextPage: brandsHasNextPage,
    fetchNextPage: brandsFetchNextPage,
  } = useInfiniteAgencyBrands({
    limit: 20,
    search: brandSearch,
    enabled: open && recipientType === 'BRAND',
  });

  const influencers: InfluencerResponse[] = React.useMemo(() => {
    const seen = new Set<string>();
    const list: InfluencerResponse[] = [];
    if (selectedInfluencer) {
      seen.add(selectedInfluencer.id);
      list.push(selectedInfluencer);
    }
    for (const page of influencersInfiniteData?.pages || []) {
      for (const item of page.items || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [influencersInfiniteData?.pages, selectedInfluencer]);

  const brands: BrandResponse[] = React.useMemo(() => {
    const seen = new Set<string>();
    const list: BrandResponse[] = [];
    if (selectedBrand) {
      seen.add(selectedBrand.id);
      list.push(selectedBrand);
    }
    for (const page of brandsInfiniteData?.pages || []) {
      for (const item of page.items || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [brandsInfiniteData?.pages, selectedBrand]);

  const isInfluencerChatActive = React.useCallback(
    (influencer: InfluencerResponse) => {
      if (!existingChats || existingChats.length === 0) return false;
      return existingChats.some(
        (c) =>
          c.type === ChatTypeCode.AGENCY_INFLUENCER &&
          (c.influencerId === influencer.id ||
            (influencer.name && c.influencerName?.toLowerCase() === influencer.name.toLowerCase())),
      );
    },
    [existingChats],
  );

  const isBrandChatActive = React.useCallback(
    (brand: BrandResponse) => {
      if (!existingChats || existingChats.length === 0) return false;
      return existingChats.some(
        (c) =>
          c.type === ChatTypeCode.AGENCY_BRAND &&
          (c.brandUserId === brand.id ||
            (brand.name && c.brandName?.toLowerCase() === brand.name.toLowerCase())),
      );
    },
    [existingChats],
  );

  const isSelectedChatActive = React.useMemo(() => {
    if (recipientType === 'INFLUENCER') {
      return selectedInfluencer ? isInfluencerChatActive(selectedInfluencer) : false;
    }
    return selectedBrand ? isBrandChatActive(selectedBrand) : false;
  }, [recipientType, selectedInfluencer, selectedBrand, isInfluencerChatActive, isBrandChatActive]);

  // Reset the picker only on the closed -> open transition. `influencers` and
  // `brands` change identity every time a selection is made (they prepend the
  // current selection for label resolution), so keeping them as deps here wiped
  // the user's choice the instant they clicked an option.
  const wasOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setRecipientType(preselectedType);
      setSelectedInfluencer(null);
      setSelectedBrand(null);
      setError('');
    } else if (!open) {
      wasOpenRef.current = false;
    }
  }, [open, preselectedType]);

  // Deep-linked entry ("Message <brand/creator>"): adopt the preselected
  // participant once it appears in the loaded options, but never override a
  // choice the user has since made.
  useEffect(() => {
    if (!open || !preselectedParticipantId) return;
    if (preselectedType === 'INFLUENCER') {
      if (selectedInfluencer) return;
      const match = influencers.find((i) => i.id === preselectedParticipantId);
      if (match) setSelectedInfluencer(match);
    } else {
      if (selectedBrand) return;
      const match = brands.find((b) => b.id === preselectedParticipantId);
      if (match) setSelectedBrand(match);
    }
  }, [
    open,
    preselectedParticipantId,
    preselectedType,
    influencers,
    brands,
    selectedInfluencer,
    selectedBrand,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const participantId =
      recipientType === 'INFLUENCER' ? selectedInfluencer?.id : selectedBrand?.id;

    if (!participantId) {
      setError(
        `Please select ${recipientType === 'INFLUENCER' ? 'an influencer' : 'a brand'} to start a chat.`,
      );
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
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.tokens.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
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
              <InfiniteAutocomplete<InfluencerResponse>
                options={influencers}
                value={selectedInfluencer}
                onChange={(_, val) => {
                  setSelectedInfluencer(val);
                  if (val) setError('');
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                loading={influencersLoading}
                hasNextPage={influencersHasNextPage}
                isFetchingNextPage={influencersFetchingNext}
                onLoadMore={() => void influencersFetchNextPage()}
                onSearchChange={(query) => setInfluencerSearch(query)}
                disabled={loading || Boolean(preselectedParticipantId)}
                label="Select Influencer *"
                placeholder="Search influencer by name..."
                error={Boolean(error && !selectedInfluencer)}
                helperText={error && !selectedInfluencer ? error : undefined}
                fullWidth
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                  >
                    <Avatar
                      src={safeImageUrl(option.avatarUrl)}
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
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        {isInfluencerChatActive(option) && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.tokens.accentText,
                              backgroundColor: theme.palette.tokens.accentBg,
                              borderRadius: `${theme.customRadii.pill}px`,
                              px: 1,
                              py: 0.25,
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            Active
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.textSecondary }}
                      >
                        {option.instagram
                          ? formatDisplaySocial(option.instagram)
                          : option.category || 'Influencer'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            ) : (
              <InfiniteAutocomplete<BrandResponse>
                options={brands}
                value={selectedBrand}
                onChange={(_, val) => {
                  setSelectedBrand(val);
                  if (val) setError('');
                }}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                loading={brandsLoading}
                hasNextPage={brandsHasNextPage}
                isFetchingNextPage={brandsFetchingNext}
                onLoadMore={() => void brandsFetchNextPage()}
                onSearchChange={(query) => setBrandSearch(query)}
                disabled={loading || Boolean(preselectedParticipantId)}
                label="Select Client Brand *"
                placeholder="Search brand by name..."
                error={Boolean(error && !selectedBrand)}
                helperText={error && !selectedBrand ? error : undefined}
                fullWidth
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}
                  >
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
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        {isBrandChatActive(option) && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.tokens.accentText,
                              backgroundColor: theme.palette.tokens.accentBg,
                              borderRadius: `${theme.customRadii.pill}px`,
                              px: 1,
                              py: 0.25,
                              fontSize: '11px',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            Active
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: theme.palette.tokens.textSecondary }}
                      >
                        {option.industry || option.contactPerson || 'Brand Account'}
                      </Typography>
                    </Box>
                  </Box>
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
            disabled={
              loading || (recipientType === 'INFLUENCER' ? !selectedInfluencer : !selectedBrand)
            }
            sx={{ minWidth: 140 }}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : isSelectedChatActive ? (
              'Open Conversation'
            ) : (
              'Start Chat'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
