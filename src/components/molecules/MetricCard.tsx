import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import { CardTint } from '@theme';
import { TintCard, IconSquare, StatValue, DeltaBadge } from '@atoms';

export interface MetricCardProps {
  tint: CardTint;
  icon: ReactNode;
  title: string;
  value?: string | number;
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  loading?: boolean;
  onKebabClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  tint,
  icon,
  title,
  value = '—',
  delta,
  deltaLabel,
  subtitle,
  loading = false,
  onKebabClick,
  onClick,
  className,
}) => {
  const theme = useTheme();

  return (
    <TintCard tint={tint} onKebabClick={onKebabClick} onClick={onClick} className={className}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: { xs: 1, sm: 1.5 },
          gap: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.tokens.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: { xs: '11px', sm: '11.5px', md: '12px' },
            lineHeight: 1.25,
            minHeight: { xs: 28, sm: 'auto' },
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>
        <IconSquare
          icon={icon}
          size={32}
          bg="rgba(255, 255, 255, 0.75)"
          color={theme.palette.tokens.textPrimary}
        />
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start', my: { xs: 0.25, sm: 0.5 } }}>
        {loading ? (
          <Skeleton
            animation="wave"
            variant="rounded"
            width={75}
            height={30}
            sx={{ borderRadius: `${theme.customRadii.inner / 2}px` }}
          />
        ) : (
          <StatValue value={value} label="" />
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 0.5,
          minHeight: 18,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Skeleton animation="wave" variant="text" width={85} height={15} />
        ) : delta !== undefined ? (
          <DeltaBadge delta={delta} label={deltaLabel} />
        ) : subtitle ? (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.tokens.textSecondary,
              fontSize: { xs: '10.5px', sm: '11.5px' },
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              maxWidth: '100%',
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </TintCard>
  );
};
