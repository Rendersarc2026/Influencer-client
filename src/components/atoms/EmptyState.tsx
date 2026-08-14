import React, { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import { useTheme } from '@mui/material/styles';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  const theme = useTheme();

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: theme.palette.tokens.surface,
        borderRadius: `${theme.customRadii.card}px`,
        border: `1px dashed ${theme.palette.tokens.divider}`,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: `${theme.customRadii.inner}px`,
          backgroundColor: theme.palette.tokens.fieldBg,
          color: theme.palette.tokens.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          '& svg': {
            fontSize: '28px',
          },
        }}
      >
        {icon || <FolderOpenRoundedIcon />}
      </Box>

      <Typography variant="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.tokens.textSecondary,
            maxWidth: 380,
            mb: action ? 3 : 0,
          }}
        >
          {description}
        </Typography>
      )}

      {action && <Box sx={{ mt: description ? 0 : 2 }}>{action}</Box>}
    </Box>
  );
};
