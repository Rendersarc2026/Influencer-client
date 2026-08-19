import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps, Theme, useTheme } from '@mui/material/styles';

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  mb?: number | string;
  sx?: SxProps<Theme>;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  action,
  mb = 2,
  sx,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1, sm: 0 },
        width: '100%',
        mb,
        ...sx,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '18px', sm: '22px' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ flexShrink: 0, ml: { xs: 0, sm: 2 }, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          {action}
        </Box>
      )}
    </Box>
  );
};
