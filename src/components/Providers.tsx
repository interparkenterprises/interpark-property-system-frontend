// components/Providers.tsx
'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { PermissionsProvider } from '@/app/providers/PermissionsProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PermissionsProvider>
        {children}
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              borderColor: 'var(--border)',
            },
          }}
        />
      </PermissionsProvider>
    </AuthProvider>
  );
}
