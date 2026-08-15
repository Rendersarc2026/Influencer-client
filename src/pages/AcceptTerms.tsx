import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AcceptTermsOrganism } from '@organisms';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const AcceptTerms: React.FC = () => {
  const { termsAccepted, profileComplete, roleCode, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && termsAccepted && roleCode) {
      if (!profileComplete) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate(getRoleDashboardPath(roleCode), { replace: true });
      }
    }
  }, [isLoading, termsAccepted, profileComplete, roleCode, navigate]);

  if (!isLoading && termsAccepted && roleCode) {
    if (!profileComplete) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Navigate to={getRoleDashboardPath(roleCode)} replace />;
  }

  return <AcceptTermsOrganism />;
};
