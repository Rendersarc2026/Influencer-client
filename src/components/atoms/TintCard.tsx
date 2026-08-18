import React, { ReactNode } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import { useTheme } from '@mui/material/styles';
import { CardTint } from '@theme';

export interface TintCardProps {
  tint?: CardTint;
  title?: ReactNode;
  subtitle?: ReactNode;
  headerSlot?: ReactNode;
  onKebabClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TintCard: React.FC<TintCardProps> = ({
  tint,
  title,
  subtitle,
  headerSlot,
  onKebabClick,
  children,
  className,
  onClick,
}) => {
  const theme = useTheme();
  const hasHeader = Boolean(title || subtitle || headerSlot || onKebabClick);

  return (
    <Card
      tint={tint}
      className={className}
      onClick={onClick}
      sx={{
        padding: { xs: '14px 12px', sm: '18px 16px', md: `${theme.customSpacing.cardPadding}px` },
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {hasHeader && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box sx={{ flexGrow: 1, pr: onKebabClick || headerSlot ? 1 : 0 }}>
            {typeof title === 'string' ? (
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            ) : (
              title
            )}
            {typeof subtitle === 'string' ? (
              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, mt: '2px', display: 'block' }}
              >
                {subtitle}
              </Typography>
            ) : (
              subtitle
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {headerSlot}
            {onKebabClick && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onKebabClick(e);
                }}
                sx={{
                  backgroundColor: tint ? 'rgba(255, 255, 255, 0.7)' : theme.palette.tokens.fieldBg,
                }}
              >
                <MoreHorizRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      )}
      {children}
    </Card>
  );
};
