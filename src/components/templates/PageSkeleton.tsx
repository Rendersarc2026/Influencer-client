import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@hooks';
import { SidebarRail } from '../organisms/SidebarRail';

export type PageSkeletonVariant =
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'reports'
  | 'chat'
  | 'form'
  | 'grid'
  | 'auth'
  | 'shell';

export interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
}

// ─── shared primitives ───────────────────────────────────────────────────

const Line: React.FC<{ width: number | string; height?: number; sx?: object }> = ({
  width,
  height = 20,
  sx,
}) => <Skeleton animation="wave" variant="text" width={width} height={height} sx={sx} />;

const Block: React.FC<{
  width: number | string;
  height: number | string;
  radius?: number;
  sx?: object;
}> = ({ width, height, radius, sx }) => {
  const theme = useTheme();
  return (
    <Skeleton
      animation="wave"
      variant="rounded"
      width={width}
      height={height}
      sx={{ borderRadius: `${radius ?? theme.customRadii.inner}px`, flexShrink: 0, ...sx }}
    />
  );
};

// ─── building blocks ─────────────────────────────────────────────────────

const HeadingShimmer: React.FC<{ rightAction?: boolean }> = ({ rightAction = true }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 2 },
        minHeight: { xs: 0, sm: 48 },
        mb: 1,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%', minWidth: 0 }}>
        <Line width={220} height={32} sx={{ borderRadius: 1, maxWidth: '100%' }} />
        <Line width={340} height={18} sx={{ borderRadius: 1, maxWidth: '100%' }} />
      </Box>
      {rightAction && <Block width={120} height={40} radius={theme.customRadii.pill} />}
    </Box>
  );
};

const FilterBarShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
      <Block
        width={260}
        height={44}
        radius={theme.customRadii.inner}
        sx={{ width: { xs: '100%', sm: 260 } }}
      />
      <Block width={110} height={36} radius={theme.customRadii.pill} />
      <Block width={110} height={36} radius={theme.customRadii.pill} />
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Block width={110} height={36} radius={theme.customRadii.pill} />
      </Box>
      <Box sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
        <Block
          width={140}
          height={44}
          radius={theme.customRadii.inner}
          sx={{ width: { xs: '100%', sm: 140 } }}
        />
      </Box>
    </Box>
  );
};

const MetricCardShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        padding: { xs: '16px', sm: '20px' },
        borderRadius: `${theme.customRadii.card}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minHeight: 140,
        backgroundColor: theme.palette.tokens.surface,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Line width={100} height={16} />
        <Skeleton animation="wave" variant="circular" width={36} height={36} />
      </Box>
      <Line width={90} height={36} />
      <Line width={140} height={16} />
    </Card>
  );
};

const ChartCardShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        padding: {
          xs: `${theme.customSpacing.cardPaddingMobile}px`,
          md: `${theme.customSpacing.cardPadding}px`,
        },
        borderRadius: `${theme.customRadii.card}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: 320,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Line width={140} height={20} />
          <Line width={80} height={28} />
        </Box>
        <Block width={120} height={32} radius={theme.customRadii.pill} />
      </Box>
      <Block width="100%" height={200} radius={theme.customRadii.inner} />
    </Card>
  );
};

