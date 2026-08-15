import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useTheme } from '@mui/material/styles';

export const DashboardSkeleton: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.tokens.pageBg,
        padding: { xs: '8px 8px 80px 8px', sm: '12px 12px 88px 12px', md: '16px' },
        gap: { xs: 0, md: '20px' },
        position: 'relative',
      }}
    >
      {/* 1. Floating Sidebar Rail Placeholder */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          bottom: 16,
          left: 16,
          width: 72,
          backgroundColor: theme.palette.tokens.rail,
          borderRadius: `${theme.customRadii.rail}px`,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: 2,
          zIndex: 1200,
        }}
      >
        {/* Star Logo */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: `${theme.customRadii.inner}px`,
            backgroundColor: theme.palette.tints.butter,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <StarRoundedIcon sx={{ fontSize: '24px', color: theme.palette.tokens.rail }} />
        </Box>

        {/* Shimmering Navigation Icon Circles */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              animation="wave"
              variant="rounded"
              width={44}
              height={44}
              sx={{
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 2. Main White Content Surface */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.tokens.surface,
          borderRadius: { xs: `${theme.customRadii.inner}px`, md: `${theme.customRadii.card}px` },
          border: `1px solid ${theme.palette.tokens.divider}`,
          minHeight: { xs: 'calc(100vh - 88px)', md: 'calc(100vh - 32px)' },
          marginLeft: { xs: 0, md: '92px' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: { xs: '100%', md: 'calc(100% - 92px)' },
        }}
      >
        {/* TopBar Shimmer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: {
              xs: '12px 16px',
              sm: '16px 24px',
              md: '20px 32px',
            },
            borderBottom: `1px solid ${theme.palette.tokens.divider}`,
            minHeight: '80px',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Skeleton animation="wave" variant="text" width={180} height={28} />
            <Skeleton animation="wave" variant="text" width={260} height={18} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Skeleton animation="wave" variant="circular" width={40} height={40} />
            <Skeleton
              animation="wave"
              variant="rounded"
              width={120}
              height={40}
              sx={{ borderRadius: `${theme.customRadii.pill}px` }}
            />
          </Box>
        </Box>

        {/* Content Body Shimmer */}
        <Box
          sx={{
            padding: {
              xs: `${theme.customSpacing.cardPadding / 2}px`,
              sm: `${theme.customSpacing.cardPadding}px`,
            },
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: `${theme.customSpacing.cardGap}px`,
            overflowX: 'hidden',
          }}
        >
          {/* 4 Metric Shimmer Cards */}
          <Grid container spacing={2.5} alignItems="stretch">
            {['#EDE7FB', '#DEF2E5', '#FBF2D6', '#DCEAFA'].map((tintBg, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Card
                  sx={{
                    padding: `${theme.customSpacing.cardPadding}px`,
                    borderRadius: `${theme.customRadii.card}px`,
                    backgroundColor: tintBg,
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 140,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Skeleton animation="wave" variant="text" width="50%" height={20} />
                    <Skeleton
                      animation="wave"
                      variant="rounded"
                      width={36}
                      height={36}
                      sx={{ borderRadius: `${theme.customRadii.inner / 2}px` }}
                    />
                  </Box>
                  <Box sx={{ my: 0.5 }}>
                    <Skeleton
                      animation="wave"
                      variant="rounded"
                      width={90}
                      height={36}
                      sx={{ borderRadius: `${theme.customRadii.inner / 2}px` }}
                    />
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Skeleton animation="wave" variant="text" width="65%" height={16} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Table Shimmer Card */}
          <Card
            sx={{
              padding: `${theme.customSpacing.cardPadding}px`,
              borderRadius: `${theme.customRadii.card}px`,
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Skeleton animation="wave" variant="text" width={200} height={24} />
                <Skeleton animation="wave" variant="text" width={320} height={18} />
              </Box>
              <Skeleton
                animation="wave"
                variant="rounded"
                width={120}
                height={36}
                sx={{ borderRadius: `${theme.customRadii.pill}px` }}
              />
            </Box>

            {/* Table Rows Shimmer */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    height: 56,
                    borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                  }}
                >
                  <Skeleton animation="wave" variant="circular" width={36} height={36} />
                  <Skeleton animation="wave" variant="text" width="30%" height={24} />
                  <Skeleton animation="wave" variant="text" width="20%" height={24} />
                  <Skeleton animation="wave" variant="text" width="15%" height={24} />
                  <Box sx={{ ml: 'auto' }}>
                    <Skeleton
                      animation="wave"
                      variant="rounded"
                      width={80}
                      height={32}
                      sx={{ borderRadius: `${theme.customRadii.pill}px` }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
