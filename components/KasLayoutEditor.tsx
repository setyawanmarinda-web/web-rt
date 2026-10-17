'use client';

import type { ReactNode } from 'react';
import { SortGroup } from '@/components/LayoutEdit';

export function KasEditProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function KasEditToggle() {
  return null;
}

export const KasSortGroup = SortGroup;
