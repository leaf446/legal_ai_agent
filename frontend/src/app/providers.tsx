'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommandPalette } from '@/components/shared/CommandPalette';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return (
    <AuthProvider>
      {children}
      <CommandPalette />
    </AuthProvider>
  );
}

export default AppProviders;
