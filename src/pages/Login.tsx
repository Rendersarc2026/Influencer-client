import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginOrganism } from '@organisms';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, roleCode, termsAccepted, profileComplete, isLoading } = useAuth();
  const navigate = useNavigate();

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

  if (!isLoading && isAuthenticated && roleCode) {
    const destination = !termsAccepted
      ? '/accept-terms'
      : !profileComplete
        ? '/complete-profile'
        : getRoleDashboardPath(roleCode);
    return <Navigate to={destination} replace />;
  }

  return <LoginOrganism />;
};
