import React from 'react';

type BoltShape = 'rect' | 'circle';

interface ElectricEffectProps {
  shape?: BoltShape;
  width?: number;
  height?: number;
  radius?: number;
  boltCount?: number;
  accent?: string;
  intensity?: 'light' | 'strong';
  trigger?: any;
}

export function ElectricEffect(_props: ElectricEffectProps) {
  return null;
}
