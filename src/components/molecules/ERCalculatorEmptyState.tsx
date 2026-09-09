import React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useTheme } from '@mui/material/styles';

export interface ERCalculatorEmptyStateProps {
  className?: string;
}

export const ERCalculatorEmptyState: React.FC<ERCalculatorEmptyStateProps> = ({ className }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <VerifiedRoundedIcon sx={{ color: theme.palette.tokens.accent }} />,
      title: 'Official Meta Graph API',
      description:
        "Direct connection to Meta's Business Discovery endpoint for live, verified follower counts and media metrics.",
    },
    {
      icon: <CalculateRoundedIcon sx={{ color: theme.palette.tokens.positive }} />,
      title: 'Audited Trailing-10 Math',
      description:
        'Calculates authentic engagement from recent non-pinned posts by publish date, with candidate pool inspection.',
    },
    {
      icon: <SwapHorizRoundedIcon sx={{ color: theme.palette.tokens.purpleText }} />,
      title: 'Roster Commercial Sync',
      description:
        'Directly assign calculated engagement rates, committed views, and CPV to roster influencers or deliverables.',
    },
  ];

  return (
    <Paper
      elevation={0}
      className={className}
      sx={{
        p: { xs: 3, sm: 5 },
        borderRadius: `${theme.customRadii.card}px`,
        backgroundColor: theme.palette.tokens.surface,
        border: `1px dashed ${theme.palette.tokens.divider}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Emblem Icon */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: `${theme.customRadii.inner}px`,
          backgroundColor: theme.palette.tokens.fieldBg,
          border: `1px solid ${theme.palette.tokens.divider}`,
          color: theme.palette.tokens.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
        }}
      >
        <CalculateRoundedIcon sx={{ fontSize: 28 }} />
      </Box>

      {/* Main Heading & Description */}
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        No Profile Analyzed Yet
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: theme.palette.tokens.textSecondary,
          maxWidth: 540,
          mb: 4,
          lineHeight: 1.6,
        }}
      >
        Select an influencer from your roster or enter an Instagram handle above, then click{' '}
        <strong>Fetch Profile</strong> to calculate engagement rate, view recent posts, and project
        commercial CPV.
      </Typography>

      {/* Feature Value Propositions */}
      <Grid container spacing={2.5} sx={{ width: '100%', maxWidth: 900, textAlign: 'left' }}>
        {features.map((feature, idx) => (
          <Grid size={{ xs: 12, md: 4 }} key={idx}>
            <Box
              sx={{
                p: 2.5,
                height: '100%',
                borderRadius: `${theme.customRadii.inner}px`,
                backgroundColor: theme.palette.tokens.fieldBg,
                border: `1px solid ${theme.palette.tokens.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: `${theme.customRadii.inner - 4}px`,
                  backgroundColor: theme.palette.tokens.surface,
                  border: `1px solid ${theme.palette.tokens.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 0.5,
                }}
              >
                {feature.icon}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {feature.title}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: theme.palette.tokens.textSecondary, lineHeight: 1.5 }}
              >
                {feature.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};
