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
import {
  TOPBAR_CONTROL_GAP,
  TOPBAR_CONTROL_SIZE,
  TOPBAR_HEIGHT,
  TOPBAR_PADDING,
} from '../organisms/topBar.spacing';

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

const TopBarShimmer: React.FC<{ hasBack?: boolean }> = ({ hasBack = false }) => {
  const theme = useTheme();
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        height: TOPBAR_HEIGHT,
        minHeight: TOPBAR_HEIGHT,
        padding: TOPBAR_PADDING,
        boxSizing: 'border-box',
        borderBottom: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        borderTopLeftRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        borderTopRightRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
        gap: { xs: 1, sm: 1.5 },
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {hasBack && (
          <Block
            width={TOPBAR_CONTROL_SIZE.sm}
            height={TOPBAR_CONTROL_SIZE.sm}
            radius={10}
            sx={{ flexShrink: 0 }}
          />
        )}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0.5,
            overflow: 'hidden',
          }}
        >
          {hasBack && (
            <Line width={180} height={14} sx={{ display: { xs: 'none', sm: 'block' } }} />
          )}
          <Line width={220} height={26} />
          <Line width={300} height={14} sx={{ display: { xs: 'none', sm: 'block' } }} />
        </Box>
      </Box>

      {/* Right controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: TOPBAR_CONTROL_GAP,
          flexShrink: 0,
        }}
      >
        <Block
          width={130}
          height={TOPBAR_CONTROL_SIZE.sm}
          radius={theme.customRadii.pill}
          sx={{ display: { xs: 'none', sm: 'block' } }}
        />
        <Skeleton
          animation="wave"
          variant="circular"
          width={TOPBAR_CONTROL_SIZE.sm}
          height={TOPBAR_CONTROL_SIZE.sm}
        />
        <Block
          width={120}
          height={TOPBAR_CONTROL_SIZE.sm}
          radius={theme.customRadii.pill}
          sx={{ display: { xs: 'none', md: 'block' } }}
        />
      </Box>
    </Box>
  );
};

const FilterBarShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        flexWrap: 'wrap',
        mb: 1,
      }}
    >
      <Block
        width={260}
        height={40}
        radius={theme.customRadii.inner}
        sx={{ width: { xs: '100%', sm: 260 }, flexGrow: { xs: 1, sm: 0 } }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          ml: { xs: 0, sm: 'auto' },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          flexWrap: 'nowrap',
          overflowX: 'auto',
        }}
      >
        <Block width={130} height={40} radius={theme.customRadii.inner} />
        <Block width={130} height={40} radius={theme.customRadii.inner} />
        <Block width={130} height={40} radius={theme.customRadii.inner} />
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
        border: `1px solid ${theme.palette.tokens.divider}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minHeight: 140,
        backgroundColor: theme.palette.tokens.surface,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Line width={100} height={16} />
        <Skeleton animation="wave" variant="circular" width={34} height={34} />
      </Box>
      <Line width={90} height={34} />
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
        border: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: 320,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Line width={140} height={20} />
          <Line width={80} height={26} />
        </Box>
        <Block width={120} height={32} radius={theme.customRadii.pill} />
      </Box>
      <Block width="100%" height={200} radius={theme.customRadii.inner} />
    </Card>
  );
};

const TableShimmer: React.FC<{ rows?: number; fill?: boolean }> = ({ rows = 6, fill = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      sx={{
        padding: {
          xs: `${theme.customSpacing.cardPaddingMobile}px`,
          md: `${theme.customSpacing.cardPadding}px`,
        },
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
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
              {/* Card heading — row badge, avatar plus name and sub-label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Block width={24} height={24} radius={theme.customRadii.inner} />
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
            <Line width={28} height={16} />
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
                <Line width={24} height={18} />
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

/** Horizontal Creator Roster Card List Shimmer (Used on Add Influencers to Campaign page) */
const RosterCardListShimmer: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <FilterBarShimmer />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
        <Line width={180} height={24} />
        <Line width={440} height={16} sx={{ display: { xs: 'none', sm: 'block' } }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            sx={{
              padding: { xs: '14px', sm: '20px' },
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.tokens.surface,
              border: `1px solid ${theme.palette.tokens.divider}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            {/* Creator Bio Shimmer */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
              <Skeleton animation="wave" variant="circular" width={48} height={48} sx={{ flexShrink: 0 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0, flex: 1 }}>
                <Line width={140} height={20} />
                <Line width={220} height={16} />
                <Block width={100} height={22} radius={theme.customRadii.pill} />
              </Box>
            </Box>

            {/* Deliverables Input Shimmer */}
            <Box
              sx={{
                width: { xs: '100%', sm: 320 },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Line width={130} height={14} />
              <Block width="100%" height={40} radius={theme.customRadii.inner} />
            </Box>

            {/* Action Button Shimmer */}
            <Block
              width={140}
              height={40}
              radius={theme.customRadii.inner}
              sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
            />
          </Card>
        ))}
      </Box>
    </>
  );
};

// ─── page bodies ─────────────────────────────────────────────────────────

/** 1. Dashboard: Metrics row + recent table */
const DashboardBody: React.FC = () => (
  <>
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

/** 2. List: FilterBar + Full-height Table */
const ListBody: React.FC = () => (
  <>
    <FilterBarShimmer />
    <TableShimmer rows={7} fill />
  </>
);

/** 3. Detail: Summary card + Detail table */
const DetailBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <Card
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          border: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
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
    <Card
      sx={{
        flex: 1,
        minHeight: 520,
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
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
  );
};

/** 6. Form: Profile edit card */
const FormBody: React.FC = () => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        padding: `${theme.customSpacing.cardPadding}px`,
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
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
  );
};

/** 7. Grid / Roster: Add Influencer card list */
const GridBody: React.FC = () => <RosterCardListShimmer />;

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
          border: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
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

  const hasBack =
    resolved === 'detail' ||
    resolved === 'grid' ||
    location.pathname.includes('/add') ||
    Boolean(location.pathname.match(/\/(campaigns|assignments)\/[^/]+$/));

  const Body = bodies[resolved as Exclude<PageSkeletonVariant, 'auth' | 'shell'>] || ListBody;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        '@supports (height: 100dvh)': { height: '100dvh' },
        overflow: 'hidden',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: {
          xs: '8px',
          sm: '12px',
          md: '16px',
        },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
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
          minHeight: 0,
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: '16px', md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
          marginLeft: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: { xs: '100%', md: 'calc(100% - 260px)' },
        }}
      >
        <TopBarShimmer hasBack={hasBack} />
        <Box
          sx={{
            padding: {
              xs: '14px 10px',
              sm: '18px 18px',
              md: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '14px', sm: '16px', md: `${theme.customSpacing.cardGap}px` },
            overflowX: 'hidden',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Body />
        </Box>
      </Box>
    </Box>
  );
};
