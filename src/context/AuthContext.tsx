'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserWithAccess, PropertyAccess, PermissionCode } from '@/types';
import { authAPI, managedUsersAPI, propertiesAPI } from '@/lib/api';

interface AuthContextType {
  user: UserWithAccess | null;
  userId: string | null;
  permissions: string[];
  accessibleProperties: PropertyAccess[];
  isEnabled: boolean;
  roleName: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isManagedUser: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshAccess: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  hasPermission: (code: string | string[]) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  
  canViewProperty: (propertyId: string) => boolean;
  canEditProperty: (propertyId: string) => boolean;
  canDeleteProperty: (propertyId: string) => boolean;
  canExportProperty: (propertyId: string) => boolean;
  getAccessiblePropertyIds: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Cache for permissions and properties
const permissionCache = new Map<string, boolean>();
const propertiesCache = new Map<string, any>();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserWithAccess | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessibleProperties, setAccessibleProperties] = useState<PropertyAccess[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  // Helper to convert accessibleProperties from API response to PropertyAccess format
  const convertToPropertyAccess = (accessibleProps: any[] | string[]): PropertyAccess[] => {
    if (!accessibleProps || !Array.isArray(accessibleProps)) return [];
    
    // If it's already in PropertyAccess format (with id, canView, canEdit, etc.)
    if (accessibleProps.length > 0 && typeof accessibleProps[0] === 'object' && 'id' in accessibleProps[0]) {
      return accessibleProps.map(prop => ({
        id: prop.id,
        name: prop.name || '',
        isActive: prop.isActive !== false,
        canView: prop.canView === true,
        canEdit: prop.canEdit === true,
        canDelete: prop.canDelete === true,
        canExport: prop.canExport === true,
        grantedAt: prop.grantedAt || new Date().toISOString(),
        expiresAt: prop.expiresAt || null
      }));
    }
    
    // If it's just an array of strings (property IDs)
    if (accessibleProps.length > 0 && typeof accessibleProps[0] === 'string') {
      return (accessibleProps as string[]).map(id => ({
        id,
        name: '',
        isActive: true,
        canView: true,
        canEdit: false,
        canDelete: false,
        canExport: false,
        grantedAt: new Date().toISOString(),
        expiresAt: null
      }));
    }
    
    return [];
  };

  // Extract permissions from role or direct permissions array
  const extractPermissions = (profile: any): string[] => {
    if (!profile || typeof profile !== 'object') return [];
    
    // Handle the login response format (permissions at root level)
    if (profile.permissions && Array.isArray(profile.permissions)) {
      // Check if it's an array of permission objects or strings
      if (profile.permissions.length > 0 && typeof profile.permissions[0] === 'object') {
        return profile.permissions.map((p: any) => p.code || p);
      }
      // Handle array of strings (like your login response)
      return profile.permissions;
    }
    
    // If profile has role with permissions
    if (profile.role && profile.role.permissions) {
      if (Array.isArray(profile.role.permissions)) {
        if (profile.role.permissions.length > 0 && typeof profile.role.permissions[0] === 'object') {
          return profile.role.permissions.map((p: any) => p.code || p);
        }
        return profile.role.permissions;
      }
    }
    
    // If profile has currentAccess with role and permissions (from getProfile response)
    if (profile.currentAccess && profile.currentAccess.role && profile.currentAccess.role.permissions) {
      const rolePermissions = profile.currentAccess.role.permissions;
      if (Array.isArray(rolePermissions)) {
        if (rolePermissions.length > 0 && typeof rolePermissions[0] === 'object') {
          return rolePermissions.map((p: any) => p.code || p);
        }
        return rolePermissions;
      }
    }
    
    return [];
  };

  // Extract property access from profile
  const extractPropertyAccess = (profile: any): PropertyAccess[] => {
    if (!profile || typeof profile !== 'object') return [];
    
    // Handle login response format (accessibleProperties array of strings)
    if (profile.accessibleProperties && Array.isArray(profile.accessibleProperties)) {
      return convertToPropertyAccess(profile.accessibleProperties);
    }
    
    // Check for properties in currentAccess (from getProfile response)
    if (profile.currentAccess && profile.currentAccess.properties) {
      return convertToPropertyAccess(profile.currentAccess.properties);
    }
    
    // Check for propertyAccess
    if (profile.propertyAccess) {
      return convertToPropertyAccess(profile.propertyAccess);
    }
    
    return [];
  };

  // Extract role name from profile
  const extractRoleName = (profile: any): string | null => {
    if (!profile || typeof profile !== 'object') return null;
    
    // Handle login response format (role as string)
    if (profile.role && typeof profile.role === 'string') {
      return profile.role;
    }
    
    // Handle currentAccess format
    if (profile.currentAccess && profile.currentAccess.role) {
      return profile.currentAccess.role.name;
    }
    
    // Handle other formats
    if (profile.roleName) return profile.roleName;
    if (profile.role && typeof profile.role === 'object') return profile.role.name;
    
    return null;
  };

  // Build full user with RBAC data
  const buildUserWithAccess = useCallback(async (profile: any): Promise<UserWithAccess> => {
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid user profile received from API');
    }
    
    // Extract data from profile (which may come from login response or getProfile)
    const userPermissions = extractPermissions(profile);
    const propertyAccess = extractPropertyAccess(profile);
    const extractedRoleName = extractRoleName(profile);
    const isManagedUserFlag = profile.isManagedUser === true || profile.currentAccess?.isManagedUser === true;
    const managedBy = profile.managedBy || profile.currentAccess?.managedBy || null;
    const requiresPasswordChange = profile.requiresPasswordChange || false;
    
    // Determine user role - handle both login and getProfile response formats
    let userRole: 'ADMIN' | 'MANAGER' | 'USER' = 'USER';
    if (profile.role === 'ADMIN') {
      userRole = 'ADMIN';
    } else if (profile.role === 'MANAGER') {
      userRole = 'MANAGER';
    } else if (profile.role === 'USER') {
      userRole = 'USER';
    } else if (profile.role && typeof profile.role === 'object' && profile.role.name) {
      // Handle case where role is an object with a name property
      if (profile.role.name === 'ADMIN') userRole = 'ADMIN';
      else if (profile.role.name === 'MANAGER') userRole = 'MANAGER';
      else userRole = 'USER';
    } else if (isManagedUserFlag) {
      userRole = 'USER';
    } else if (typeof profile.role === 'string' && ['ADMIN', 'MANAGER', 'USER'].includes(profile.role)) {
      userRole = profile.role as 'ADMIN' | 'MANAGER' | 'USER';
    } else {
      userRole = 'USER';
    }

    const baseUser: UserWithAccess = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: userRole,
      createdAt: profile.createdAt,
      permissions: userPermissions,
      propertyAccess: propertyAccess,
      isEnabled: profile.isEnabled !== false,
      roleName: extractedRoleName,
      isManagedUser: isManagedUserFlag,
      managedBy: managedBy?.id || managedBy,
      requiresPasswordChange: requiresPasswordChange,
      updatedAt: ''
    };

    // ADMIN: full wildcard access
    if (userRole === 'ADMIN') {
      baseUser.permissions = ['*'];
      baseUser.isEnabled = true;
      baseUser.roleName = 'Administrator';
      baseUser.isManagedUser = false;
      baseUser.propertyAccess = [];
      return baseUser;
    }

    // MANAGER: broad default permissions
    if (userRole === 'MANAGER') {
      baseUser.permissions = [
        PermissionCode.VIEW_PROPERTIES,
        PermissionCode.CREATE_PROPERTY,
        PermissionCode.EDIT_PROPERTY,
        PermissionCode.DELETE_PROPERTY,
        PermissionCode.VIEW_UNITS,
        PermissionCode.CREATE_UNIT,
        PermissionCode.EDIT_UNIT,
        PermissionCode.DELETE_UNIT,
        PermissionCode.VIEW_TENANTS,
        PermissionCode.CREATE_TENANT,
        PermissionCode.EDIT_TENANT,
        PermissionCode.DELETE_TENANT,
        PermissionCode.VIEW_TENANT_FINANCIALS,
        PermissionCode.VIEW_INVOICES,
        PermissionCode.CREATE_INVOICES,
        PermissionCode.EDIT_INVOICES,
        PermissionCode.VIEW_PAYMENT_REPORTS,
        PermissionCode.RECORD_PAYMENTS,
        PermissionCode.VIEW_COMMISSIONS,
        PermissionCode.PROCESS_COMMISSIONS,
        PermissionCode.VIEW_OFFER_LETTERS,
        PermissionCode.CREATE_OFFER_LETTERS,
        PermissionCode.VIEW_DAILY_REPORTS,
        PermissionCode.CREATE_DAILY_REPORTS,
        PermissionCode.VIEW_ACTIVATION_REQUESTS,
        PermissionCode.CREATE_ACTIVATION_REQUEST,
        PermissionCode.VIEW_SERVICE_PROVIDERS,
        PermissionCode.CREATE_SERVICE_PROVIDER,
        PermissionCode.VIEW_BILLS,
        PermissionCode.CREATE_BILLS,
        PermissionCode.VIEW_DEMAND_LETTERS,
        PermissionCode.CREATE_DEMAND_LETTERS,
        PermissionCode.MANAGE_USERS,
        PermissionCode.MANAGE_ROLES,
      ];
      baseUser.isEnabled = true;
      baseUser.roleName = 'Manager';
      baseUser.isManagedUser = false;
      baseUser.propertyAccess = [];
      return baseUser;
    }

    return baseUser;
  }, []);

  // Optimized initialization - single API call for profile
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Single API call to get profile with all necessary data
        const profile = await authAPI.getProfile();
        const fullUser = await buildUserWithAccess(profile);
        
        if (!fullUser.isEnabled) {
          router.push('/account-disabled');
          setIsLoading(false);
          return;
        }
        
        // Set all user data at once
        setUser(fullUser);
        setPermissions(fullUser.permissions || []);
        setAccessibleProperties(fullUser.propertyAccess || []);
        setIsEnabled(fullUser.isEnabled ?? true);
        setRoleName(fullUser.roleName || null);
        
        // Pre-cache permissions for faster access
        permissionCache.clear();
        if (fullUser.permissions) {
          fullUser.permissions.forEach(perm => {
            permissionCache.set(perm, true);
          });
        }
        
      } catch (error) {
        console.error('Auth init error:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [buildUserWithAccess, router]);

  const login = async (email: string, password: string) => {
    try {
      // Login returns user data with permissions and property access
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.token);

      // FIX: handle both response shapes: { token, user: {...} } and { token, ...userFields }
      let profile = response.user;
      if (!profile) {
        // If login response doesn't include user object, fetch it separately
        profile = await authAPI.getProfile();
      }

      const fullUser = await buildUserWithAccess(profile);

      if (!fullUser.isEnabled) {
        router.push('/account-disabled');
        return;
      }

      // Set all user data at once
      setUser(fullUser);
      setPermissions(fullUser.permissions || []);
      setAccessibleProperties(fullUser.propertyAccess || []);
      setIsEnabled(fullUser.isEnabled ?? true);
      setRoleName(fullUser.roleName || null);
      
      // Pre-cache permissions
      permissionCache.clear();
      if (fullUser.permissions) {
        fullUser.permissions.forEach(perm => {
          permissionCache.set(perm, true);
        });
      }

      // Redirect to dashboard immediately - no additional API calls needed
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const response = await authAPI.register(name, email, password, role);
    localStorage.setItem('token', response.token);

    const profile = await authAPI.getProfile();
    const fullUser = await buildUserWithAccess(profile);

    setUser(fullUser);
    setPermissions(fullUser.permissions || []);
    setAccessibleProperties(fullUser.propertyAccess || []);
    setIsEnabled(fullUser.isEnabled ?? true);
    setRoleName(fullUser.roleName || null);

    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions([]);
    setAccessibleProperties([]);
    setIsEnabled(true);
    setRoleName(null);
    permissionCache.clear();
    propertiesCache.clear();
    router.push('/login');
  };

  const refreshAccess = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const profile = await authAPI.getProfile();
      const fullUser = await buildUserWithAccess(profile);
      
      // Clear caches before updating
      permissionCache.clear();
      
      setUser(fullUser);
      setPermissions(fullUser.permissions || []);
      setAccessibleProperties(fullUser.propertyAccess || []);
      setIsEnabled(fullUser.isEnabled ?? true);
      setRoleName(fullUser.roleName || null);
      
      // Re-cache new permissions
      if (fullUser.permissions) {
        fullUser.permissions.forEach(perm => {
          permissionCache.set(perm, true);
        });
      }
      
      console.log('User access refreshed successfully', {
        permissions: fullUser.permissions?.length,
        properties: fullUser.propertyAccess?.length
      });
    } catch (err) {
      console.error('Refresh access failed:', err);
      throw err;
    }
  };

  // New method: refreshUserData - alias for refreshAccess with better naming
  const refreshUserData = async () => {
    await refreshAccess();
  };

  // Optimized permission helpers with caching
  const hasPermission = useCallback((code: string | string[]): boolean => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;
    
    const codes = Array.isArray(code) ? code : [code];
    
    // Check cache first
    for (const c of codes) {
      if (permissionCache.has(c)) {
        if (permissionCache.get(c)) return true;
        continue;
      }
      
      const hasPerm = permissions.includes(c);
      permissionCache.set(c, hasPerm);
      if (hasPerm) return true;
    }
    
    return false;
  }, [permissions]);

  const hasAnyPermission = useCallback((codes: string[]): boolean => {
    return codes.some(c => hasPermission(c));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((codes: string[]): boolean => {
    return codes.every(c => hasPermission(c));
  }, [hasPermission]);

  // Property access helpers
  const canViewProperty = useCallback((propertyId: string): boolean => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') return true;
    const prop = accessibleProperties.find(p => p.id === propertyId);
    return prop?.isActive && prop?.canView ? true : false;
  }, [user, accessibleProperties]);

  const canEditProperty = useCallback((propertyId: string): boolean => {
    if (user?.role === 'ADMIN') return true;
    const prop = accessibleProperties.find(p => p.id === propertyId);
    return prop?.isActive && prop?.canEdit ? true : false;
  }, [user, accessibleProperties]);

  const canDeleteProperty = useCallback((propertyId: string): boolean => {
    if (user?.role === 'ADMIN') return true;
    const prop = accessibleProperties.find(p => p.id === propertyId);
    return prop?.isActive && prop?.canDelete ? true : false;
  }, [user, accessibleProperties]);

  const canExportProperty = useCallback((propertyId: string): boolean => {
    const prop = accessibleProperties.find(p => p.id === propertyId);
    return prop?.isActive && prop?.canExport ? true : false;
  }, [accessibleProperties]);

  const getAccessiblePropertyIds = useCallback((): string[] => {
    return accessibleProperties
      .filter(p => p.isActive && p.canView)
      .map(p => p.id);
  }, [accessibleProperties]);

  const value: AuthContextType = {
    user,
    userId: user?.id || null,
    permissions,
    accessibleProperties,
    isEnabled,
    roleName,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    isManagedUser: user?.isManagedUser === true || user?.role === 'USER',
    login,
    register,
    logout,
    refreshAccess,
    refreshUserData,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewProperty,
    canEditProperty,
    canDeleteProperty,
    canExportProperty,
    getAccessiblePropertyIds,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};