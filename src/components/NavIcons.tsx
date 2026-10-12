import React from 'react';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

const SIZE = 24;

export function PrevIcon({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#prevClip)">
        <Path d="M21.2899 17.0198L19.5499 13.5398C19.0699 12.5698 19.0699 11.4398 19.5499 10.4698L21.2899 6.98983C22.7799 3.99983 19.5699 0.859829 16.6199 2.41983L15.0799 3.23983C14.8699 3.34983 14.6999 3.52983 14.5999 3.74983L8.89993 16.3898C8.66993 16.9098 8.87993 17.5198 9.37993 17.7798L16.6199 21.5898C19.5699 23.1498 22.7799 19.9998 21.2899 17.0198Z" fill={color} />
        <Path d="M7.69002 15.6004L11.42 7.32045C11.84 6.39045 10.84 5.45045 9.94002 5.93045L4.17002 8.96045C1.72002 10.2504 1.72002 13.7504 4.17002 15.0404L6.21002 16.1104C6.76002 16.4004 7.43002 16.1704 7.69002 15.6004Z" fill={color} />
      </G>
      <Defs>
        <ClipPath id="prevClip">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export function NextIcon({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#nextClip)">
        <Path d="M2.71008 17.0192L4.45008 13.5392C4.93008 12.5692 4.93008 11.4392 4.45008 10.4692L2.71008 6.97924C1.22008 3.99924 4.43008 0.849241 7.38008 2.40924L8.92008 3.22924C9.14008 3.33924 9.31008 3.51924 9.40008 3.73924L15.0901 16.3892C15.3201 16.9092 15.1101 17.5192 14.6101 17.7792L7.37008 21.5892C4.43008 23.1492 1.22008 19.9992 2.71008 17.0192Z" fill={color} />
        <Path d="M16.31 15.6004L12.58 7.32045C12.16 6.39045 13.16 5.45045 14.06 5.93045L19.83 8.97045C22.28 10.2604 22.28 13.7604 19.83 15.0504L17.79 16.1204C17.24 16.4004 16.57 16.1704 16.31 15.6004Z" fill={color} />
      </G>
      <Defs>
        <ClipPath id="nextClip">
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
