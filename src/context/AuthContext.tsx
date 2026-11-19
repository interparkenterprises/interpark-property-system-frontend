'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  UserWithAccess,
  PropertyAccess,
  PermissionCode,
  PortalEnvelope,
  resolveLandingRoute, // ── NEW ──
} from '@/types';
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
  requiresPasswordChange: boolean;

  // ── NEW: portal envelope + convenience flags ──
  portal: PortalEnvelope | null;
  accountStatus: User['accountStatus'] | null;
  isLandlord: boolean;
  isTenant: boolean;
  isServiceProvider: boolean;
  isPortalUser: boolean;
  // ─────────────────────────────────────────────

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

// Helper functions for cookie management
const setAuthCookie = (token: string) => {
  if (typeof document !== 'undefined') {
    // Set cookie that expires in 7 days
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
};

const removeAuthCookie = () => {
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

const getAuthCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

const PORTAL_ROLES = ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] as const;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserWithAccess | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessibleProperties, setAccessibleProperties] = useState<PropertyAccess[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  // ── NEW ──
  const [portal, setPortal] = useState<PortalEnvelope | null>(null);
  const [accountStatus, setAccountStatus] = useState<User['accountStatus'] | null>(null);
  // ────────
  const initRef = useRef(false);
  const initialCheckComplete = useRef(false);

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
      if (profile.permissions.length > 0 && typeof profile.permissions[0] === 'object') {
        return profile.permissions.map((p: any) => p.code || p);
      }
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

    if (profile.accessibleProperties && Array.isArray(profile.accessibleProperties)) {
      return convertToPropertyAccess(profile.accessibleProperties);
    }

    if (profile.currentAccess && profile.currentAccess.properties) {
      return convertToPropertyAccess(profile.currentAccess.properties);
    }

    if (profile.propertyAccess) {
      return convertToPropertyAccess(profile.propertyAccess);
    }

    return [];
  };

  // Extract role name from profile
  const extractRoleName = (profile: any): string | null => {
    if (!profile || typeof profile !== 'object') return null;

    if (profile.role && typeof profile.role === 'string') {
      return profile.role;
    }

    if (profile.currentAccess && profile.currentAccess.role) {
      return profile.currentAccess.role.name;
    }

    if (profile.roleName) return profile.roleName;
    if (profile.role && typeof profile.role === 'object') return profile.role.name;

    return null;
  };

  // ── NEW: detect the portal envelope from any profile shape ──
  const extractPortal = (profile: any): PortalEnvelope | null => {
    if (!profile || typeof profile !== 'object') return null;

    // Backend may return an explicit envelope
    if (profile.portal && typeof profile.portal === 'object' && 'portal' in profile.portal) {
      return profile.portal as PortalEnvelope;
    }

    if (
      profile.currentAccess &&
      profile.currentAccess.portal &&
      typeof profile.currentAccess.portal === 'object'
    ) {
      return profile.currentAccess.portal as PortalEnvelope;
    }

    // Fallback: derive from role if the backend only sends role
    if (typeof profile.role === 'string' && (PORTAL_ROLES as readonly string[]).includes(profile.role)) {
      return {
        portal: profile.role as PortalEnvelope['portal'],
        profileId:
          profile.landlordProfileId ??
          profile.tenantProfileId ??
          profile.serviceProviderProfileId ??
          null,
      };
    }

    return null;
  };

  // Build full user with RBAC data
  const buildUserWithAccess = useCallback(async (profile: any): Promise<UserWithAccess> => {
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid user profile received from API');
    }

    // ── NEW: portal detection happens BEFORE role coercion ──
    const portalEnvelope = extractPortal(profile);
    const isPortalUser = !!portalEnvelope?.portal;

    const userPermissions = isPortalUser ? [] : extractPermissions(profile);
    const propertyAccess = isPortalUser ? [] : extractPropertyAccess(profile);
    const extractedRoleName = isPortalUser
      ? portalEnvelope!.portal
      : extractRoleName(profile);

    const isManagedUserFlag =
      !isPortalUser &&
      (profile.isManagedUser === true || profile.currentAccess?.isManagedUser === true);

    const managedBy = profile.managedBy || profile.currentAccess?.managedBy || null;

    const requiresPasswordChangeFlag =
      profile.requiresPasswordChange === true ||
      profile.currentAccess?.requiresPasswordChange === true ||
      false;

    const extractedAccountStatus: User['accountStatus'] | null =
      profile.accountStatus ?? profile.currentAccess?.accountStatus ?? null;

    // ── Role determination (portal-aware) ──
    type StaffRole = 'ADMIN' | 'MANAGER' | 'USER';
    let userRole: StaffRole = 'USER';

    if (isPortalUser) {
      userRole = 'USER';
    } else if (profile.role === 'ADMIN') {
      userRole = 'ADMIN';
    } else if (profile.role === 'MANAGER') {
      userRole = 'MANAGER';
    } else if (profile.role === 'USER') {
      userRole = 'USER';
    } else if (profile.role && typeof profile.role === 'object' && profile.role.name) {
      if (profile.role.name === 'ADMIN') userRole = 'ADMIN';
      else if (profile.role.name === 'MANAGER') userRole = 'MANAGER';
      else userRole = 'USER';
    } else if (isManagedUserFlag) {
      userRole = 'USER';
    }

    const baseUser: UserWithAccess = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      // For portal users we keep the literal portal role so that
      // `user.role === 'LANDLORD'` works in legacy checks too.
      role: isPortalUser ? (portalEnvelope!.portal as any) : userRole,
      createdAt: profile.createdAt,
      permissions: userPermissions,
      propertyAccess: propertyAccess,
      isEnabled: profile.isEnabled !== false,
      roleName: extractedRoleName,
      isManagedUser: isManagedUserFlag,
      managedBy: managedBy?.id || managedBy,
      requiresPasswordChange: requiresPasswordChangeFlag,
      updatedAt: '',

      // ── NEW: portal identity + account status ──
      portal: portalEnvelope ?? undefined,
      accountStatus: extractedAccountStatus ?? undefined,
      landlordProfileId: profile.landlordProfileId ?? null,
      tenantProfileId: profile.tenantProfileId ?? null,
      serviceProviderProfileId: profile.serviceProviderProfileId ?? null,
      // ─────────────────────────────────────────
    };

    // ADMIN: full wildcard access
    if (userRole === 'ADMIN' && !isPortalUser) {
      baseUser.permissions = ['*'];
      baseUser.isEnabled = true;
      baseUser.roleName = 'Administrator';
      baseUser.isManagedUser = false;
      baseUser.propertyAccess = [];
      baseUser.requiresPasswordChange = false;
      return baseUser;
    }

    // MANAGER: broad default permissions
    if (userRole === 'MANAGER' && !isPortalUser) {
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
        PermissionCode.VIEW_PAYMENT_REPORTS,
        PermissionCode.RECORD_PAYMENTS,
        PermissionCode.VIEW_COMMISSIONS,
        PermissionCode.PROCESS_COMMISSIONS,
        PermissionCode.VIEW_OFFER_LETTERS,
        PermissionCode.CREATE_OFFER_LETTERS,
        PermissionCode.EDIT_OFFER_LETTERS,
        PermissionCode.DELETE_OFFER_LETTERS,
        PermissionCode.VIEW_DAILY_REPORTS,
        PermissionCode.CREATE_DAILY_REPORTS,
        PermissionCode.VIEW_ACTIVATION_REQUESTS,
        PermissionCode.CREATE_ACTIVATION_REQUEST,
        PermissionCode.EDIT_ACTIVATION_REQUEST,
        PermissionCode.DELETE_ACTIVATION_REQUEST,
        PermissionCode.VIEW_SERVICE_PROVIDERS,
        PermissionCode.CREATE_SERVICE_PROVIDER,
        PermissionCode.EDIT_SERVICE_PROVIDER,
        PermissionCode.DELETE_SERVICE_PROVIDER,
        PermissionCode.VIEW_BILLS,
        PermissionCode.CREATE_BILLS,
        PermissionCode.VIEW_DEMAND_LETTERS,
        PermissionCode.CREATE_DEMAND_LETTER,
        PermissionCode.DELETE_DAILY_REPORTS,
        PermissionCode.EDIT_DAILY_REPORTS,
        PermissionCode.MANAGE_USERS,
        PermissionCode.MANAGE_ROLES,
        PermissionCode.VIEW_LEADS,
        PermissionCode.CREATE_LEAD,
        PermissionCode.EDIT_LEAD,
        PermissionCode.DELETE_LEAD,
      ];
      baseUser.isEnabled = true;
      baseUser.roleName = 'Manager';
      baseUser.isManagedUser = false;
      baseUser.propertyAccess = [];
      baseUser.requiresPasswordChange = false;
      return baseUser;
    }

    // Portal users: no staff permissions / property access matrix
    if (isPortalUser) {
      baseUser.permissions = [];
      baseUser.propertyAccess = [];
    }

    return baseUser;
  }, []);

  // Optimized initialization - handles page refreshes properly
  useEffect(() => {
    if (initialCheckComplete.current) return;

    const init = async () => {
      const token = localStorage.getItem('token') || getAuthCookie();

      if (!token) {
        setIsLoading(false);
        initialCheckComplete.current = true;
        return;
      }

      try {
        const profile = await authAPI.getProfile();
        const fullUser = await buildUserWithAccess(profile);

        if (!fullUser.isEnabled) {
          router.push('/account-disabled');
          setIsLoading(false);
          initialCheckComplete.current = true;
          return;
        }

        setUser(fullUser);
        setPermissions(fullUser.permissions || []);
        setAccessibleProperties(fullUser.propertyAccess || []);
        setIsEnabled(fullUser.isEnabled ?? true);
        setRoleName(fullUser.roleName || null);
        setRequiresPasswordChange(fullUser.requiresPasswordChange || false);
        // ── NEW ──
        setPortal(fullUser.portal ?? null);
        setAccountStatus(fullUser.accountStatus ?? null);
        // ────────

        permissionCache.clear();
        if (fullUser.permissions) {
          fullUser.permissions.forEach(perm => {
            permissionCache.set(perm, true);
          });
        }

        // If user needs to change password and is not already on change-password page
        if (
          fullUser.requiresPasswordChange &&
          typeof window !== 'undefined' &&
          window.location.pathname !== '/change-password'
        ) {
          router.push('/change-password');
        }
      } catch (error: any) {
        if (
          error?.response?.status === 401 ||
          error?.message?.includes('Not authorized') ||
          error?.message?.includes('no token')
        ) {
          localStorage.removeItem('token');
          removeAuthCookie();
          setUser(null);
          setPortal(null);       // ── NEW ──
          setAccountStatus(null); // ── NEW ──
        }
      } finally {
        setIsLoading(false);
        initialCheckComplete.current = true;
      }
    };

    init();
  }, [buildUserWithAccess, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);

      localStorage.setItem('token', response.token);
      setAuthCookie(response.token);

      // Merge requiresPasswordChange from login response
      const requiresChange = response.requiresPasswordChange === true;

      const profile = await authAPI.getProfile();

      // ── NEW: merge portal from login response into profile ──
      // The login response is the authoritative source for `portal`
      // (getProfile might lag or omit it). Merging here guarantees the
      // envelope reaches buildUserWithAccess.
      const profileWithFlags = {
        ...profile,
        requiresPasswordChange: requiresChange || profile.requiresPasswordChange,
        portal: (response as any).portal ?? profile.portal,
      };

      const fullUser = await buildUserWithAccess(profileWithFlags);

      if (!fullUser.isEnabled) {
        router.push('/account-disabled');
        return;
      }

      setUser(fullUser);
      setPermissions(fullUser.permissions || []);
      setAccessibleProperties(fullUser.propertyAccess || []);
      setIsEnabled(fullUser.isEnabled ?? true);
      setRoleName(fullUser.roleName || null);
      setRequiresPasswordChange(fullUser.requiresPasswordChange || false);
      // ── NEW ──
      setPortal(fullUser.portal ?? null);
      setAccountStatus(fullUser.accountStatus ?? null);
      // ────────

      permissionCache.clear();
      if (fullUser.permissions) {
        fullUser.permissions.forEach(perm => {
          permissionCache.set(perm, true);
        });
      }

      // Password change gate first
      if (fullUser.requiresPasswordChange) {
        router.push('/change-password');
        return;
      }

      // ── NEW: portal-aware redirect ──
      const landing = resolveLandingRoute(fullUser);

      const stored = sessionStorage.getItem('redirectAfterLogin');
      const isPortal = !!fullUser.portal?.portal;
      const portalPrefix = isPortal
        ? `/${fullUser.portal!.portal!.toLowerCase()}`
        : null;

      const safeStored =
        stored &&
        stored !== '/login' &&
        stored !== '/unauthorized' &&
        (!portalPrefix || stored.startsWith(portalPrefix))
          ? stored
          : null;

      if (safeStored) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(safeStored);
      } else {
        router.push(landing);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const response = await authAPI.register(name, email, password, role);

    localStorage.setItem('token', response.token);
    setAuthCookie(response.token);

    const profile = await authAPI.getProfile();
    const fullUser = await buildUserWithAccess(profile);

    setUser(fullUser);
    setPermissions(fullUser.permissions || []);
    setAccessibleProperties(fullUser.propertyAccess || []);
    setIsEnabled(fullUser.isEnabled ?? true);
    setRoleName(fullUser.roleName || null);
    setRequiresPasswordChange(fullUser.requiresPasswordChange || false);
    // ── NEW ──
    setPortal(fullUser.portal ?? null);
    setAccountStatus(fullUser.accountStatus ?? null);
    // ────────

    // ── NEW: use resolver, portal-aware ──
    router.push(resolveLandingRoute(fullUser));
  };

  // Improved logout function that properly cleans up all state and storage
  const logout = () => {
    permissionCache.clear();
    propertiesCache.clear();

    sessionStorage.removeItem('redirectAfterLogin');

    setUser(null);
    setPermissions([]);
    setAccessibleProperties([]);
    setIsEnabled(true);
    setRoleName(null);
    setRequiresPasswordChange(false);
    // ── NEW ──
    setPortal(null);
    setAccountStatus(null);
    // ────────

    try {
      localStorage.removeItem('token');
    } catch {
      /* noop */
    }

    try {
      removeAuthCookie();
    } catch {
      /* noop */
    }

    setTimeout(() => {
      router.push('/login');
    }, 0);
  };

  const refreshAccess = async () => {
    const token = localStorage.getItem('token') || getAuthCookie();
    if (!token) return;

    try {
      const profile = await authAPI.getProfile();
      const fullUser = await buildUserWithAccess(profile);

      permissionCache.clear();

      setUser(fullUser);
      setPermissions(fullUser.permissions || []);
      setAccessibleProperties(fullUser.propertyAccess || []);
      setIsEnabled(fullUser.isEnabled ?? true);
      setRoleName(fullUser.roleName || null);
      setRequiresPasswordChange(fullUser.requiresPasswordChange || false);
      // ── NEW ──
      setPortal(fullUser.portal ?? null);
      setAccountStatus(fullUser.accountStatus ?? null);
      // ────────

      if (fullUser.permissions) {
        fullUser.permissions.forEach(perm => {
          permissionCache.set(perm, true);
        });
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as any).response;
        if (resp?.status === 401) {
          logout();
        }
      }
      throw err;
    }
  };

  const refreshUserData = async () => {
    await refreshAccess();
  };

  // Optimized permission helpers with caching
  const hasPermission = useCallback((code: string | string[]): boolean => {
    if (!permissions.length) return false;
    if (permissions.includes('*')) return true;

    const codes = Array.isArray(code) ? code : [code];

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
    // ── FIX: portal users are NOT managed staff ──
    isManagedUser: user?.isManagedUser === true && !portal?.portal,
    requiresPasswordChange,

    // ── NEW ──
    portal,
    accountStatus,
    isLandlord: portal?.portal === 'LANDLORD',
    isTenant: portal?.portal === 'TENANT',
    isServiceProvider: portal?.portal === 'SERVICE_PROVIDER',
    isPortalUser: !!portal?.portal,
    // ────────

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