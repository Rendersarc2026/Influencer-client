import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { DataTable, DataTableColumn, FilterBar } from '@molecules';
import { SectionHeading, StatusChip, MoneyText } from '@atoms';
import { useAdminCampaign, useAdminBrands, useAdminCampaignInfluencers } from '@api';
import { AgencyMapperResponse } from '@contracts';
import { useAuth, useDebounce } from '@hooks';
import { safeUrl } from '@utils';

interface AdminCampaignDetailOrganismProps {
  campaignId?: string;
}

export const AdminCampaignDetailOrganism: React.FC<AdminCampaignDetailOrganismProps> = ({
  campaignId: propCampaignId,
}) => {
  const theme = useTheme();
  const { id: routeCampaignId = '' } = useParams<{ id: string }>();
  const campaignId = propCampaignId || routeCampaignId;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: campaign, isLoading: campaignLoading } = useAdminCampaign(campaignId);
  const { data: brandsData } = useAdminBrands();
  const brands = brandsData?.items || [];
  const { data: mappersData, isLoading: mappersLoading } = useAdminCampaignInfluencers(campaignId, {
    search: debouncedSearch.trim() || undefined,
    page: page + 1,
    limit: rowsPerPage,
  });

  const mappers = mappersData?.items || [];
  const totalMappers = mappersData?.total ?? mappers.length;
  const brand = brands.find((b) => b.id === campaign?.brandId);

  const columns: Array<DataTableColumn<AgencyMapperResponse>> = [
    {
      id: 'creator',
      header: 'Creator',
      type: 'entity',
      accessor: (row) => row.influencerName || `Creator #${row.influencerId.slice(0, 8)}`,
      subAccessor: (row) => row.deliverables || 'Deliverables pending',
    },
    {
      id: 'deliverables',
      header: 'Deliverables',
      type: 'text',
      accessor: 'deliverables',
    },
    {
      id: 'influencerRate',
      header: 'Creator Rate',
      type: 'custom',
      render: (row) =>
        row.influencerRate !== null ? (
          <MoneyText amount={row.influencerRate} currency={row.currency} variant="body2" />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            Pending quote
          </Typography>
        ),
    },
    {
      id: 'margin',
      header: 'Agency Margin',
      type: 'custom',
      render: (row) =>
        row.margin !== null ? (
          <MoneyText
            amount={row.margin}
            currency={row.currency}
            variant="body2"
            color={theme.palette.tokens.accentText}
          />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            —
          </Typography>
        ),
    },
    {
      id: 'clientRate',
      header: 'Brand Rate',
      type: 'custom',
      render: (row) =>
        row.clientRate !== null ? (
          <MoneyText
            amount={row.clientRate}
            currency={row.currency}
            variant="body2"
            color={theme.palette.tokens.positiveText}
          />
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
            —
          </Typography>
        ),
    },
    {
      id: 'rateStatus',
      header: 'Rate Approval',
      type: 'custom',
      render: (row) => <StatusChip status={row.rateStatus} />,
    },
    {
      id: 'brandStatus',
      header: 'Brand Decision',
      type: 'custom',
      render: (row) => <StatusChip status={row.brandStatus} />,
    },
  ];

  return (
    <DashboardLayout
      title={campaign?.name || 'Campaign Details'}
      subtitle={`Brand: ${brand?.name || 'Platform Client'} · System-wide inspection`}
      navItems={navConfig.ADMIN}
      activePath="/admin/campaigns"
      user={{
        name: user?.profile?.fullName || 'Super Administrator',
        email: user?.email,
        roleCode: 'ADMIN',
      }}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Back Link */}
        <Box>
          <Button
            variant="text"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/admin/campaigns')}
            sx={{
              color: theme.palette.tokens.textSecondary,
              '&:hover': { color: theme.palette.tokens.textPrimary },
            }}
          >
            Back to Campaigns
          </Button>
        </Box>

        {/* Campaign Info Card */}
        <Card
          sx={{
            padding: '24px',
            borderRadius: `${theme.customRadii.card}px`,
            backgroundColor: theme.palette.tokens.surface,
            border: `1px solid ${theme.palette.tokens.divider}`,
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h2" sx={{ fontSize: '20px', fontWeight: 800, mb: 0.5 }}>
                {campaign?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary }}>
                Client Brand:{' '}
                <Box
                  component="span"
                  sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}
                >
                  {brand?.name || 'Brand Partner'}
                </Box>
              </Typography>
            </Box>

            {campaign && <StatusChip status={campaign.status} />}
          </Box>

          {campaign?.description && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.tokens.textSecondary, mb: 2, maxWidth: '800px' }}
            >
              {campaign.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', pt: 1 }}>
            <Typography variant="caption" sx={{ color: theme.palette.tokens.textSecondary }}>
              Timeline:{' '}
              <Box component="span" sx={{ fontWeight: 600, color: theme.palette.tokens.textPrimary }}>
                {campaign?.startDate
                  ? new Date(campaign.startDate).toLocaleDateString('en-IN')
                  : 'Flexible'}{' '}
                —{' '}
                {campaign?.endDate
                  ? new Date(campaign.endDate).toLocaleDateString('en-IN')
                  : 'Ongoing'}
              </Box>
            </Typography>

            {campaign?.briefUrl && (
              <Button
                variant="outlined"
                size="small"
                component="a"
                href={safeUrl(campaign.briefUrl)}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<LaunchRoundedIcon fontSize="small" />}
                sx={{ height: 32, fontSize: '13px' }}
              >
                Campaign Brief
              </Button>
            )}
          </Box>
        </Card>

        {/* Creator Roster Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionHeading
            title="Creator Roster & Commercial Pipeline"
            subtitle={`${totalMappers} creator${totalMappers === 1 ? '' : 's'} mapped to this campaign`}
          />

          <FilterBar
            searchValue={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(0);
            }}
            searchPlaceholder="Search mapped creators by name or handle..."
          />

          <DataTable<AgencyMapperResponse>
            columns={columns}
            rows={mappers}
            totalRows={totalMappers}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(limit) => {
              setRowsPerPage(limit);
              setPage(0);
            }}
            loading={mappersLoading || campaignLoading}
          />
        </Box>
      </Box>
    </DashboardLayout>
  );
};
