import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useTheme } from '@mui/material/styles';

export interface PromoCardProps {
  title: string;
  description: string;
  ctaText: string;
  onCtaClick?: () => void;
  badgeText?: string;
  illustration?: ReactNode;
  className?: string;
}

export const PromoCard: React.FC<PromoCardProps> = ({
  title,
  description,
  ctaText,
  onCtaClick,
  badgeText,
  illustration,
  className,
}) => {
  const theme = useTheme();

  return (
    <Card
      className={className}
      sx={{
        backgroundColor: theme.palette.tokens.rail,
        color: '#FFFFFF',
        borderRadius: `${theme.customRadii.card}px`,
        padding: `${theme.customSpacing.cardPadding}px`,
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {badgeText && (
          <Chip
            label={badgeText}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontWeight: 600,
              mb: 2,
            }}
          />
        )}

        <Typography variant="h2" sx={{ color: '#FFFFFF', mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.tokens.textSecondary,
            mb: 3,
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Button
          variant="contained"
          onClick={onCtaClick}
          endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
        >
          {ctaText}
        </Button>

        {illustration && <Box sx={{ display: 'flex', alignItems: 'center' }}>{illustration}</Box>}
      </Box>
    </Card>
  );
};
