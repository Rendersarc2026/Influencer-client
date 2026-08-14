import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginOrganism } from '@organisms';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, roleCode, isLoading } = useAuth();

  // Once the session cookie is set and /auth/me returns a user,
  // redirect to the role-appropriate dashboard.
  if (!isLoading && isAuthenticated) {
    return <Navigate to={getRoleDashboardPath(roleCode)} replace />;
  }

  return <LoginOrganism />;
};
