import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginOrganism } from '@organisms';
import { PageSkeleton } from '@templates';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';
import { RoleCode } from '@contracts';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, roleCode, termsAccepted, profileComplete, isLoading } = useAuth();
  const navigate = useNavigate();

  const cachedSessionActive =
    typeof window !== 'undefined'
      ? localStorage.getItem('app_session_active') === 'true' ||
        Boolean(localStorage.getItem('app_role_code'))
      : false;

  const cachedRole =
    typeof window !== 'undefined'
      ? (localStorage.getItem('app_role_code') as RoleCode | null)
      : null;

  useEffect(() => {
    if (!isLoading && isAuthenticated && roleCode) {
      const destination = !termsAccepted
        ? '/accept-terms'
        : !profileComplete
          ? '/complete-profile'
          : getRoleDashboardPath(roleCode);
      navigate(destination, { replace: true });
    }
  }, [isLoading, isAuthenticated, roleCode, termsAccepted, profileComplete, navigate]);

  // While loading or if an active session/role exists in localStorage, render loading skeleton rather than showing the login form
  if (isLoading || (cachedSessionActive && !isAuthenticated)) {
    return <PageSkeleton variant="auth" />;
  }

  if (isAuthenticated && roleCode) {
    const destination = !termsAccepted
      ? '/accept-terms'
      : !profileComplete
        ? '/complete-profile'
        : getRoleDashboardPath(roleCode);
    return <Navigate to={destination} replace />;
  }

  if (cachedRole) {
    return <Navigate to={getRoleDashboardPath(cachedRole)} replace />;
  }

  return <LoginOrganism />;
};
