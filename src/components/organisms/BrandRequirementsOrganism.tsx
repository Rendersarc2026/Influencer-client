import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading, EmptyState } from '@atoms';
import { useAuth } from '@hooks';

/**
 * Campaign requirements.
 *
 * This screen used to keep a list of briefs in component state and seed it with
 * two invented entries. Submitting the form pushed onto that array and nothing
 * left the browser, so a brand user was told their brief had been "sent to
 * agency" when no request was ever made and the entry disappeared on reload.
 *
 * There is no requirements resource on the API. Until there is, the screen says
 * so and points at the channel that does work — chat with the agency.
 */
export const BrandRequirementsOrganism: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <DashboardLayout
      title="Campaign Requirements"
      subtitle="Brief your agency partner on upcoming product launches and creator requirements"
      navItems={navConfig.BRAND}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Brand Manager',
        email: user?.email,
        roleCode: 'BRAND',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SectionHeading
          title="Active Briefs & Sourcing Status"
          subtitle="Track creator selection progress with your assigned agency team"
        />

        <EmptyState
          icon={<AssignmentTurnedInRoundedIcon sx={{ fontSize: 40 }} />}
          title="Brief submission is not available yet"
          description="Requirements are not stored by the API, so briefs submitted here would not reach your agency. Send your requirements over chat and your agency will build the campaign for you."
          action={
            <Button
              variant="contained"
              startIcon={<ChatRoundedIcon fontSize="small" />}
              onClick={() => navigate('/chat')}
            >
              Message your agency
            </Button>
          }
        />
      </Box>
    </DashboardLayout>
  );
};
