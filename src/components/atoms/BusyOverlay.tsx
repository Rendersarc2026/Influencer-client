import React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';

export interface BusyOverlayProps {
  /**
   * When true the backlight fades in over the content it covers. Meant for
   * background refetches (search / filter / page / rowsPerPage changes) where
   * the previous data stays on screen instead of collapsing to a skeleton.
   */
  busy: boolean;
  /**
   * Rounds the backlight so it sits flush inside a card / field. Defaults to
   * the theme's inner radius; pass 0 for edge-to-edge regions.
   */
  radius?: number;
  className?: string;
}

/**
 * Backlit "working on it" layer. Renders two pieces that are positioned
 * against the nearest `position: relative` ancestor:
 *   - a frosted wash over the stale content, so it reads as inactive
 *   - an accent progress bar pinned to the top edge of that same ancestor
 *
 * It never blocks the pointer, so the surrounding controls stay usable while
 * the request is in flight.
 */
export const BusyOverlay: React.FC<BusyOverlayProps> = ({ busy, radius, className }) => {
  const theme = useTheme();
  const borderRadius = radius ?? theme.customRadii.inner;

  return (
    <Box
      className={className}
      aria-hidden={!busy}
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        opacity: busy ? 1 : 0,
        visibility: busy ? 'visible' : 'hidden',
        transition: 'opacity 0.15s ease, visibility 0.15s ease',
        borderRadius: `${borderRadius}px`,
        backgroundColor: alpha(theme.palette.tokens.surface, 0.55),
        backdropFilter: 'blur(1.5px)',
      }}
    >
      {/* Accent bar rides the top edge of the covered region */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          overflow: 'hidden',
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
        }}
      >
        {busy && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              height: 3,
              borderRadius: 0,
              backgroundColor: alpha(theme.palette.tokens.accent, 0.16),
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.tokens.accent,
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};