const TableShimmer: React.FC<{ rows?: number; fill?: boolean }> = ({ rows = 6, fill = false }) => {
  const theme = useTheme();
  // DataTable renders stacked cards below `sm`, so the placeholder has to have
  // that shape too — a five-column strip here shifts the layout the moment the
  // rows arrive, and overruns the viewport while it waits.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      sx={{
        padding: {
          xs: `${theme.customSpacing.cardPaddingMobile}px`,
          md: `${theme.customSpacing.cardPadding}px`,
        },
        borderRadius: `${theme.customRadii.card}px`,
        flex: fill ? 1 : 'none',
        minHeight: { xs: 280, sm: 360 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
            <Box
              key={index}
              sx={{
                border: `1px solid ${theme.palette.tokens.divider}`,
                borderRadius: `${theme.customRadii.inner}px`,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
              }}
            >
              {/* Card heading — avatar plus name and sub-label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton animation="wave" variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Line width="60%" height={18} />
                  <Line width="40%" height={14} />
                </Box>
              </Box>
              {/* Two label / value rows */}
              {[0, 1].map((r) => (
                <Box
                  key={r}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Line width={72} height={14} />
                  <Line width={96} height={14} />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <>
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
            <Line width="25%" height={16} />
            <Line width="20%" height={16} />
            <Line width="15%" height={16} />
            <Line width="15%" height={16} />
            <Box sx={{ ml: 'auto' }}>
              <Line width={60} height={16} />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
            {Array.from({ length: rows }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: 52,
                  borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                }}
              >
                <Skeleton animation="wave" variant="circular" width={32} height={32} />
                <Line width="24%" height={18} />
                <Line width="18%" height={18} />
                <Line width="14%" height={18} />
                <Line width="14%" height={18} />
                <Box sx={{ ml: 'auto' }}>
                  <Block width={75} height={26} radius={theme.customRadii.pill} />
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Card>
  );
};

// ─── page bodies ─────────────────────────────────────────────────────────

/** 1. Dashboard: Metrics row + recent table */
const DashboardBody: React.FC = () => (
  <>
    <HeadingShimmer rightAction={false} />
    <Grid container spacing={2.5} alignItems="stretch">
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
    </Grid>
    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Line width={180} height={24} />
      <TableShimmer rows={5} />
    </Box>
  </>
);

/** 2. List: Header + FilterBar + Full-height Table */
const ListBody: React.FC = () => (
  <>
    <HeadingShimmer />
    <FilterBarShimmer />
    <TableShimmer rows={7} fill />
  </>
);

/** 3. Detail: Summary card + Detail table */
const DetailBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <HeadingShimmer />
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
        }}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Line width={80} height={16} />
            <Line width={140} height={24} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Line width={80} height={16} />
            <Line width={120} height={24} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Line width={80} height={16} />
            <Line width={110} height={24} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Line width={80} height={16} />
            <Line width={130} height={24} />
          </Grid>
        </Grid>
      </Card>
      <Box sx={{ mt: 1 }}>
        <TableShimmer rows={5} fill />
      </Box>
    </>
  );
};

/** 4. Reports: Metrics + Charts + Performance Table */
const ReportsBody: React.FC = () => (
  <>
    <HeadingShimmer />
    <Grid container spacing={2.5} alignItems="stretch">
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCardShimmer />
      </Grid>
    </Grid>
    <Grid container spacing={2.5} sx={{ mt: 1 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChartCardShimmer />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChartCardShimmer />
      </Grid>
    </Grid>
    <Box sx={{ mt: 1 }}>
      <TableShimmer rows={5} />
    </Box>
  </>
);

/** 5. Chat: Two-column conversation list + message thread */
const ChatBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <HeadingShimmer rightAction={false} />
      <Card
        sx={{
          flex: 1,
          minHeight: 520,
          borderRadius: `${theme.customRadii.card}px`,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left conversations panel */}
        <Box
          sx={{
            width: 320,
            borderRight: `1px solid ${theme.palette.tokens.divider}`,
            padding: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Block width="100%" height={40} radius={theme.customRadii.inner} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton animation="wave" variant="circular" width={40} height={40} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                <Line width="70%" height={18} />
                <Line width="90%" height={14} />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Right message thread */}
        <Box sx={{ flex: 1, padding: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 2, borderBottom: `1px solid ${theme.palette.tokens.divider}` }}>
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Line width={140} height={20} />
              <Line width={90} height={14} />
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
            <Block width="40%" height={44} radius={theme.customRadii.card} sx={{ alignSelf: 'flex-start' }} />
            <Block width="50%" height={52} radius={theme.customRadii.card} sx={{ alignSelf: 'flex-end' }} />
            <Block width="35%" height={40} radius={theme.customRadii.card} sx={{ alignSelf: 'flex-start' }} />
          </Box>
          <Block width="100%" height={48} radius={theme.customRadii.pill} />
        </Box>
      </Card>
    </>
  );
};

/** 6. Form: Profile edit card */
const FormBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <HeadingShimmer rightAction={false} />
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          maxWidth: 800,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton animation="wave" variant="circular" width={72} height={72} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Line width={180} height={24} />
            <Line width={120} height={16} />
          </Box>
        </Box>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Block width="100%" height={52} radius={theme.customRadii.inner} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Block width="100%" height={52} radius={theme.customRadii.inner} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Block width="100%" height={52} radius={theme.customRadii.inner} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Block width="100%" height={52} radius={theme.customRadii.inner} />
          </Grid>
          <Grid size={12}>
            <Block width="100%" height={90} radius={theme.customRadii.inner} />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
          <Block width={100} height={40} radius={theme.customRadii.pill} />
          <Block width={140} height={40} radius={theme.customRadii.pill} />
        </Box>
      </Card>
    </>
  );
};

