import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RoleCode } from '@contracts';
import { DashboardSkeleton } from '@templates';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from './navConfig';

/**
 * 1. RequireAuth: Ensures the user has an active session cookie.
 */
export const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 2. RequireTerms: Ensures user accepted the latest terms version.
 */
export const RequireTerms: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { termsAccepted, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!termsAccepted) {
    return <Navigate to="/accept-terms" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * 3. RequireProfile: Ensures user completed their profile.
 */
export const RequireProfile: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profileComplete, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardSkeleton />;
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
}> = ({ allowedRoles, children }) => {
  const { roleCode, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
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
}> = ({ allowedRoles, children }) => {
  return (
    <RequireAuth>
      <RequireTerms>
        <RequireProfile>
          {allowedRoles ? (
            <RequireRole allowedRoles={allowedRoles}>{children}</RequireRole>
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated || !roleCode) {
    return <Navigate to="/login" replace />;
  }

  if (!termsAccepted) {
    return <Navigate to="/accept-terms" replace />;
  }

  if (!profileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Navigate to={getRoleDashboardPath(roleCode)} replace />;
};
