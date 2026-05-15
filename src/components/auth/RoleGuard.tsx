import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  roles: ('ADMIN' | 'MANAGER' | 'USER')[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const { isAdmin, isManager, isManagedUser } = useAuth();
  
  let hasRole = false;
  if (roles.includes('ADMIN') && isAdmin) hasRole = true;
  if (roles.includes('MANAGER') && isManager) hasRole = true;
  if (roles.includes('USER') && isManagedUser) hasRole = true;
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
}