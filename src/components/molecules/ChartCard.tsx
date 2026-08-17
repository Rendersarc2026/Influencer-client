import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded';
import { StatValue, DeltaBadge, Pill, LoadingBlock } from '@atoms';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  subtitle?: string;
  timeframeOptions?: Array<string>;
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  data: Array<ChartDataPoint>;
  dataKey?: string;
  height?: number;
  loading?: boolean;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  value,
  delta,
  deltaLabel,
  subtitle,
  timeframeOptions = ['7D', '30D', '90D', '1Y'],
  activeTimeframe = '30D',
  onTimeframeChange,
  data,
  dataKey = 'value',
  height = 240,
  loading = false,
  className,
}) => {
  const theme = useTheme();
  const gradientId = `area-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

  if (loading) {
    return <LoadingBlock variant="chart" height={height + 80} className={className} />;
  }

  const hasData = Array.isArray(data) && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <Card
      className={className}
      sx={{
        padding: { xs: '16px', sm: '20px', md: `${theme.customSpacing.cardPadding}px` },
        display: 'flex',
        flexDirection: 'column',
        minHeight: height + 90,
        backgroundColor: theme.palette.tokens.surface,
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px solid ${theme.palette.tokens.divider}`,
      }}
    >
      {/* Header section with title and timeframe pills */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          minHeight: 52,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.tokens.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 0.5 }}>
            <StatValue value={value} label="" />
            {delta !== undefined ? (
              <DeltaBadge delta={delta} label={deltaLabel} />
            ) : deltaLabel || subtitle ? (
              <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
                {subtitle || deltaLabel}
              </Typography>
            ) : null}
          </Box>
        </Box>

        {timeframeOptions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {timeframeOptions.map((tf) => (
              <Pill
                key={tf}
                label={tf}
                selected={activeTimeframe === tf}
                onClick={() => onTimeframeChange && onTimeframeChange(tf)}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Chart container or Empty State */}
      <Box
        sx={{
          width: '100%',
          height,
          minHeight: height,
          mt: 1,
          position: 'relative',
          flexGrow: 1,
        }}
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height={height} minHeight={height}>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.palette.tokens.accent} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={theme.palette.tokens.accent} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.palette.tokens.textSecondary, fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.palette.tokens.textSecondary, fontSize: 12 }}
                tickFormatter={(v) =>
                  v >= 1000
                    ? new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(v)
                    : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.tokens.rail,
                  color: '#FFFFFF',
                  borderRadius: `${theme.customRadii.inner}px`,
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
                itemStyle={{ color: '#FFFFFF' }}
                labelStyle={{
                  color: theme.palette.tokens.textSecondary,
                  fontSize: '11px',
                  marginBottom: '2px',
                }}
                formatter={(v: any) => [
                  typeof v === 'number' ? v.toLocaleString('en-IN') : v,
                  'Reach',
                ]}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={theme.palette.tokens.accent}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              minHeight: height,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: `${theme.customRadii.inner}px`,
              border: `1px dashed ${theme.palette.tokens.divider}`,
              backgroundColor: 'rgba(0, 0, 0, 0.015)',
              px: 3,
              py: 3,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: theme.palette.tokens.textSecondary,
                mb: 1.5,
              }}
            >
              <AutoGraphRoundedIcon fontSize="small" />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: theme.palette.tokens.textPrimary, mb: 0.5 }}
            >
              No reach data recorded yet
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.tokens.textSecondary, maxWidth: 380, lineHeight: 1.5 }}
            >
              Campaign reach and deliverable metrics will graph here automatically once deliverables
              are recorded by creators.
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default ChartCard;
