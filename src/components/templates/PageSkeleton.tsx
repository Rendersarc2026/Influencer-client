import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useTheme } from '@mui/material/styles';

/**
 * Which page shape the shimmer should imitate. A skeleton is only useful if it
 * predicts the layout that replaces it — showing the dashboard's metric cards
 * in front of a plain list page makes the content jump when it lands.
 */
export type PageSkeletonVariant =
  | 'dashboard' // metric cards + table (role home screens)
  | 'list' // filter bar + full-height table (brands, users, campaigns…)
  | 'detail' // summary card + mapped-rows table (campaign detail)
  | 'reports' // metrics + charts + table
  | 'chat' // conversation list beside a message thread
  | 'form' // profile / onboarding field grid
  | 'grid' // search + card grid (add influencer)
  | 'auth' // centred card, no dashboard chrome (login, terms)
  | 'shell'; // chrome only — used before the target page is known

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
}

// ─── shared shimmer primitives ────────────────────────────────────────────

const Line: React.FC<{ width: number | string; height?: number }> = ({ width, height = 20 }) => (
  <Skeleton animation="wave" variant="text" width={width} height={height} />
);

const Block: React.FC<{
  width: number | string;
  height: number | string;
  radius?: number;
}> = ({ width, height, radius }) => {
  const theme = useTheme();
  return (
    <Skeleton
      animation="wave"
      variant="rounded"
      width={width}
      height={height}
      sx={{ borderRadius: `${radius ?? theme.customRadii.inner}px`, flexShrink: 0 }}
    />
  );
};

/** Search field + dropdown, matching FilterBar. */
const FilterBarShimmer: React.FC<{ pills?: number }> = ({ pills = 0 }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Block width={240} height={48} />
      <Block width={150} height={48} />
      {Array.from({ length: pills }).map((_, i) => (
        <Block key={i} width={96} height={34} radius={theme.customRadii.pill} />
      ))}
    </Box>
  );
};

/** Table card: title block, column headers, then striped body rows. */
const TableShimmer: React.FC<{ rows?: number; fill?: boolean; header?: boolean }> = ({
  rows = 6,
  fill = false,
  header = true,
}) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        padding: `${theme.customSpacing.cardPadding}px`,
        borderRadius: `${theme.customRadii.card}px`,
        ...(fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {}),
      }}
    >
      {header && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Line width={200} height={24} />
            <Line width={320} height={18} />
          </Box>
          <Block width={120} height={36} radius={theme.customRadii.pill} />
        </Box>
      )}

      {/* Column header strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1.5,
          mb: 1,
          borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        }}
      >
        <Line width="22%" height={16} />
        <Line width="18%" height={16} />
        <Line width="12%" height={16} />
        <Line width="14%" height={16} />
        <Box sx={{ ml: 'auto' }}>
          <Line width={60} height={16} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: fill ? 1 : 'none' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              height: 56,
              borderBottom: `1px solid ${theme.palette.tokens.divider}`,
            }}
          >
            <Skeleton animation="wave" variant="circular" width={36} height={36} />
            <Line width="24%" height={24} />
            <Line width="18%" height={24} />
            <Line width="12%" height={24} />
            <Box sx={{ ml: 'auto' }}>
              <Block width={80} height={32} radius={theme.customRadii.pill} />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

/** The four tinted stat cards used on role home screens. */
const MetricCardsShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <Grid container spacing={2.5} alignItems="stretch">
      {(['lavender', 'mint', 'butter', 'sky'] as const).map((tint) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={tint}>
          <Card
            sx={{
              padding: `${theme.customSpacing.cardPadding}px`,
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.tints[tint],
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 140,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Line width="50%" height={20} />
              <Block width={36} height={36} radius={theme.customRadii.inner / 2} />
            </Box>
            <Box sx={{ my: 0.5 }}>
              <Block width={90} height={36} radius={theme.customRadii.inner / 2} />
            </Box>
            <Box sx={{ mt: 1 }}>
              <Line width="65%" height={16} />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

/** Section heading: title line over a subtitle line. */
const HeadingShimmer: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    <Line width={220} height={26} />
    <Line width={340} height={18} />
  </Box>
);

// ─── page bodies ──────────────────────────────────────────────────────────

const DashboardBody: React.FC = () => (
  <>
    <MetricCardsShimmer />
    <TableShimmer rows={5} />
  </>
);

const ListBody: React.FC = () => (
  <>
    <FilterBarShimmer />
    <TableShimmer rows={8} fill header={false} />
  </>
);

const DetailBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      {/* Back link + campaign title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Block width={40} height={40} />
        <HeadingShimmer />
      </Box>

      {/* Summary card — four stat columns and a status pill */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Line width={240} height={26} />
          <Block width={110} height={30} radius={theme.customRadii.pill} />
        </Box>
        <Grid container spacing={2.5}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 6, md: 3 }} key={i}>
              <Line width="60%" height={16} />
              <Line width="45%" height={30} />
            </Grid>
          ))}
        </Grid>
      </Card>

      <FilterBarShimmer />
      <TableShimmer rows={5} header={false} />
    </>
  );
};

const ReportsBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <MetricCardsShimmer />
      <Grid container spacing={2.5}>
        {[0, 1].map((i) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Card
              sx={{
                padding: `${theme.customSpacing.cardPadding}px`,
                borderRadius: `${theme.customRadii.card}px`,
                height: 300,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Line width={160} height={24} />
                  <Line width={100} height={32} />
                </Box>
                <Block width={140} height={32} radius={theme.customRadii.pill} />
              </Box>
              <Block width="100%" height="100%" />
            </Card>
          </Grid>
        ))}
      </Grid>
      <TableShimmer rows={4} />
    </>
  );
};

const ChatBody: React.FC = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 2.5, flex: 1, minHeight: 0 }}>
      {/* Conversation list */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          width: 320,
          flexShrink: 0,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Block width="100%" height={44} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Line width="70%" height={20} />
              <Line width="45%" height={16} />
            </Box>
          </Box>
        ))}
      </Card>

      {/* Message thread — alternating bubbles above a composer */}
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2 }}>
          <Skeleton animation="wave" variant="circular" width={40} height={40} />
          <Box>
            <Line width={160} height={20} />
            <Line width={100} height={16} />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            justifyContent: 'flex-end',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}
            >
              <Block
                width={i % 2 ? '45%' : '60%'}
                height={i % 2 ? 56 : 72}
                radius={theme.customRadii.card}
              />
            </Box>
          ))}
        </Box>

        <Block width="100%" height={52} />
      </Card>
    </Box>
  );
};

const FormBody: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        padding: `${theme.customSpacing.cardPadding}px`,
        borderRadius: `${theme.customRadii.card}px`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 4 }}>
        <Skeleton animation="wave" variant="circular" width={72} height={72} />
        <Box>
          <Line width={200} height={28} />
          <Line width={140} height={18} />
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Line width={110} height={16} />
            <Block width="100%" height={48} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Block width={150} height={44} radius={theme.customRadii.pill} />
      </Box>
    </Card>
  );
};

const GridBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <FilterBarShimmer />
      <Grid container spacing={2.5}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Card
              sx={{
                padding: `${theme.customSpacing.cardPadding}px`,
                borderRadius: `${theme.customRadii.card}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton animation="wave" variant="circular" width={44} height={44} />
                <Box sx={{ flex: 1 }}>
                  <Line width="70%" height={20} />
                  <Line width="45%" height={16} />
                </Box>
              </Box>
              <Block width="100%" height={44} />
              <Block width="100%" height={40} radius={theme.customRadii.pill} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

const ShellBody: React.FC = () => (
  <>
    <HeadingShimmer />
    <Block width="100%" height={420} />
  </>
);

const bodies: Record<Exclude<PageSkeletonVariant, 'auth'>, React.FC> = {
  dashboard: DashboardBody,
  list: ListBody,
  detail: DetailBody,
  reports: ReportsBody,
  chat: ChatBody,
  form: FormBody,
  grid: GridBody,
  shell: ShellBody,
};

// ─── chrome ───────────────────────────────────────────────────────────────

/** Rail + top bar + content surface — the frame every dashboard page shares. */
const Chrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '8px 8px 80px 8px', sm: '12px 12px 88px 12px', md: '16px' },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
      }}
    >
      {/* Floating sidebar rail */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          bottom: 16,
          left: 16,
          width: 240,
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: '20px 14px',
          gap: 2,
          zIndex: 1200,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 0.5,
            justifyContent: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: `${theme.customRadii.inner}px`,
              backgroundColor: theme.palette.tints.butter,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StarRoundedIcon sx={{ fontSize: '20px', color: theme.palette.tokens.rail }} />
          </Box>
          <Skeleton
            animation="wave"
            variant="text"
            width={110}
            height={24}
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            mt: 1,
            alignItems: 'stretch',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              animation="wave"
              variant="rounded"
              width="100%"
              height={44}
              sx={{
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main white content surface */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
          minHeight: { xs: 'calc(100vh - 88px)', md: 'calc(100vh - 32px)' },
          marginLeft: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: { xs: '12px 16px', sm: '16px 24px', md: '20px 32px' },
            borderBottom: `1px solid ${theme.palette.tokens.divider}`,
            minHeight: '80px',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Line width={180} height={28} />
            <Line width={260} height={18} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Block width={120} height={40} radius={theme.customRadii.pill} />
          </Box>
        </Box>

        {/* Content body */}
        <Box
          sx={{
            padding: {
              xs: `${theme.customSpacing.cardPadding / 2}px`,
              sm: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: `${theme.customSpacing.cardGap}px`,
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

/** Login / accept-terms / complete-profile: a centred card on the page bg. */
const AuthSkeleton: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding * 1.5}px`,
          borderRadius: `${theme.customRadii.card}px`,
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Skeleton animation="wave" variant="circular" width={56} height={56} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Line width={200} height={30} />
          <Line width={260} height={18} />
        </Box>
        <Block width="100%" height={52} />
        <Block width="100%" height={52} />
        <Block width="100%" height={48} radius={theme.customRadii.pill} />
      </Card>
    </Box>
  );
};

/**
 * Route-level loading shimmer. Pick the variant that matches the page behind
 * it — see {@link PageSkeletonVariant}.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'shell' }) => {
  if (variant === 'auth') {
    return <AuthSkeleton />;
  }

  const Body = bodies[variant];
  return (
    <Chrome>
      <Body />
    </Chrome>
  );
};
