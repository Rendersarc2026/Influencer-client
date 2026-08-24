import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

export interface LoadingBlockProps {
  variant?: 'card' | 'table' | 'text' | 'metric' | 'chart' | 'roster';
  rows?: number;
  height?: number | string;
  className?: string;
}

export const LoadingBlock: React.FC<LoadingBlockProps> = ({
  variant = 'card',
  rows = 4,
  height,
  className,
}) => {
  const theme = useTheme();

  if (variant === 'metric') {
    return (
      <Card
        className={className}
        sx={{
          padding: { xs: '12px', sm: '16px', md: `${theme.customSpacing.cardPadding}px` },
          borderRadius: `${theme.customRadii.card}px`,
          border: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
          height: height || '100%',
          minHeight: { xs: 115, sm: 130 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Skeleton animation="wave" variant="text" width="55%" height={18} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={32}
            height={32}
            sx={{ borderRadius: `${theme.customRadii.inner}px`, flexShrink: 0 }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, my: 0.5 }}>
          <Skeleton
            animation="wave"
            variant="rounded"
            width="50%"
            height={28}
            sx={{ borderRadius: '6px' }}
          />
        </Box>
        <Skeleton animation="wave" variant="text" width="65%" height={14} />
      </Card>
    );
  }

  if (variant === 'chart') {
    const minH = typeof height === 'number' ? height : 320;
    return (
      <Card
        className={className}
        sx={{
          padding: { xs: '16px', sm: '20px', md: `${theme.customSpacing.cardPadding}px` },
          borderRadius: `${theme.customRadii.card}px`,
          border: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
          minHeight: minH,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: '40%' }}>
            <Skeleton animation="wave" variant="text" width="80%" height={24} />
            <Skeleton animation="wave" variant="text" width="40%" height={32} />
          </Box>
          <Skeleton
            animation="wave"
            variant="rounded"
            width={140}
            height={32}
            sx={{ borderRadius: `${theme.customRadii.pill}px` }}
          />
        </Box>
        <Skeleton
          animation="wave"
          variant="rounded"
          width="100%"
          height={typeof height === 'number' ? height - 90 : 220}
          sx={{ borderRadius: `${theme.customRadii.inner}px`, flexGrow: 1, minHeight: 180 }}
        />
      </Card>
    );
  }

  if (variant === 'roster') {
    return (
      <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Card
            key={index}
            sx={{
              padding: { xs: '14px', sm: '20px' },
              borderRadius: `${theme.customRadii.card}px`,
              backgroundColor: theme.palette.tokens.surface,
              border: `1px solid ${theme.palette.tokens.divider}`,
              boxShadow: 'none',
              display: 'flex',
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            {/* Creator Bio Shimmer */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
              <Skeleton animation="wave" variant="circular" width={48} height={48} sx={{ flexShrink: 0 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0, flex: 1 }}>
                <Skeleton animation="wave" variant="text" width={140} height={20} />
                <Skeleton animation="wave" variant="text" width={220} height={16} />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={100}
                  height={22}
                  sx={{ borderRadius: `${theme.customRadii.pill}px` }}
                />
              </Box>
            </Box>

            {/* Deliverables Input Shimmer */}
            <Box
              sx={{
                width: { xs: '100%', sm: 320 },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Skeleton animation="wave" variant="text" width={130} height={14} />
              <Skeleton
                animation="wave"
                variant="rounded"
                width="100%"
                height={40}
                sx={{ borderRadius: `${theme.customRadii.inner}px` }}
              />
            </Box>

            {/* Action Button Shimmer */}
            <Skeleton
              animation="wave"
              variant="rounded"
              width={140}
              height={40}
              sx={{ borderRadius: `${theme.customRadii.inner}px`, flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'center' } }}
            />
          </Card>
        ))}
      </Box>
    );
  }

  if (variant === 'table') {
    return (
      <Card
        className={className}
        sx={{
          padding: { xs: '14px 12px', sm: '18px 16px', md: `${theme.customSpacing.cardPadding}px` },
          borderRadius: `${theme.customRadii.card}px`,
          border: `1px solid ${theme.palette.tokens.divider}`,
          backgroundColor: theme.palette.tokens.surface,
          minHeight: height || 420,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Skeleton animation="wave" variant="text" width={180} height={28} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={110}
            height={36}
            sx={{ borderRadius: `${theme.customRadii.inner}px` }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
            '&::-webkit-scrollbar': { width: 6, height: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.tokens.divider,
              borderRadius: 3,
            },
          }}
        >
          <Box sx={{ minWidth: 600, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Array.from({ length: rows }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  height: 52,
                  borderBottom: `1px solid ${theme.palette.tokens.divider}`,
                  py: 1,
                }}
              >
                <Skeleton animation="wave" variant="text" width={24} height={18} sx={{ flexShrink: 0 }} />
                <Skeleton animation="wave" variant="circular" width={34} height={34} sx={{ flexShrink: 0 }} />
                <Box sx={{ width: '25%', flexShrink: 0 }}>
                  <Skeleton animation="wave" variant="text" width="90%" height={18} />
                  <Skeleton animation="wave" variant="text" width="60%" height={12} />
                </Box>
                <Skeleton animation="wave" variant="text" width="20%" height={18} sx={{ flexShrink: 0 }} />
                <Skeleton animation="wave" variant="text" width="15%" height={18} sx={{ flexShrink: 0 }} />
                <Skeleton
                  animation="wave"
                  variant="rounded"
                  width={75}
                  height={24}
                  sx={{ borderRadius: `${theme.customRadii.pill}px`, ml: 'auto', flexShrink: 0 }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Card>
    );
  }

  if (variant === 'text') {
    return (
      <Box className={className} sx={{ width: '100%' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            animation="wave"
            variant="text"
            width={index === rows - 1 ? '60%' : '100%'}
            height={20}
            sx={{ mb: 1 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Card
      className={className}
      sx={{
        padding: `${theme.customSpacing.cardPadding}px`,
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px solid ${theme.palette.tokens.divider}`,
        backgroundColor: theme.palette.tokens.surface,
        height: height || 200,
      }}
    >
      <Skeleton animation="wave" variant="text" width="40%" height={28} sx={{ mb: 2 }} />
      <Skeleton
        animation="wave"
        variant="rounded"
        width="100%"
        height={80}
        sx={{ borderRadius: `${theme.customRadii.inner}px`, mb: 2 }}
      />
      <Skeleton animation="wave" variant="text" width="60%" height={18} />
    </Card>
  );
};
