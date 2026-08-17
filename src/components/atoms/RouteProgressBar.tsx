import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export const RouteProgressBar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    // When location changes, trigger the page switch progress animation
    clearTimeouts();
    setVisible(true);
    setProgress(20);

    const t1 = window.setTimeout(() => {
      setProgress(60);
    }, 80);

    const t2 = window.setTimeout(() => {
      setProgress(90);
    }, 180);

    const t3 = window.setTimeout(() => {
      setProgress(100);
    }, 300);

    const t4 = window.setTimeout(() => {
      setVisible(false);
    }, 550);

    const t5 = window.setTimeout(() => {
      setProgress(0);
    }, 750);

    timeoutsRef.current = [t1, t2, t3, t4, t5];

    return () => {
      clearTimeouts();
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) {
    return null;
  }

  const accentColor = theme.palette.tokens.accent || '#2F80ED';

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 999999,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transition: 'opacity 250ms ease-in-out',
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${accentColor} 0%, #60A5FA 60%, #93C5FD 100%)`,
          boxShadow: `0 0 10px ${accentColor}, 0 0 5px ${accentColor}`,
          borderRadius: '0 2px 2px 0',
          transition: progress === 0 ? 'none' : 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </Box>
  );
};

export default RouteProgressBar;
