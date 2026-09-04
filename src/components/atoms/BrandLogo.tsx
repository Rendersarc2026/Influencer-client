import React from 'react';
import Box, { BoxProps } from '@mui/material/Box';
import { branding } from '@config/branding';

export interface BrandLogoProps extends Omit<BoxProps, 'component' | 'src' | 'alt'> {
  /** Rendered square size in px. */
  size?: number;
}

/**
 * The product logo. Sole reader of the configured logo image, so a rebrand
 * touches `.env` and nothing else.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 36, sx, ...rest }) => (
  <Box
    component="img"
    src={branding.logoUrl}
    alt={branding.name}
    sx={{
      width: size,
      height: size,
      objectFit: 'cover',
      flexShrink: 0,
      ...sx,
    }}
    {...rest}
  />
);
