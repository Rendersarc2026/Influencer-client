import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RoleCode } from '@contracts';
import { PageSkeleton, PageSkeletonVariant } from '@templates';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from './navConfig';

/**
 * 1. RequireAuth: Ensures the user has an active session cookie.
 */
export const RequireAuth: React.FC<{ children: ReactNode; skeleton?: PageSkeletonVariant }> = ({
  children,
  skeleton = 'shell',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const cachedSessionActive =
    typeof window !== 'undefined'
      ? localStorage.getItem('app_session_active') === 'true' ||
        Boolean(localStorage.getItem('app_role_code'))
      : false;

  if (isLoading || (cachedSessionActive && !isAuthenticated)) {
    return <PageSkeleton variant={skeleton} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 2. RequireTerms: Ensures user accepted the latest terms version.
 */
export const RequireTerms: React.FC<{ children: ReactNode; skeleton?: PageSkeletonVariant }> = ({
  children,
  skeleton = 'shell',
}) => {
  const { termsAccepted, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton variant={skeleton} />;
  }

  if (!termsAccepted) {
    return <Navigate to="/accept-terms" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 3. RequireProfile: Ensures user completed their profile.
 */
export const RequireProfile: React.FC<{ children: ReactNode; skeleton?: PageSkeletonVariant }> = ({
  children,
  skeleton = 'shell',
}) => {
  const { profileComplete, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSkeleton variant={skeleton} />;
  }

  if (!profileComplete) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 4. RequireRole: Validates role code. If user accesses another role's route,
 * redirects them to their own role dashboard.
 */
export const RequireRole: React.FC<{
  allowedRoles: RoleCode[];
  children: ReactNode;
  skeleton?: PageSkeletonVariant;
}> = ({ allowedRoles, children, skeleton = 'shell' }) => {
  const { roleCode, isLoading } = useAuth();

  if (isLoading) {
    return <PageSkeleton variant={skeleton} />;
  }

  if (!roleCode || !allowedRoles.includes(roleCode)) {
    // Redirect to own dashboard, UX only (never 403)
    const target = getRoleDashboardPath(roleCode);
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};

/**
 * ProtectedLayoutWrapper: Chains RequireAuth -> RequireTerms -> RequireProfile
 */
export const ProtectedRoute: React.FC<{
  allowedRoles?: RoleCode[];
  children: ReactNode;
  /**
   * Shimmer shape to show while the session resolves. Matching it to the page
   * being guarded avoids a second, differently-shaped skeleton once the auth
   * check clears and the route's own Suspense fallback takes over.
   */
  skeleton?: PageSkeletonVariant;
}> = ({ allowedRoles, children, skeleton = 'shell' }) => {
  return (
    <RequireAuth skeleton={skeleton}>
      <RequireTerms skeleton={skeleton}>
        <RequireProfile skeleton={skeleton}>
          {allowedRoles ? (
            <RequireRole allowedRoles={allowedRoles} skeleton={skeleton}>
              {children}
            </RequireRole>
          ) : (
            children
          )}
        </RequireProfile>
      </RequireTerms>
    </RequireAuth>
  );
};

/**
 * RootRedirect: Redirects / to role home or /login
 */
export const RootRedirect: React.FC = () => {
  const { isAuthenticated, roleCode, termsAccepted, profileComplete, isLoading } = useAuth();

  const cachedRole =
    typeof window !== 'undefined'
      ? (localStorage.getItem('app_role_code') as RoleCode | null)
      : null;

  if (isLoading) {
    return <PageSkeleton variant="shell" />;
  }

  if (isAuthenticated && roleCode) {
    if (!termsAccepted) {
      return <Navigate to="/accept-terms" replace />;
    }
    if (!profileComplete) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to={getRoleDashboardPath(roleCode)} replace />;
  }

  if (cachedRole) {
    return <Navigate to={getRoleDashboardPath(cachedRole)} replace />;
  }

  return <Navigate to="/login" replace />;
};
