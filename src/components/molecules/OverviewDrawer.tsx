import React, { ReactNode, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { useTheme } from '@mui/material/styles';
import { StatusChip, StatusCategory, MoneyText } from '@atoms';
import { useToast } from '@hooks';
import { safeImageUrl, safeExternalUrl } from '@utils';
import { ImagePreviewDialog } from './ImagePreviewDialog';

export interface OverviewField {
  label: string;
  value: ReactNode;
  copyable?: boolean;
  /**
   * Render `value` as a status chip. `value` must be the status code and
   * `statusCategory` names the category it belongs to — a code alone is
   * ambiguous, since RATE_STATUS 1 and CAMPAIGN_STATUS 1 are different states.
   */
  isStatus?: boolean;
  statusCategory?: StatusCategory;
  isMoney?: boolean;
  amount?: number | string | null;
  currency?: string;
  isLink?: boolean;
  href?: string;
  fullWidth?: boolean;
  color?: string;
  helpText?: string;
}

export interface OverviewSection {
  title?: string;
  icon?: ReactNode;
  fields: OverviewField[];
}

export interface OverviewHighlight {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tint?: 'lavender' | 'mint' | 'butter' | 'sky';
  sublabel?: string;
}

export interface OverviewAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  disabled?: boolean;
  /** Swaps the icon for a spinner and blocks re-entry while the work is in flight. */
  loading?: boolean;
}

export interface OverviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** A node is rendered as-is; a code renders as a chip and needs `badgeCategory`. */
  badge?: ReactNode | number;
  badgeCategory?: StatusCategory;
  avatarText?: string;
  avatarUrl?: string;
  avatarIcon?: ReactNode;
  highlights?: OverviewHighlight[];
  sections: OverviewSection[];
  actions?: OverviewAction[];
  className?: string;
  children?: ReactNode;
}

