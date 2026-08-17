import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@hooks';
import { getNavItemsForRole } from '@routes/navConfig';
import { SidebarRail } from '../organisms/SidebarRail';

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

export interface PageSkeletonProps {
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
            <Line width="25%" height={20} />
            <Line width="18%" height={20} />
            <Line width="12%" height={20} />
            <Line width="16%" height={20} />
            <Box sx={{ ml: 'auto' }}>
              <Block width={80} height={26} radius={theme.customRadii.pill} />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

/** Metric card row: 4 coloured cards, imitating role home screens. */
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

const ReportsBody: React.FC = () => (
  <>
    <MetricCardsShimmer />
    <Grid container spacing={2.5}>
      {[0, 1].map((i) => (
        <Grid size={{ xs: 12, md: 6 }} key={i}>
          <Card
            sx={{
              padding: '24px',
              borderRadius: '24px',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Line width={180} height={24} />
              <Block width={80} height={30} radius={100} />
            </Box>
            <Block width="100%" height={200} radius={12} />
          </Card>
        </Grid>
      ))}
    </Grid>
    <TableShimmer rows={4} header={false} />
  </>
);

const ChatBody: React.FC = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 2.5, flex: 1, minHeight: 0 }}>
      {/* Thread list */}
      <Card
        sx={{
          width: 320,
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Block width="100%" height={40} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Block width={40} height={40} radius={20} />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Line width="70%" height={18} />
              <Line width="40%" height={14} />
            </Box>
          </Box>
        ))}
      </Card>

      {/* Message thread */}
      <Card
        sx={{
          flex: 1,
          padding: `${theme.customSpacing.cardPadding}px`,
          borderRadius: `${theme.customRadii.card}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 2 }}>
          <Block width={44} height={44} radius={22} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Line width={180} height={20} />
            <Line width={100} height={14} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 3 }}>
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '60%' }}>
            <Block width={260} height={60} radius={theme.customRadii.inner} />
          </Box>
          <Box sx={{ alignSelf: 'flex-end', maxWidth: '60%' }}>
            <Block width={220} height={44} radius={theme.customRadii.inner} />
          </Box>
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '60%' }}>
            <Block width={300} height={72} radius={theme.customRadii.inner} />
          </Box>
        </Box>
        <Block width="100%" height={48} radius={theme.customRadii.inner} />
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
        maxWidth: 720,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <HeadingShimmer />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Block width="100%" height={52} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Block width="100%" height={52} />
        </Grid>
        <Grid size={12}>
          <Block width="100%" height={52} />
        </Grid>
        <Grid size={12}>
          <Block width="100%" height={120} />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Block width={90} height={40} radius={theme.customRadii.pill} />
        <Block width={120} height={40} radius={theme.customRadii.pill} />
      </Box>
    </Card>
  );
};

const GridBody: React.FC = () => {
  const theme = useTheme();
  return (
    <>
      <FilterBarShimmer pills={4} />
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
  const location = useLocation();
  const { roleCode, logout } = useAuth();

  const navItems = roleCode ? getNavItemsForRole(roleCode) : [];

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '8px 8px 80px 8px', sm: '12px 12px 88px 12px', md: '16px' },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Sidebar rail */}
      {roleCode ? (
        <SidebarRail
          items={navItems}
          activePath={location.pathname}
          onNavigate={() => {}}
          onLogout={logout}
        />
      ) : (
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
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <StarRoundedIcon sx={{ color: theme.palette.tokens.rail, fontSize: 22 }} />
            </Box>
            <Skeleton
              animation="wave"
              variant="text"
              width={110}
              height={24}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3, flex: 1 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1 }}>
                <Block width={24} height={24} radius={6} />
                <Line width={90} height={16} />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Main content surface */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          ml: { xs: 0, md: '260px' },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: '14px', sm: '16px', md: `${theme.customSpacing.cardGap}px` },
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1, md: 0 },
          }}
        >
          <HeadingShimmer />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Block width={40} height={40} radius={20} />
            <Block width={140} height={40} radius={theme.customRadii.inner} />
          </Box>
        </Box>

        {/* Page body shimmer */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: '14px', sm: '16px', md: `${theme.customSpacing.cardGap}px` },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// ─── auth skeleton ────────────────────────────────────────────────────────

/** Centred auth card — used on login, terms, onboarding. */
const AuthSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          padding: { xs: '28px', sm: '36px' },
          borderRadius: `${theme.customRadii.card}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 1 }}>
          <Block width={48} height={48} radius={24} />
          <Line width={180} height={26} />
          <Line width={240} height={16} />
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
