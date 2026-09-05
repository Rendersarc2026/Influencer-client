import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useTheme } from '@mui/material/styles';
import { safeImageUrl, safeUrl } from '@utils';

export interface ImagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.25;

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
  const displaySrc =
    safeSrc || (typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : '');

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom & pan when opening or switching images
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [open, imageUrl]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation for quick zoom and close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleZoomIn, handleZoomOut, handleReset]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(MAX_ZOOM, Math.round((prev + 0.15) * 100) / 100));
    } else {
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.round((prev - 0.15) * 100) / 100);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag-to-pan when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom === 1) {
      setZoom(2);
    } else {
      handleReset();
    }
  };

  if (!open || !displaySrc) return null;

  const resolvedExternalUrl = safeUrl(displaySrc);
  const zoomPercentText = `${Math.round(zoom * 100)}%`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      sx={{ zIndex: 1500 }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(10, 11, 14, 0.88)',
            backdropFilter: 'blur(8px)',
          },
        },
        paper: {
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'none',
            overflow: 'hidden',
            m: 0,
            p: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          },
        },
      }}
    >
      {/* Floating Header Bar with Title & Close */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          pointerEvents: 'none',
        }}
      >
        {/* Title / Subtitle Info Pill */}
        {(title || subtitle) ? (
          <Box
            sx={{
              pointerEvents: 'auto',
              px: 2,
              py: 1,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: 'rgba(16, 17, 20, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              maxWidth: { xs: '65vw', sm: '50vw' },
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            }}
          >
            {title && (
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '13px',
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.75)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        ) : (
          <Box />
        )}

        {/* Action buttons (Open in new tab, custom actions, and Close) */}
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {actions}

          {resolvedExternalUrl && (
            <Tooltip title="Open original in new tab">
              <IconButton
                component="a"
                href={resolvedExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label="Open original in new tab"
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(16, 17, 20, 0.75)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  p: 0.9,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(16, 17, 20, 0.95)',
                    transform: 'scale(1.06)',
                  },
                }}
              >
                <OpenInNewRoundedIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Close (Esc)">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              size="small"
              aria-label="Close preview"
              sx={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(16, 17, 20, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                p: 0.9,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  transform: 'scale(1.06)',
                },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Viewport Container */}
      <Box
        onClick={onClose}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
        }}
      >
        <Box
          component="img"
          src={displaySrc}
          alt={title || 'Preview image'}
          draggable={false}
          onClick={handleImageClick}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
          }}
          sx={{
            display: 'block',
            maxWidth: { xs: '92vw', sm: '85vw', md: '80vw' },
            maxHeight: '80vh',
            width: 'auto',
            height: 'auto',
            borderRadius: `${theme.customRadii.inner}px`,
            objectFit: 'contain',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75)',
            backgroundColor: theme.palette.tokens.fieldBg,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
        />
      </Box>

      {/* Floating Bottom Zoom Controls Toolbar */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          bottom: { xs: 20, sm: 28 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          borderRadius: `${theme.customRadii.pill}px`,
          backgroundColor: 'rgba(16, 17, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          color: '#FFFFFF',
        }}
      >
        <Tooltip title="Zoom out (-)">
          <span>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
              sx={{
                color: '#FFFFFF',
                p: 0.6,
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
              }}
            >
              <ZoomOutRoundedIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Reset zoom (0)">
          <Box
            component="button"
            onClick={handleReset}
            sx={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontFamily: theme.typography.fontFamily,
              fontFeatureSettings: '"tnum"',
              fontWeight: 700,
              fontSize: '12px',
              minWidth: 46,
              textAlign: 'center',
              py: 0.5,
              px: 0.75,
              borderRadius: '4px',
              transition: 'all 0.12s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          >
            {zoomPercentText}
          </Box>
        </Tooltip>

        <Tooltip title="Zoom in (+)">
          <span>
            <IconButton
              size="small"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
              sx={{
                color: '#FFFFFF',
                p: 0.6,
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
              }}
            >
              <ZoomInRoundedIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Reset view">
          <span>
            <IconButton
              size="small"
              onClick={handleReset}
              disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              aria-label="Reset zoom and position"
              sx={{
                color: '#FFFFFF',
                p: 0.6,
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' },
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
              }}
            >
              <RestartAltRoundedIcon sx={{ fontSize: '19px' }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Dialog>
  );
};