export const OverviewDrawer: React.FC<OverviewDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  badgeCategory,
  badge,
  avatarText,
  avatarUrl,
  avatarIcon,
  highlights = [],
  sections = [],
  actions = [],
  className,
  children,
}) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const resolvedAvatarUrl = safeImageUrl(avatarUrl);
  const hasAvatarImage = Boolean(resolvedAvatarUrl);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const tintMap: Record<string, string> = {
    lavender: theme.palette.tokens.purpleBg,
    mint: theme.palette.tokens.positiveBg,
    butter: theme.palette.tokens.warningBg,
    sky: theme.palette.tokens.accentBg,
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      className={className}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(16, 17, 20, 0.35)',
            backdropFilter: 'blur(3px)',
          },
        },
      }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 620, lg: 680 },
          maxWidth: '100vw',
          backgroundColor: theme.palette.tokens.surface,
          boxShadow: '-10px 0 40px rgba(16, 17, 20, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: `1px solid ${theme.palette.tokens.divider}`,
        },
      }}
    >
      {/* 1. Header (Sticky) */}
      <Box
        sx={{
          padding: { xs: '16px 16px 14px 16px', sm: '24px 24px 18px 24px' },
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          backgroundColor: theme.palette.tokens.surface,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
          {(avatarText || avatarUrl || avatarIcon) && (
            <Tooltip
              title={hasAvatarImage ? 'Click to view image' : ''}
              arrow
              disableHoverListener={!hasAvatarImage}
            >
              <Avatar
                src={resolvedAvatarUrl}
                onClick={() => {
                  if (hasAvatarImage) {
                    setImagePreviewOpen(true);
                  }
                }}
                role={hasAvatarImage ? 'button' : undefined}
                tabIndex={hasAvatarImage ? 0 : undefined}
                aria-label={hasAvatarImage ? `View ${title} profile picture` : undefined}
                onKeyDown={(e) => {
                  if (hasAvatarImage && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setImagePreviewOpen(true);
                  }
                }}
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: theme.palette.tokens.accentBg,
                  color: theme.palette.tokens.accentText,
                  fontWeight: 700,
                  fontSize: '18px',
                  flexShrink: 0,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  cursor: hasAvatarImage ? 'pointer' : 'default',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(hasAvatarImage
                    ? {
                        '&:hover': {
                          transform: 'scale(1.06)',
                          borderColor: theme.palette.tokens.accent,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        },
                      }
                    : {}),
                }}
              >
                {avatarIcon ||
                  (avatarText ? avatarText.charAt(0).toUpperCase() : title.charAt(0).toUpperCase())}
              </Avatar>
            </Tooltip>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: '19px',
                  fontWeight: 700,
                  color: theme.palette.tokens.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Typography>
              {badge !== undefined &&
                badge !== null &&
                (typeof badge === 'number' && badgeCategory ? (
                  <StatusChip category={badgeCategory} code={badge} />
                ) : (
                  badge
                ))}
            </Box>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.tokens.textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.tokens.textSecondary,
            backgroundColor: theme.palette.tokens.fieldBg,
            borderRadius: `${theme.customRadii.inner}px`,
            p: 1,
            '&:hover': {
              backgroundColor: theme.palette.tokens.divider,
              color: theme.palette.tokens.textPrimary,
            },
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 2. Scrollable Body Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: { xs: '16px', sm: '24px' },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2.5, sm: 3 },
          // Sleek custom scrollbar
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.tokens.divider,
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.tokens.textSecondary,
          },
        }}
      >
        {/* Highlights Stat Cards (if any) */}
        {highlights.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                highlights.length === 1
                  ? '1fr'
                  : highlights.length === 3
                    ? { xs: '1fr', sm: 'repeat(3, 1fr)' }
                    : 'repeat(2, 1fr)',
              gap: 1.5,
              alignItems: 'stretch',
            }}
          >
            {highlights.map((h, idx) => (
              <Box
                key={idx}
                sx={{
                  padding: '14px 16px',
                  borderRadius: `${theme.customRadii.inner}px`,
                  backgroundColor: h.tint
                    ? tintMap[h.tint] || theme.palette.tokens.fieldBg
                    : theme.palette.tokens.fieldBg,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '88px',
                  boxSizing: 'border-box',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.tokens.textSecondary,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      fontSize: '12px',
                    }}
                    noWrap
                  >
                    {h.label}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: theme.palette.tokens.textPrimary,
                      lineHeight: 1.3,
                    }}
                    noWrap
                  >
                    {h.value}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.tokens.textSecondary,
                    fontSize: '11px',
                    lineHeight: 1.2,
                    mt: 0.5,
                    minHeight: '14px',
                    visibility: h.sublabel ? 'visible' : 'hidden',
                  }}
                >
                  {h.sublabel || '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Custom Children */}
        {children}

        {/* Structured Sections */}
        {sections.map((section, sIdx) => (
          <Box key={sIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {section.title && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {section.icon && (
                  <Box sx={{ color: theme.palette.tokens.accentText, display: 'flex', alignItems: 'center' }}>
                    {section.icon}
                  </Box>
                )}
                <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>
                  {section.title}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                borderRadius: `${theme.customRadii.inner}px`,
                border: `1px solid ${theme.palette.tokens.divider}`,
                backgroundColor: theme.palette.tokens.surface,
                overflow: 'hidden',
              }}
            >
              {section.fields.map((field, fIdx) => (
                <React.Fragment key={fIdx}>
                  {fIdx > 0 && <Divider sx={{ borderColor: theme.palette.tokens.divider }} />}
                  <Box
                    sx={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: field.fullWidth ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      flexDirection: field.fullWidth ? 'column' : 'row',
                      gap: 1.5,
                      '&:hover': {
                        backgroundColor: theme.palette.tokens.tableHover,
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.tokens.textSecondary,
                        fontWeight: 600,
                        flexShrink: 0,
                        minWidth: '120px',
                      }}
                    >
                      {field.label}
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                        textAlign: field.fullWidth ? 'left' : 'right',
                        width: field.fullWidth ? '100%' : 'auto',
                      }}
                    >
                      {field.isStatus && field.statusCategory && typeof field.value === 'number' ? (
                        <StatusChip category={field.statusCategory} code={field.value} />
                      ) : field.isMoney ? (
                        <MoneyText
                          amount={field.amount !== undefined ? field.amount : (typeof field.value === 'number' || typeof field.value === 'string' ? field.value : null)}
                          currency={field.currency || 'INR'}
                          variant="body2"
                          color={field.color}
                        />
                      ) : field.isLink && safeExternalUrl(field.href) ? (
                        <Button
                          variant="text"
                          size="small"
                          component="a"
                          href={safeExternalUrl(field.href)}
                          target="_blank"
                          rel="noopener noreferrer"
                          endIcon={<LaunchRoundedIcon fontSize="inherit" />}
                          sx={{
                            fontSize: '13px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            height: 'auto',
                            color: theme.palette.tokens.accent,
                          }}
                        >
                          {field.value || 'Visit Link'}
                        </Button>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: field.color || theme.palette.tokens.textPrimary,
                            wordBreak: 'break-word',
                          }}
                        >
                          {field.value !== null && field.value !== undefined && field.value !== '' ? field.value : '—'}
                        </Typography>
                      )}

                      {field.copyable && field.value && (
                        <Tooltip title={`Copy ${field.label}`}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(String(field.value), field.label)}
                            sx={{
                              p: 0.5,
                              color: theme.palette.tokens.textSecondary,
                              '&:hover': { color: theme.palette.tokens.textPrimary },
                            }}
                          >
                            <ContentCopyRoundedIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* 3. Footer Action Bar (Sticky Bottom) */}
      {actions.length > 0 && (
        <Box
          sx={{
            padding: { xs: '12px 16px', sm: '16px 24px' },
            borderTop: `1px solid ${theme.palette.tokens.divider}`,
            backgroundColor: theme.palette.tokens.surface,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
          }}
        >
          {actions.map((act, aIdx) => (
            <Button
              key={aIdx}
              variant={act.variant || (aIdx === 0 ? 'contained' : 'outlined')}
              color={act.color || 'primary'}
              startIcon={
                act.loading ? <CircularProgress size={16} color="inherit" /> : act.icon
              }
              disabled={act.disabled || act.loading}
              onClick={act.onClick}
              sx={{
                flex: {
                  xs: '1 1 100%',
                  sm: actions.length <= 2 ? '1 1 0' : '1 1 calc(50% - 6px)',
                },
                minWidth: 0,
                whiteSpace: 'nowrap',
                fontSize: '13.5px',
                fontWeight: 600,
                height: 42,
                px: 2,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {act.label}
            </Button>
          ))}
        </Box>
      )}

      {/* Profile / Entity Image Preview Dialog */}
      <ImagePreviewDialog
        open={imagePreviewOpen && hasAvatarImage}
        onClose={() => setImagePreviewOpen(false)}
        imageUrl={resolvedAvatarUrl}
        title={title}
        subtitle={subtitle}
      />
    </Drawer>
  );
};
