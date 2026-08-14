import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatValue, DeltaBadge, Pill } from '@atoms';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  timeframeOptions?: Array<string>;
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  data: Array<ChartDataPoint>;
  dataKey?: string;
  height?: number;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  value,
  delta,
  deltaLabel,
  timeframeOptions = ['7D', '30D', '90D', '1Y'],
  activeTimeframe = '30D',
  onTimeframeChange,
  data,
  dataKey = 'value',
  height = 240,
  className,
}) => {
  const theme = useTheme();
  const gradientId = `area-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card
      className={className}
      sx={{
        padding: `${theme.customSpacing.cardPadding}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header section with title and timeframe pills */}
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.tokens.textSecondary,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 0.5 }}>
            <StatValue value={value} label="" />
            {delta !== undefined && <DeltaBadge delta={delta} label={deltaLabel} />}
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

      {/* Chart container */}
      <Box sx={{ width: '100%', height, mt: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.tokens.rail,
                color: '#FFFFFF',
                borderRadius: `${theme.customRadii.inner}px`,
                border: 'none',
                boxShadow: 'none',
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
      </Box>
    </Card>
  );
};
