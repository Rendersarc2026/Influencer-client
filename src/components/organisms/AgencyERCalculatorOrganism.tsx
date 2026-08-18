import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import InstagramIcon from '@mui/icons-material/Instagram';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { useAuth, useToast } from '@hooks';
import { apiClient } from '@api';

interface ERResult {
  instagramHandle: string;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  engagementRate: number;
  source: string;
  fetchedAt: string;
}

function formatCount(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toLocaleString();
}

export const AgencyERCalculatorOrganism: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout } = useAuth();
  const { showError } = useToast();

  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ERResult | null>(null);

  const handleCalculate = async () => {
    const trimmed = handle.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await apiClient.post<ERResult>('/er-calculator', {
        instagramHandle: trimmed,
      });
      setResult(res.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to calculate engagement rate';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = result
    ? [
        {
          label: 'Followers',
          value: formatCount(result.followersCount),
          icon: <PeopleAltRoundedIcon />,
          color: theme.palette.primary.main,
        },
        {
          label: 'Following',
          value: formatCount(result.followingCount),
          icon: <PersonAddRoundedIcon />,
          color: theme.palette.info.main,
        },
        {
          label: 'Posts Analyzed',
          value: formatCount(result.postsCount),
          icon: <PhotoLibraryRoundedIcon />,
          color: theme.palette.warning.main,
        },
        {
          label: 'Avg. Likes',
          value: formatCount(result.avgLikes),
          icon: <ThumbUpAltRoundedIcon />,
          color: '#E91E63',
        },
        {
          label: 'Avg. Comments',
          value: formatCount(result.avgComments),
          icon: <ChatBubbleRoundedIcon />,
          color: theme.palette.success.main,
        },
        {
          label: 'Avg. Views',
          value: formatCount(result.avgViews),
          icon: <VisibilityRoundedIcon />,
          color: '#9C27B0',
        },
      ]
    : [];

  return (
    <DashboardLayout
      navItems={navConfig.AGENCY}
      onNavigate={(path) => navigate(path)}
      onLogout={logout}
      title="ER Calculator"
    >
      <SectionHeading
        title="Engagement Rate Calculator"
        subtitle="Calculate engagement rate for any Instagram profile"
      />

      {/* Search Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: `${theme.customRadii?.card ?? 16}px`,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Enter Instagram handle or URL"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCalculate();
            }}
            size="small"
            sx={{ flex: 1, minWidth: 280 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <InstagramIcon sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleCalculate}
            disabled={loading || !handle.trim()}
            startIcon={loading ? <CircularProgress size={18} /> : <CalculateRoundedIcon />}
            sx={{ height: 40, px: 3 }}
          >
            {loading ? 'Calculating…' : 'Calculate'}
          </Button>
        </Box>
      </Paper>

      {/* Results Section */}
      {result && (
        <>
          {/* ER Score Card */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: `${theme.customRadii?.card ?? 16}px`,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              mb: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              @{result.instagramHandle}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: result.engagementRate > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
                fontSize: { xs: '48px', md: '64px' },
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {result.engagementRate.toFixed(2)}%
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Engagement Rate
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.disabled, mt: 1, display: 'block' }}
            >
              Source: {result.source.replace(/_/g, ' ')} •{' '}
              {new Date(result.fetchedAt).toLocaleString()}
            </Typography>
          </Paper>

          {/* Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                lg: 'repeat(6, 1fr)',
              },
              gap: 2,
            }}
          >
            {statCards.map((stat) => (
              <Paper
                key={stat.label}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${theme.customRadii?.card ?? 16}px`,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    color: stat.color,
                    mb: 1,
                    '& .MuiSvgIcon-root': { fontSize: 28 },
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {stat.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </DashboardLayout>
  );
};
