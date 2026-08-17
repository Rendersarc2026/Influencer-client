import React, { Suspense, lazy, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
// Imported from its own module rather than the '@molecules' barrel on purpose:
// the barrel re-exports ChartCard, which pulls recharts into the entry chunk's
// import graph and made every page preload the ~150kB chart bundle.
import { ErrorBoundary } from '../components/molecules/ErrorBoundary';
import { RequireAuth, RequireTerms, ProtectedRoute, RootRedirect } from './guards';
import { useAuth } from '@hooks';

// -------------------------------------------------------------
// Route-level code splitting.
//
// Each page is its own chunk, so a brand user never downloads the agency or
// creator screens (or the chart library they pull in) just to see their
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
const AgencyCategoriesPage = lazy(() =>
  import('../pages/AgencyCategoriesPage').then((m) => ({ default: m.AgencyCategoriesPage })),
);
const AgencyUsersPage = lazy(() =>
  import('../pages/AgencyUsersPage').then((m) => ({ default: m.AgencyUsersPage })),
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
const AgencyInfluencersPage = lazy(() =>
  import('../pages/AgencyInfluencersPage').then((m) => ({ default: m.AgencyInfluencersPage })),
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
 * Prefetching every route would hand a brand user the agency and creator
 * screens plus the chart library they never open. Each role gets its own set,
 * plus the surfaces every role shares.
 */
const sharedLoaders: Array<() => Promise<unknown>> = [
  () => import('../pages/ChatPage'),
  () => import('../pages/ProfilePage'),
];

const roleLoaders: Record<string, Array<() => Promise<unknown>>> = {
  AGENCY: [
    () => import('../pages/AgencyHome'),
    () => import('../pages/AgencyBrandsPage'),
    () => import('../pages/AgencyCampaignsPage'),
    () => import('../pages/AgencyCategoriesPage'),
    () => import('../pages/AgencyUsersPage'),
    () => import('../pages/AgencyCampaignDetailPage'),
    () => import('../pages/AgencyAddInfluencerPage'),
    () => import('../pages/AgencyInfluencersPage'),
    () => import('../pages/AgencyReportsPage'),
  ],
  BRAND: [
    () => import('../pages/BrandHome'),
    () => import('../pages/BrandCampaignsPage'),
    () => import('../pages/BrandCampaignDetailPage'),
    () => import('../pages/BrandPaymentsPage'),
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

import { PageSkeleton, PageSkeletonVariant } from '../components/templates/PageSkeleton';

/**
 * Wraps a lazy page in its error boundary and Suspense fallback.
 *
 * The fallback shimmer is per-route on purpose: a list page that flashes the
 * dashboard's metric cards before rendering a plain table reads as a layout
 * jump rather than as loading. Pass the variant that matches the page shape.
 */
const withBoundary = (Component: React.ComponentType, skeleton: PageSkeletonVariant = 'shell') => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton variant={skeleton} />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

const RootLayout: React.FC = () => (
  <Outlet />
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Root Redirect
      {
        path: '/',
        element: <RootRedirect />,
      },

  // Public Routes
  {
    path: '/login',
    element: withBoundary(LoginPage, 'auth'),
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
    element: <RequireAuth skeleton="auth">{withBoundary(AcceptTerms, 'auth')}</RequireAuth>,
  },
  {
    path: '/complete-profile',
    element: (
      <RequireAuth skeleton="auth">
        <RequireTerms skeleton="auth">{withBoundary(CompleteProfile, 'auth')}</RequireTerms>
      </RequireAuth>
    ),
  },


  // Agency Routes
  {
    path: '/agency',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="dashboard">
        {withBoundary(AgencyHome, 'dashboard')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/brands',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="list">
        {withBoundary(AgencyBrandsPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="list">
        {withBoundary(AgencyCampaignsPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="detail">
        {withBoundary(AgencyCampaignDetailPage, 'detail')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/campaigns/:id/add',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="grid">
        {withBoundary(AgencyAddInfluencerPage, 'grid')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/influencers',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="list">
        {withBoundary(AgencyInfluencersPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/categories',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="list">
        {withBoundary(AgencyCategoriesPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/users',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="list">
        {withBoundary(AgencyUsersPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/reports',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="reports">
        {withBoundary(AgencyReportsPage, 'reports')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/agency/chats',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY']} skeleton="chat">
        {withBoundary(ChatPage, 'chat')}
      </ProtectedRoute>
    ),
  },

  // Brand Routes
  {
    path: '/brand',
    element: (
      <ProtectedRoute allowedRoles={['BRAND']} skeleton="dashboard">
        {withBoundary(BrandHome, 'dashboard')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/campaigns',
    element: (
      <ProtectedRoute allowedRoles={['BRAND']} skeleton="list">
        {withBoundary(BrandCampaignsPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['BRAND']} skeleton="detail">
        {withBoundary(BrandCampaignDetailPage, 'detail')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/payments',
    element: (
      <ProtectedRoute allowedRoles={['BRAND']} skeleton="list">
        {withBoundary(BrandPaymentsPage, 'list')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/brand/chats',
    element: (
      <ProtectedRoute allowedRoles={['BRAND']} skeleton="chat">
        {withBoundary(ChatPage, 'chat')}
      </ProtectedRoute>
    ),
  },

  // Influencer Routes
  {
    path: '/influencer',
    element: (
      <ProtectedRoute allowedRoles={['INFLUENCER']} skeleton="dashboard">
        {withBoundary(InfluencerHome, 'dashboard')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/campaigns/:id',
    element: (
      <ProtectedRoute allowedRoles={['INFLUENCER']} skeleton="detail">
        {withBoundary(InfluencerAssignmentDetailPage, 'detail')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/profile',
    element: (
      <ProtectedRoute allowedRoles={['INFLUENCER']} skeleton="form">
        {withBoundary(InfluencerProfilePage, 'form')}
      </ProtectedRoute>
    ),
  },
  {
    path: '/influencer/chats',
    element: (
      <ProtectedRoute allowedRoles={['INFLUENCER']} skeleton="chat">
        {withBoundary(ChatPage, 'chat')}
      </ProtectedRoute>
    ),
  },

  // Direct Unified Chat Route. Every thread has the agency on one side.
  {
    path: '/chat',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY', 'BRAND', 'INFLUENCER']} skeleton="chat">
        {withBoundary(ChatPage, 'chat')}
      </ProtectedRoute>
    ),
  },

  // Direct Unified Profile Route (All roles)
  {
    path: '/profile',
    element: (
      <ProtectedRoute allowedRoles={['AGENCY', 'BRAND', 'INFLUENCER']} skeleton="form">
        {withBoundary(ProfilePage, 'form')}
      </ProtectedRoute>
    ),
  },

  // Wildcard Fallback
  {
    path: '*',
    element: <RootRedirect />,
  },
    ],
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
