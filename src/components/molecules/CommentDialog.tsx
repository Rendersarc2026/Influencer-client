import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';

export interface CommentDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'neutral';
  loading?: boolean;
  minRows?: number;
  initialValue?: string;
  suggestions?: string[];
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

export const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  title,
  subtitle,
  label = 'Reason / Feedback',
  placeholder = 'Provide details or instructions...',
  confirmText = 'Submit Feedback',
  cancelText = 'Cancel',
  variant = 'neutral',
  loading = false,
  minRows = 3,
  initialValue = '',
  suggestions = [],
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const [comment, setComment] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setComment(initialValue);
      setTouched(false);
    }
  }, [open, initialValue]);

  const isValid = comment.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) {
      onConfirm(comment.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setComment(suggestion);
    setTouched(false);
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${theme.customRadii.card}px`,
            padding: '8px',
            backgroundImage: 'none',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h2" sx={{ fontSize: '20px' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.tokens.textSecondary, mt: '2px' }}
            >
              {subtitle}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {suggestions && suggestions.length > 0 && (
            <Box sx={{ mb: 2, mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.tokens.textSecondary,
                  fontWeight: 600,
                  display: 'block',
                  mb: 0.75,
                }}
              >
                Quick Suggestion Templates:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {suggestions.map((suggestion, idx) => (
                  <Chip
                    key={idx}
                    label={suggestion}
                    size="small"
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      backgroundColor:
                        comment === suggestion
                          ? theme.palette.tokens.accentBg
                          : theme.palette.tokens.fieldBg,
                      color:
                        comment === suggestion
                          ? theme.palette.tokens.accentText
                          : theme.palette.tokens.textPrimary,
                      border: `1px solid ${
                        comment === suggestion
                          ? theme.palette.primary.main
                          : theme.palette.tokens.divider
                      }`,
                      '&:hover': {
                        backgroundColor: theme.palette.tokens.accentBg,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ pt: 0.5 }}>
            <TextField
              multiline
              minRows={minRows}
              fullWidth
              label={label}
              placeholder={placeholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => setTouched(true)}
              error={touched && !isValid}
              helperText={touched && !isValid ? 'This field is required' : ''}
              disabled={loading}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="submit"
            variant={variant === 'destructive' ? 'contained' : 'dark'}
            disabled={loading || !isValid}
            sx={
              variant === 'destructive'
                ? {
                    backgroundColor: theme.palette.tokens.negative,
                    '&:hover': { backgroundColor: '#B91C1C' },
                  }
                : undefined
            }
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : confirmText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
