import React, { Suspense, lazy, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Box from '@mui/material/Box';
// Imported from its own module rather than the '@molecules' barrel on purpose:
// the barrel re-exports ChartCard, which pulls recharts into the entry chunk's
// import graph and made every page preload the ~150kB chart bundle.
import { ErrorBoundary } from '../components/molecules/ErrorBoundary';
import { RequireAuth, RequireTerms, ProtectedRoute, RootRedirect } from './guards';
import { useAuth } from '@hooks';

// -------------------------------------------------------------
// Route-level code splitting.
//
// Each page is its own chunk, so a brand user never downloads the admin, agency
// and creator screens (or the chart library they pull in) just to see their
// dashboard. The chunks are then prefetched during the first idle period after
// mount — see prefetchRoutes below — so navigation still resolves from cache and
// no loading state is visible in practice.
// -------------------------------------------------------------
const LoginPage = lazy(() => import('../pages/Login').then((m) => ({ default: m.LoginPage })));
const AcceptTerms = lazy(() =>
  import('../pages/AcceptTerms').then((m) => ({ default: m.AcceptTerms })),
);
const CompleteProfile = lazy(() =>
  import('../pages/CompleteProfile').then((m) => ({ default: m.CompleteProfile })),
);
const AdminHome = lazy(() => import('../pages/AdminHome').then((m) => ({ default: m.AdminHome })));
const AdminAgenciesPage = lazy(() =>
  import('../pages/AdminAgenciesPage').then((m) => ({ default: m.AdminAgenciesPage })),
);
const AdminBrandsPage = lazy(() =>
  import('../pages/AdminBrandsPage').then((m) => ({ default: m.AdminBrandsPage })),
);
const AdminUsersPage = lazy(() =>
  import('../pages/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AgencyHome = lazy(() =>
  import('../pages/AgencyHome').then((m) => ({ default: m.AgencyHome })),
);
const AgencyBrandsPage = lazy(() =>
  import('../pages/AgencyBrandsPage').then((m) => ({ default: m.AgencyBrandsPage })),
);
const AgencyCampaignsPage = lazy(() =>
  import('../pages/AgencyCampaignsPage').then((m) => ({ default: m.AgencyCampaignsPage })),
);
const AgencyCampaignDetailPage = lazy(() =>
  import('../pages/AgencyCampaignDetailPage').then((m) => ({
    default: m.AgencyCampaignDetailPage,
  })),
);
const AgencyAddInfluencerPage = lazy(() =>
  import('../pages/AgencyAddInfluencerPage').then((m) => ({ default: m.AgencyAddInfluencerPage })),
);
const AgencyReportsPage = lazy(() =>
  import('../pages/AgencyReportsPage').then((m) => ({ default: m.AgencyReportsPage })),
);
const BrandHome = lazy(() => import('../pages/BrandHome').then((m) => ({ default: m.BrandHome })));
const BrandCampaignsPage = lazy(() =>
  import('../pages/BrandCampaignsPage').then((m) => ({ default: m.BrandCampaignsPage })),
);
const BrandCampaignDetailPage = lazy(() =>
  import('../pages/BrandCampaignDetailPage').then((m) => ({ default: m.BrandCampaignDetailPage })),
);
const BrandPaymentsPage = lazy(() =>
  import('../pages/BrandPaymentsPage').then((m) => ({ default: m.BrandPaymentsPage })),
);
const BrandRequirementsPage = lazy(() =>
  import('../pages/BrandRequirementsPage').then((m) => ({ default: m.BrandRequirementsPage })),
);
const InfluencerHome = lazy(() =>
  import('../pages/InfluencerHome').then((m) => ({ default: m.InfluencerHome })),
);
const InfluencerAssignmentDetailPage = lazy(() =>
  import('../pages/InfluencerAssignmentDetailPage').then((m) => ({
    default: m.InfluencerAssignmentDetailPage,
  })),
);
const InfluencerProfilePage = lazy(() =>
  import('../pages/InfluencerProfilePage').then((m) => ({ default: m.InfluencerProfilePage })),
);
const ChatPage = lazy(() => import('../pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

/**
 * Route chunks worth warming, grouped by role.
 *
 * Prefetching every route would hand a brand user the admin, agency and creator
 * screens plus the chart library they never open. Each role gets its own set,
 * plus the surfaces every role shares.
 */
const sharedLoaders: Array<() => Promise<unknown>> = [
  () => import('../pages/ChatPage'),
  () => import('../pages/ProfilePage'),
];

const roleLoaders: Record<string, Array<() => Promise<unknown>>> = {
  ADMIN: [
    () => import('../pages/AdminHome'),
    () => import('../pages/AdminAgenciesPage'),
    () => import('../pages/AdminBrandsPage'),
    () => import('../pages/AdminUsersPage'),
  ],
  AGENCY: [
    () => import('../pages/AgencyHome'),
    () => import('../pages/AgencyBrandsPage'),
    () => import('../pages/AgencyCampaignsPage'),
    () => import('../pages/AgencyCampaignDetailPage'),
    () => import('../pages/AgencyAddInfluencerPage'),
    () => import('../pages/AgencyReportsPage'),
  ],
  BRAND: [
    () => import('../pages/BrandHome'),
    () => import('../pages/BrandCampaignsPage'),
    () => import('../pages/BrandCampaignDetailPage'),
    () => import('../pages/BrandPaymentsPage'),
    () => import('../pages/BrandRequirementsPage'),
  ],
  INFLUENCER: [
    () => import('../pages/InfluencerHome'),
    () => import('../pages/InfluencerAssignmentDetailPage'),
    () => import('../pages/InfluencerProfilePage'),
  ],
};

function prefetchRoutes(roleCode: string | null): void {
  if (!roleCode) return;

  const run = () => {
    // Failures are ignored on purpose: a prefetch that does not land simply
    // means the chunk is fetched on navigation instead.
    [...sharedLoaders, ...(roleLoaders[roleCode] ?? [])].forEach((load) => {
      void load().catch(() => undefined);
    });
  };

  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback;
  if (typeof idle === 'function') {
    idle(run);
  } else {
    window.setTimeout(run, 1500);
  }
}

/**
 * Suspense fallback. Deliberately just the page background: with prefetching in
 * place this is almost never seen, and a spinner that flashes for 30ms reads as
 * a glitch rather than as progress.
 */
const RouteFallback: React.FC = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: (theme) => theme.palette.tokens.pageBg }} />
);

const withBoundary = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

const router = createBrowserRouter([
  // Root Redirect
  {
    path: '/',
    element: <RootRedirect />,
  },

  // Public Routes
  {
    path: '/login',
    element: withBoundary(LoginPage),
  },
  // The style guide is a development-only reference. Excluding it from
  // production keeps an unauthenticated internal surface — and its chunk — out
  // of the deployed bundle. Vite drops the import entirely when DEV is false.
  ...(import.meta.env.DEV
    ? [
        {
          path: '/style-guide',
          element: withBoundary(
            lazy(() => import('../pages/StyleGuide').then((m) => ({ default: m.StyleGuidePage }))),
          ),
        },
      ]
    : []),

  // Blocking Setup Routes
  {
    path: '/accept-terms',
    element: <RequireAuth>{withBoundary(AcceptTerms)}</RequireAuth>,
  },
  {
    path: '/complete-profile',
    element: (
      <RequireAuth>
        <RequireTerms>{withBoundary(CompleteProfile)}</RequireTerms>
      </RequireAuth>
    ),
  },

  // Admin Routes
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['ADMIN']}>{withBoundary(AdminHome)}</ProtectedRoute>,
  },
  {
    path: '/admin/agencies',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>{withBoundary(AdminAgenciesPage)}</ProtectedRoute>
    ),
  },
  {
    path: '/admin/brands',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>{withBoundary(AdminBrandsPage)}</ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>{withBoundary(AdminUsersPage)}</ProtectedRoute>
    ),
  },

  // Agency Routes
  {
    path: '/agency',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>{withBoundary(AgencyHome)}</ProtectedRoute>
    ),
  },
  {
    path: '/agency/brands',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>
        {withBoundary(AgencyBrandsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>
        {withBoundary(AgencyCampaignsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>
        {withBoundary(AgencyCampaignDetailPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns/:id/add',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>
        {withBoundary(AgencyAddInfluencerPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/reports',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>
        {withBoundary(AgencyReportsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/chats',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY']}>{withBoundary(ChatPage)}</ProtectedRoute>
    ),
  },

  // Brand Routes
  {
    path: '/brand',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>{withBoundary(BrandHome)}</ProtectedRoute>
    ),
  },
  {
    path: '/brand/campaigns',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>
        {withBoundary(BrandCampaignsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>
        {withBoundary(BrandCampaignDetailPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/payments',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>
        {withBoundary(BrandPaymentsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/requirements',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>
        {withBoundary(BrandRequirementsPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/chats',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'BRAND']}>{withBoundary(ChatPage)}</ProtectedRoute>
    ),
  },

  // Influencer Routes
  {
    path: '/influencer',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'INFLUENCER']}>
        {withBoundary(InfluencerHome)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'INFLUENCER']}>
        {withBoundary(InfluencerAssignmentDetailPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/profile',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'INFLUENCER']}>
        {withBoundary(InfluencerProfilePage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/chats',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'INFLUENCER']}>
        {withBoundary(ChatPage)}
      </ProtectedRoute>
    ),
  },

  // Direct Unified Chat Route
  {
    path: '/chat',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY', 'BRAND', 'INFLUENCER']}>
        {withBoundary(ChatPage)}
      </ProtectedRoute>
    ),
  },

  // Direct Unified Profile Route (All roles)
  {
    path: '/profile',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'AGENCY', 'BRAND', 'INFLUENCER']}>
        {withBoundary(ProfilePage)}
      </ProtectedRoute>
    ),
  },

  // Wildcard Fallback
  {
    path: '*',
    element: <RootRedirect />,
  },
]);

export const AppRoutes: React.FC = () => {
  const { roleCode } = useAuth();

  // Warm this role's route chunks once the browser is idle, so navigation
  // resolves from cache without the initial bundle carrying every screen.
  useEffect(() => {
    prefetchRoutes(roleCode);
  }, [roleCode]);

  return <RouterProvider router={router} />;
};
