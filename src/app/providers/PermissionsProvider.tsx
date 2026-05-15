// providers/PermissionsProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermission';

type PermissionsContextType = ReturnType<typeof usePermissions>;

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const permissions = usePermissions();
  
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function useGlobalPermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('useGlobalPermissions must be used within PermissionsProvider');
  }
  return context;
}