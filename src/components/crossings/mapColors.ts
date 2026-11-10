import type { Category, InspectionLevel } from '@/domain/types'

export type ColorMode = 'priority' | 'category'

/** Signal red only for P1, warning yellow only for P2. */
export const PRIORITY_COLOR: Record<InspectionLevel | 'none', string> = {
  P1: '#C8102E',
  P2: '#F2B705',
  P3: '#2F5D3A',
  none: '#5F656B',
}

export const CATEGORY_COLOR: Record<Category | 'none', string> = {
  A: '#1E3A5F',
  B: '#3D6A99',
  C: '#7D9CC0',
  D: '#B9BAB4',
  E: '#545A61',
  F: '#EDEDE8',
  none: '#FFFFFF',
}
