import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CompleteProfileOrganism } from '@organisms';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const CompleteProfile: React.FC = () => {
  const { profileComplete, roleCode, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && profileComplete && roleCode) {
      navigate(getRoleDashboardPath(roleCode), { replace: true });
    }
  }, [isLoading, profileComplete, roleCode, navigate]);

  if (!isLoading && profileComplete && roleCode) {
    return <Navigate to={getRoleDashboardPath(roleCode)} replace />;
  }

  return <CompleteProfileOrganism />;
};
