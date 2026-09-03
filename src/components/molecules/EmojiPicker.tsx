import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { EMOJI_GROUPS, STICKERS } from '@utils';

export interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  /** Insert an emoji into the draft, leaving the composer open. */
  onSelectEmoji: (emoji: string) => void;
  /** Send a sticker straight away — a sticker is the whole message. */
  onSelectSticker: (sticker: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  anchorEl,
  onClose,
  onSelectEmoji,
  onSelectSticker,
}) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  const isStickerTab = tab === EMOJI_GROUPS.length;
  const items = isStickerTab ? STICKERS : EMOJI_GROUPS[tab].emojis;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            width: 312,
            borderRadius: `${theme.customRadii.card}px`,
            border: `1px solid ${theme.palette.tokens.divider}`,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, next) => setTab(next)}
        variant="fullWidth"
        sx={{
          minHeight: 38,
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
          '& .MuiTab-root': {
            minHeight: 38,
            minWidth: 0,
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'none',
            px: 0.5,
          },
        }}
      >
        {EMOJI_GROUPS.map((group) => (
          <Tab key={group.label} label={group.label} />
        ))}
        <Tab label="Stickers" />
      </Tabs>

      {isStickerTab && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            px: 1.5,
            pt: 1.25,
            color: theme.palette.tokens.textSecondary,
            fontSize: '11px',
          }}
        >
          Sends immediately
        </Typography>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isStickerTab ? 'repeat(6, 1fr)' : 'repeat(10, 1fr)',
          gap: 0.25,
          p: 1.25,
          maxHeight: 210,
          overflowY: 'auto',
        }}
      >
        {items.map((item, index) => (
          <Tooltip key={`${item}-${index}`} title={isStickerTab ? 'Send' : ''} disableInteractive>
            <Box
              component="button"
              type="button"
              aria-label={isStickerTab ? `Send sticker ${item}` : `Insert emoji ${item}`}
              onClick={() => (isStickerTab ? onSelectSticker(item) : onSelectEmoji(item))}
              sx={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                p: 0,
                lineHeight: 1,
                borderRadius: `${theme.customRadii.inner}px`,
                fontSize: isStickerTab ? '30px' : '20px',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.12s ease',
                '&:hover': { backgroundColor: theme.palette.tokens.fieldBg },
              }}
            >
              {item}
            </Box>
          </Tooltip>
        ))}
      </Box>
    </Popover>
  );
};
