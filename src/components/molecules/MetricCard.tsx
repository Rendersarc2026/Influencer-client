import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { CardTint } from '@theme';
import { TintCard, IconSquare, StatValue, DeltaBadge } from '@atoms';

export interface MetricCardProps {
  tint: CardTint;
  icon: ReactNode;
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  onKebabClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  tint,
  icon,
  title,
  value,
  delta,
  deltaLabel,
  subtitle,
  onKebabClick,
  onClick,
  className,
}) => {
  const theme = useTheme();

  return (
    <TintCard tint={tint} onKebabClick={onKebabClick} onClick={onClick} className={className}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: theme.palette.tokens.textPrimary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </Typography>
        <IconSquare
          icon={icon}
          size={36}
          bg="rgba(255, 255, 255, 0.7)"
          color={theme.palette.tokens.textPrimary}
        />
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-start' }}>
        <StatValue value={value} label="" />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        {delta !== undefined ? (
          <DeltaBadge delta={delta} label={deltaLabel} />
        ) : subtitle ? (
          <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </TintCard>
  );
};
