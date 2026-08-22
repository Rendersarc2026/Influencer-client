import React, { Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import type { ChartCardProps } from './ChartCard';

/**
 * Deferred loader for ChartCard.
 *
 * recharts is by far the heaviest dependency in the app (~210kB gzipped with its
 * d3 packages). ChartCard is the only thing that imports it, and only two screens
 * render one — but because those screens are separate lazy chunks that both use
 * ChartCard, the bundler hoisted it into the shared entry chunk and every role
 * downloaded the chart library on first paint whether or not they ever saw a
 * chart.
 *
 * Putting the import behind `lazy()` makes that impossible: recharts now lives in
 * a chunk that is only requested when a chart actually renders.
 */
const ChartCardImpl = lazy(() =>
  import('./ChartCard').then((m) => ({ default: m.ChartCard || m.default })),
);

const ChartCardLoading: React.FC<{ height: number }> = ({ height }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        padding: { xs: '16px', sm: '20px', md: `${theme.customSpacing.cardPadding}px` },
        borderRadius: `${theme.customRadii.card}px`,
        backgroundColor: theme.palette.tokens.surface,
        border: `1px solid ${theme.palette.tokens.divider}`,
        minHeight: height + 90,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress
        size={32}
        thickness={4}
        sx={{ color: theme.palette.tokens.accent }}
      />
    </Box>
  );
};

export const ChartCard: React.FC<ChartCardProps> = (props) => (
  <Suspense fallback={<ChartCardLoading height={props.height ?? 240} />}>
    <ChartCardImpl {...props} />
  </Suspense>
);

export default ChartCard;
