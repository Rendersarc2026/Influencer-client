import React, { Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
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

const ChartCardSkeleton: React.FC<{ height: number }> = ({ height }) => {
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
        flexDirection: 'column',
      }}
    >
      <Skeleton animation="wave" variant="text" width={200} height={28} />
      <Skeleton animation="wave" variant="text" width={140} height={40} />
      <Skeleton
        animation="wave"
        variant="rounded"
        height={height}
        sx={{ mt: 2, borderRadius: `${theme.customRadii.inner}px`, flexGrow: 1 }}
      />
    </Box>
  );
};

export const ChartCard: React.FC<ChartCardProps> = (props) => (
  <Suspense fallback={<ChartCardSkeleton height={props.height ?? 240} />}>
    <ChartCardImpl {...props} />
  </Suspense>
);

export default ChartCard;
