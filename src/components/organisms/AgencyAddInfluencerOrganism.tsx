import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { FilterBar } from '@molecules';
import { SectionHeading, EmptyState } from '@atoms';
import { useAgencyCampaign, useCampaignInfluencers, useAddInfluencerToCampaign } from '@api';
import { useAuth, useToast } from '@hooks';
import { safeImageUrl } from '@utils';
import { AgencyMapperResponse } from '@contracts';

interface AvailableCreator {
  id: string;
  name: string;
  handle: string;
  category: string;
  followers: string;
  avatarUrl?: string;
}

const availableCreators: AvailableCreator[] = [];

export const AgencyAddInfluencerOrganism: React.FC = () => {
  const theme = useTheme();
  const { id: campaignId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: campaign } = useAgencyCampaign(campaignId);
  const { data: currentMappersData } = useCampaignInfluencers(campaignId);
  const currentMappers: AgencyMapperResponse[] = currentMappersData?.items || [];
  const addInfluencerMutation = useAddInfluencerToCampaign(campaignId);

  const [search, setSearch] = useState('');
  const [deliverablesMap, setDeliverablesMap] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Existing assigned IDs
  const assignedIds = new Set([
    ...currentMappers.map((m) => m.influencerId),
    ...Array.from(addedIds),
  ]);

  const filteredCreators = availableCreators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddCreator = async (creatorId: string) => {
    const deliverables = deliverablesMap[creatorId] || '1x Instagram Reel + 2x Stories';
    try {
      await addInfluencerMutation.mutateAsync({
        influencerId: creatorId,
        deliverables,
      });
      showSuccess('Influencer assigned to campaign roster.');
      setAddedIds((prev) => new Set([...prev, creatorId]));
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showError(errorObj?.response?.data?.message || errorObj?.message || 'Failed to assign influencer.');
    }
  };

  return (
    <DashboardLayout
      title="Add Influencers to Campaign"
      subtitle={
        campaign ? `Assigning creators to ${campaign.name}` : 'Creator assignment directory'
      }
      navItems={navConfig.AGENCY}
      activePath={location.pathname}
      user={{
        name: user?.profile?.fullName || 'Agency Manager',
        email: user?.email,
        roleCode: 'AGENCY',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      rightAction={
        <Button
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          onClick={() => navigate(`/agency/campaigns/${campaignId}`)}
        >
          Back to Campaign
        </Button>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search creators by name, handle, or category..."
        />

        <SectionHeading
          title="Platform Creator Network"
          subtitle="Select creators and specify required campaign deliverables"
        />

        {filteredCreators.length === 0 && (
          <EmptyState
            icon={<PersonSearchRoundedIcon sx={{ fontSize: 40 }} />}
            title="Creator directory unavailable"
            description="Assigning creators needs a directory endpoint on the API. Nothing is listed here rather than showing placeholder creators that cannot be assigned."
          />
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredCreators.map((creator) => {
            const isAssigned = assignedIds.has(creator.id);
            const isPending =
              addInfluencerMutation.isPending &&
              addInfluencerMutation.variables?.influencerId === creator.id;

            return (
              <Card
                key={creator.id}
                sx={{
                  padding: '20px',
                  borderRadius: `${theme.customRadii.card}px`,
                  backgroundColor: theme.palette.tokens.surface,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 3,
                  flexWrap: 'wrap',
                }}
              >
                {/* Creator Bio */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260 }}>
                  <Avatar
                    src={safeImageUrl(creator.avatarUrl)}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: theme.palette.tokens.rail,
                      color: theme.palette.tints.butter,
                      fontWeight: 700,
                    }}
                  >
                    {creator.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {creator.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.textSecondary, display: 'block' }}
                    >
                      {creator.handle} · {creator.followers} followers
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.tokens.accent, fontWeight: 600 }}
                    >
                      {creator.category}
                    </Typography>
                  </Box>
                </Box>

                {/* Deliverables Input */}
                <Box sx={{ flex: 1, minWidth: 240 }}>
                  <TextField
                    size="small"
                    label="Requested Deliverables"
                    placeholder="e.g. 1x Reel + 2x Stories"
                    value={deliverablesMap[creator.id] ?? '1x Instagram Reel + 2x Stories'}
                    onChange={(e) =>
                      setDeliverablesMap({ ...deliverablesMap, [creator.id]: e.target.value })
                    }
                    disabled={isAssigned || isPending}
                    fullWidth
                  />
                </Box>

                {/* Add Action */}
                <Box sx={{ minWidth: 160, display: 'flex', justifyContent: 'flex-end' }}>
                  {isAssigned ? (
                    <Button
                      variant="outlined"
                      disabled
                      startIcon={<CheckRoundedIcon fontSize="small" />}
                      sx={{
                        color: theme.palette.tokens.positive,
                        borderColor: theme.palette.tokens.divider,
                      }}
                    >
                      Assigned
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<PersonAddRoundedIcon fontSize="small" />}
                      onClick={() => handleAddCreator(creator.id)}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Add to Campaign'
                      )}
                    </Button>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      </Box>
    </DashboardLayout>
  );
};
