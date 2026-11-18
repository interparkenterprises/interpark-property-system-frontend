'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PersonnelApiError, personnelAuthAPI, personnelPortalAPI } from '@/lib/personnelPortalApi';
import { PERSONNEL_CSRF_STORAGE_KEY } from '@/lib/personnelSecurity';
import type { PersonnelLoginResult, PersonnelPortalProfile } from '@/types/personnelPortal';

interface PersonnelAuthContextValue {
  profile: PersonnelPortalProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionError: string | null;
  login: (email: string, password: string) => Promise<PersonnelLoginResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<PersonnelPortalProfile | null>;
}

const PersonnelAuthContext = createContext<PersonnelAuthContextValue | undefined>(undefined);

const readCsrf = () => typeof window === 'undefined'
  ? ''
  : sessionStorage.getItem(PERSONNEL_CSRF_STORAGE_KEY) || '';

export function PersonnelAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<PersonnelPortalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(pathname === '/personnel');
  const [sessionError, setSessionError] = useState<string | null>(null);

  const clearSession = useCallback((message?: string) => {
    setProfile(null);
    setSessionError(message || null);
    if (typeof window !== 'undefined') sessionStorage.removeItem(PERSONNEL_CSRF_STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const nextProfile = await personnelPortalAPI.getMe();
      setProfile(nextProfile);
      setSessionError(null);
      return nextProfile;
    } catch (error) {
      if (error instanceof PersonnelApiError && (error.status === 401 || error.status === 403)) {
        clearSession('Your personnel session has expired or access is no longer enabled.');
        return null;
      }
      setSessionError(error instanceof Error ? error.message : 'Unable to reach the Interpark server.');
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    if (pathname !== '/personnel') return;
    let active = true;
    Promise.all([personnelPortalAPI.getMe(), personnelAuthAPI.getSession()])
      .then(([nextProfile, session]) => {
        if (active) {
          sessionStorage.setItem(PERSONNEL_CSRF_STORAGE_KEY, session.csrfToken);
          setProfile(nextProfile);
          setSessionError(null);
        }
      })
      .catch(error => {
        if (!active) return;
        if (error instanceof PersonnelApiError && (error.status === 401 || error.status === 403)) {
          setProfile(null);
          setSessionError('Your personnel session has expired or access is no longer enabled.');
          sessionStorage.removeItem(PERSONNEL_CSRF_STORAGE_KEY);
        } else {
          setSessionError(error instanceof Error ? error.message : 'Unable to reach the Interpark server.');
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const revoked = () => {
      clearSession('Your personnel session has expired or access is no longer enabled.');
      router.replace('/personnel/login');
    };
    window.addEventListener('personnel-session-revoked', revoked);
    return () => window.removeEventListener('personnel-session-revoked', revoked);
  }, [clearSession, router]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await personnelAuthAPI.login(email, password);
    sessionStorage.setItem(PERSONNEL_CSRF_STORAGE_KEY, result.csrfToken);
    const nextProfile = await personnelPortalAPI.getMe();
    setProfile(nextProfile);
    setSessionError(null);
    return result;
  }, []);

  const logout = useCallback(async () => {
    const csrfToken = readCsrf();
    try {
      if (!csrfToken) throw new PersonnelApiError('The session security token is unavailable. Please sign in again.', 403);
      await personnelAuthAPI.logout(csrfToken);
    } finally {
      clearSession();
      router.replace('/personnel/login');
    }
  }, [clearSession, router]);

  const value = useMemo<PersonnelAuthContextValue>(() => ({
    profile,
    isLoading,
    isAuthenticated: Boolean(profile),
    sessionError,
    login,
    logout,
    refreshProfile
  }), [profile, isLoading, sessionError, login, logout, refreshProfile]);

  return <PersonnelAuthContext.Provider value={value}>{children}</PersonnelAuthContext.Provider>;
}

export const usePersonnelAuth = () => {
  const context = useContext(PersonnelAuthContext);
  if (!context) throw new Error('usePersonnelAuth must be used inside PersonnelAuthProvider');
  return context;
};
