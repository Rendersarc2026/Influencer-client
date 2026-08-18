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
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import MovieCreationRoundedIcon from '@mui/icons-material/MovieCreationRounded';
import CollectionsRoundedIcon from '@mui/icons-material/Collections';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import { DashboardLayout } from '@templates';
import { navConfig } from '@routes/navConfig';
import { SectionHeading } from '@atoms';
import { useAuth, useToast } from '@hooks';
import { apiClient } from '@api';

type MediaKind = 'REEL' | 'VIDEO' | 'CAROUSEL' | 'IMAGE';

interface AnalyzedPost {
  shortcode: string | null;
  permalink: string | null;
  thumbnailUrl: string | null;
  caption: string | null;
  mediaKind: MediaKind;
  takenAt: string;
  likes: number;
  comments: number;
  views: number | null;
  engagementRate: number;
}

interface ERProfile {
  fullName: string | null;
  profilePicUrl: string | null;
  biography: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  totalPosts: number | null;
}

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
  profile: ERProfile | null;
  posts: AnalyzedPost[];
}

const MEDIA_KIND_META: Record<MediaKind, { label: string; icon: React.ReactElement; color: string }> = {
  REEL: { label: 'Reel', icon: <MovieCreationRoundedIcon fontSize="inherit" />, color: '#9C27B0' },
  VIDEO: { label: 'Video', icon: <MovieCreationRoundedIcon fontSize="inherit" />, color: '#7E57C2' },
  CAROUSEL: { label: 'Carousel', icon: <CollectionsRoundedIcon fontSize="inherit" />, color: '#1976D2' },
  IMAGE: { label: 'Image', icon: <ImageRoundedIcon fontSize="inherit" />, color: '#607D8B' },
};

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
          label: 'Avg. Views (Reels)',
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
          {/* Profile Card */}
          {result.profile && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: `${theme.customRadii?.card ?? 16}px`,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <Avatar
                src={result.profile.profilePicUrl ?? undefined}
                alt={result.profile.fullName ?? result.instagramHandle}
                imgProps={{ referrerPolicy: 'no-referrer' }}
                sx={{ width: 72, height: 72 }}
              >
                {(result.profile.fullName ?? result.instagramHandle).charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {result.profile.fullName || `@${result.instagramHandle}`}
                  </Typography>
                  {result.profile.isVerified && (
                    <VerifiedRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                  )}
                  {result.profile.isPrivate && (
                    <Chip label="Private" size="small" color="warning" variant="outlined" />
                  )}
                </Box>

                <Link
                  href={`https://www.instagram.com/${result.instagramHandle}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  @{result.instagramHandle}
                  <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                </Link>

                {result.profile.biography && (
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary, mt: 0.5, whiteSpace: 'pre-line' }}
                  >
                    {result.profile.biography}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {[
                  { label: 'Followers', value: formatCount(result.followersCount) },
                  { label: 'Following', value: formatCount(result.followingCount) },
                  { label: 'Total Posts', value: formatCount(result.profile.totalPosts) },
                ].map((item) => (
                  <Box key={item.label} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

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

          {/* Analyzed Posts */}
          {result.posts.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: `${theme.customRadii?.card ?? 16}px`,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Analyzed Posts ({result.posts.length})
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  The latest {result.posts.length} posts by publish date. Pinned posts are excluded,
                  and average views count reels only.
                </Typography>
              </Box>

              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Post</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Likes</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Comments</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Views</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>ER %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.posts.map((post, index) => {
                      const meta = MEDIA_KIND_META[post.mediaKind];
                      return (
                        <TableRow key={post.shortcode ?? index} hover>
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                variant="rounded"
                                src={post.thumbnailUrl ?? undefined}
                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                sx={{ width: 44, height: 44, bgcolor: theme.palette.action.hover, color: meta.color }}
                              >
                                {meta.icon}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {post.caption || <em>No caption</em>}
                                </Typography>
                                {post.permalink && (
                                  <Link
                                    href={post.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="caption"
                                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                                  >
                                    View post
                                    <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                                  </Link>
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {new Date(post.takenAt).toLocaleDateString()}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={meta.label}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: meta.color, color: meta.color }}
                            />
                          </TableCell>

                          <TableCell align="right">{post.likes.toLocaleString()}</TableCell>
                          <TableCell align="right">{post.comments.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            {post.views === null ? '—' : post.views.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {post.engagementRate.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </DashboardLayout>
  );
};
