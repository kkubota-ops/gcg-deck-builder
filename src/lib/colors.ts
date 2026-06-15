import type { CSSProperties } from 'react';

export const COLOR_HEX: Record<string, string> = {
  Blue:   '#3b82f6',
  Red:    '#ef4444',
  Green:  '#22c55e',
  Purple: '#a855f7',
  White:  '#e2e8f0',
  Yellow: '#eab308',
};

export function colorDotStyle(color: string): CSSProperties {
  return { backgroundColor: COLOR_HEX[color] ?? '#6b7280' };
}
