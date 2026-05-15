// components/Providers.tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionsProvider } from '@/app/providers/PermissionsProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PermissionsProvider>
        {children}
      </PermissionsProvider>
    </AuthProvider>
  );
}