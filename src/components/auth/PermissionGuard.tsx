import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  module?: keyof ReturnType<typeof usePermissions>['permissions'];
  action?: 'view' | 'create' | 'edit' | 'delete' | 'export';
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions: multiplePermissions,
  module,
  action = 'view',
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, permissions: modulePermissions } = usePermissions();

  let hasAccess = false;

  // Check by single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  
  // Check by multiple permissions (any)
  else if (multiplePermissions && multiplePermissions.length > 0) {
    hasAccess = hasPermission(multiplePermissions);
  }
  
  // Check by module and action
  else if (module && modulePermissions[module]) {
    const actionKey = action === 'view' ? 'canView' 
      : action === 'create' ? 'canCreate'
      : action === 'edit' ? 'canEdit'
      : action === 'delete' ? 'canDelete'
      : 'canExport';
    hasAccess = modulePermissions[module][actionKey];
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}