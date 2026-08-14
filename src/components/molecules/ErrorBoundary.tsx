import { Component, ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { EmptyState } from '@atoms';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 4,
            textAlign: 'center',
          }}
        >
          <EmptyState
            icon={<ErrorOutlineRoundedIcon sx={{ fontSize: 40, color: '#E05252' }} />}
            title="Something went wrong"
            description={
              this.state.error?.message ||
              'An unexpected application error occurred while rendering this view.'
            }
            action={
              <Button
                variant="contained"
                startIcon={<RefreshRoundedIcon fontSize="small" />}
                onClick={this.handleReload}
                sx={{ mt: 2 }}
              >
                Reload Page
              </Button>
            }
          />
        </Box>
      );
    }

    return this.props.children;
  }
}
