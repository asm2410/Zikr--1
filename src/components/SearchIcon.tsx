import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SearchIconProps {
  size?: number;
  stroke?: string;
  fill?: string;
}

export function SearchIcon({ size = 24, stroke = '#fff', fill = 'none' }: SearchIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke={stroke}
        strokeWidth={1.5}
      />
      <Path
        d="M21.3001 22.0001C21.1201 22.0001 20.9401 21.9301 20.8101 21.8001L18.9501 19.9401C18.6801 19.6701 18.6801 19.2301 18.9501 18.9501C19.2201 18.6801 19.6601 18.6801 19.9401 18.9501L21.8001 20.8101C22.0701 21.0801 22.0701 21.5201 21.8001 21.8001C21.6601 21.9301 21.4801 22.0001 21.3001 22.0001Z"
        stroke={stroke}
        strokeWidth={1.5}
      />
    </Svg>
  );
}
