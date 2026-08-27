import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '@hooks';
import { getRoleDashboardPath } from '@routes/navConfig';

export const NotFoundOrganism: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, roleCode } = useAuth();

  const handlePrimaryAction = () => {
    if (isAuthenticated && roleCode) {
      navigate(getRoleDashboardPath(roleCode));
    } else {
      navigate('/login');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      handlePrimaryAction();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
        backgroundColor: theme.palette.tokens.pageBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: {
          xs: `${theme.customSpacing.dialogPaddingMobile}px`,
          sm: `${theme.customSpacing.cardPadding}px`,
        },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          padding: {
            xs: `${theme.customSpacing.cardPaddingMobile}px`,
            sm: `${theme.customSpacing.cardPadding}px`,
          },
          borderRadius: `${theme.customRadii.card}px`,
          backgroundColor: theme.palette.tokens.surface,
          border: `1px solid ${theme.palette.tokens.divider}`,
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Search / Missing Icon */}
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: `${theme.customRadii.inner}px`,
            backgroundColor: theme.palette.tokens.fieldBg,
            color: theme.palette.tokens.accentText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <SearchOffRoundedIcon fontSize="large" />
        </Box>

        {/* 404 Status Pill */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: `${theme.customRadii.pill}px`,
            backgroundColor: theme.palette.tokens.accentBg,
            color: theme.palette.tokens.accentText,
            mb: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
            ERROR 404
          </Typography>
        </Box>

        {/* Heading & Subtext */}
        <Typography variant="h1" sx={{ mb: 1 }}>
          Page not found
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.tokens.textSecondary,
            maxWidth: 360,
            mb: 3.5,
          }}
        >
          The page you are looking for does not exist, has been removed, or is temporarily
          unavailable.
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1.5,
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="outlined"
            onClick={handleGoBack}
            startIcon={<ArrowBackRoundedIcon fontSize="small" />}
            sx={{ flex: 1 }}
          >
            Go Back
          </Button>

          <Button
            variant="contained"
            onClick={handlePrimaryAction}
            startIcon={<HomeRoundedIcon fontSize="small" />}
            sx={{ flex: 1 }}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Back to Login'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};
