import React from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

export interface LoadingBlockProps {
  variant?: 'card' | 'table' | 'text' | 'metric' | 'chart';
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
          padding: `${theme.customSpacing.cardPadding}px`,
          height: height || 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton animation="wave" variant="text" width="40%" height={24} />
          <Skeleton animation="wave" variant="circular" width={32} height={32} />
        </Box>
        <Box>
          <Skeleton animation="wave" variant="text" width="60%" height={48} />
          <Skeleton animation="wave" variant="text" width="30%" height={18} />
        </Box>
      </Card>
    );
  }

  if (variant === 'chart') {
    return (
      <Card
        className={className}
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          height: height || 320,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ width: '40%' }}>
            <Skeleton animation="wave" variant="text" width="80%" height={28} />
            <Skeleton animation="wave" variant="text" width="40%" height={36} />
          </Box>
          <Skeleton
            animation="wave"
            variant="rounded"
            width={180}
            height={32}
            sx={{ borderRadius: `${theme.customRadii.pill}px` }}
          />
        </Box>
        <Skeleton
          animation="wave"
          variant="rounded"
          width="100%"
          height="100%"
          sx={{ borderRadius: `${theme.customRadii.inner}px`, flexGrow: 1 }}
        />
      </Card>
    );
  }

  if (variant === 'table') {
    return (
      <Card
        className={className}
        sx={{
          padding: `${theme.customSpacing.cardPadding}px`,
          minHeight: height || 420,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton animation="wave" variant="text" width={160} height={32} />
          <Skeleton
            animation="wave"
            variant="rounded"
            width={100}
            height={36}
            sx={{ borderRadius: `${theme.customRadii.pill}px` }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: rows }).map((_, index) => (
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
              <Skeleton animation="wave" variant="circular" width={32} height={32} />
              <Skeleton animation="wave" variant="text" width="25%" height={24} />
              <Skeleton animation="wave" variant="text" width="20%" height={24} />
              <Skeleton animation="wave" variant="text" width="15%" height={24} />
              <Skeleton
                animation="wave"
                variant="rounded"
                width={80}
                height={24}
                sx={{ borderRadius: `${theme.customRadii.pill}px` }}
              />
            </Box>
          ))}
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
            height={24}
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
        height: height || 200,
      }}
    >
      <Skeleton animation="wave" variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton
        animation="wave"
        variant="rounded"
        width="100%"
        height={80}
        sx={{ borderRadius: `${theme.customRadii.inner}px`, mb: 2 }}
      />
      <Skeleton animation="wave" variant="text" width="60%" height={20} />
    </Card>
  );
};
