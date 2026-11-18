import axios, { AxiosError } from 'axios';
import type { PersonnelLoginResult, PersonnelPortalProfile } from '@/types/personnelPortal';

const personnelClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export class PersonnelApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'PersonnelApiError';
    this.status = status;
  }
}

const requestError = (error: unknown, fallback: string): never => {
  if (axios.isAxiosError(error)) {
    const response = (error as AxiosError<{ message?: string }>).response;
    throw new PersonnelApiError(
      response?.data?.message || (error.request ? 'Unable to reach the Interpark server.' : fallback),
      response?.status || null
    );
  }
  throw new PersonnelApiError(fallback);
};

personnelClient.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    if (typeof window !== 'undefined'
      && (status === 401 || status === 403)
      && url.includes('/personnel-portal/')) {
      window.dispatchEvent(new CustomEvent('personnel-session-revoked'));
    }
    return Promise.reject(error);
  }
);

export const personnelAuthAPI = {
  getSession: async (): Promise<{ csrfToken: string; expiresAt: string }> => {
    try {
      const response = await personnelClient.get('/personnel-auth/session');
      return response.data.data;
    } catch (error) {
      return requestError(error, 'Unable to restore the personnel session.');
    }
  },
  login: async (email: string, password: string): Promise<PersonnelLoginResult> => {
    try {
      const response = await personnelClient.post('/personnel-auth/login', { email, password });
      return response.data.data;
    } catch (error) {
      return requestError(error, 'Unable to sign in.');
    }
  },
  logout: async (csrfToken: string): Promise<void> => {
    try {
      await personnelClient.post('/personnel-auth/logout', {}, {
        headers: { 'X-CSRF-Token': csrfToken }
      });
    } catch (error) {
      return requestError(error, 'Unable to end the personnel session.');
    }
  },
  activate: async (token: string, password: string): Promise<void> => {
    try {
      await personnelClient.post('/personnel-auth/activate', { token, password });
    } catch (error) {
      return requestError(error, 'Unable to activate the personnel account.');
    }
  },
  forgotPassword: async (email: string): Promise<string> => {
    try {
      const response = await personnelClient.post('/personnel-auth/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      return requestError(error, 'Unable to submit the password reset request.');
    }
  },
  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      await personnelClient.post('/personnel-auth/reset-password', { token, password });
    } catch (error) {
      return requestError(error, 'Unable to reset the personnel password.');
    }
  }
};

export const personnelPortalAPI = {
  getMe: async (): Promise<PersonnelPortalProfile> => {
    try {
      const response = await personnelClient.get('/personnel-portal/me');
      return response.data.data;
    } catch (error) {
      return requestError(error, 'Unable to load the personnel portal.');
    }
  }
};