/** 7. Grid: Add Influencer card grid */
const GridBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <HeadingShimmer />
      <FilterBarShimmer />
      <Grid container spacing={2.5}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                padding: 2.5,
                borderRadius: `${theme.customRadii.card}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton animation="wave" variant="circular" width={48} height={48} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                  <Line width="75%" height={20} />
                  <Line width="50%" height={16} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Line width={70} height={16} />
                <Line width={90} height={16} />
              </Box>
              <Block width="100%" height={38} radius={theme.customRadii.pill} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

/** 8. Centred Auth Skeleton */
const AuthSkeleton: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
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
        <Skeleton animation="wave" variant="text" width="60%" height={30} sx={{ mx: 'auto' }} />
        <Skeleton
          animation="wave"
          variant="rounded"
          width="100%"
          height={52}
          sx={{ borderRadius: `${theme.customRadii.inner}px` }}
        />
        <Skeleton
          animation="wave"
          variant="rounded"
          width="100%"
          height={52}
          sx={{ borderRadius: `${theme.customRadii.inner}px` }}
        />
        <Skeleton
          animation="wave"
          variant="rounded"
          width="100%"
          height={48}
          sx={{ borderRadius: `${theme.customRadii.pill}px` }}
        />
      </Card>
    </Box>
  );
};

const bodies: Record<Exclude<PageSkeletonVariant, 'auth' | 'shell'>, React.FC> = {
  dashboard: DashboardBody,
  list: ListBody,
  detail: DetailBody,
  reports: ReportsBody,
  chat: ChatBody,
  form: FormBody,
  grid: GridBody,
};

function resolveVariant(pathname: string, requested?: PageSkeletonVariant): PageSkeletonVariant {
  if (requested && requested !== 'shell') return requested;
  if (
    pathname === '/login' ||
    pathname === '/accept-terms' ||
    pathname === '/complete-profile'
  ) {
    return 'auth';
  }
  if (pathname === '/agency' || pathname === '/brand' || pathname === '/influencer') {
    return 'dashboard';
  }
  if (pathname.includes('/reports')) return 'reports';
  if (pathname.includes('/chats')) return 'chat';
  if (pathname.includes('/profile')) return 'form';
  if (pathname.endsWith('/add')) return 'grid';
  if (pathname.match(/\/(campaigns|assignments)\/[^/]+$/)) return 'detail';
  return 'list';
}

/**
 * Route-level loading shimmer precisely tailored to the target page shape.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'shell' }) => {
  const theme = useTheme();
  const location = useLocation();
  const { logout } = useAuth();

  const resolved = resolveVariant(location.pathname, variant);

  if (resolved === 'auth') {
    return <AuthSkeleton />;
  }

  const Body = bodies[resolved as Exclude<PageSkeletonVariant, 'auth' | 'shell'>] || ListBody;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '8px 8px 80px 8px', sm: '12px 12px 88px 12px', md: '16px' },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <SidebarRail
        loading={true}
        activePath={location.pathname}
        onNavigate={() => {}}
        onLogout={logout}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          ml: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          gap: {
            xs: `${theme.customSpacing.cardGapMobile}px`,
            md: `${theme.customSpacing.cardGap}px`,
          },
        }}
      >
        <Body />
      </Box>
    </Box>
  );
};
