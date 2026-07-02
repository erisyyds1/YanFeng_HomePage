import { API_BASE_URL } from './config';

const ADMIN_TOKEN_STORAGE_KEY = 'yanfeng-admin-token';

export type AdminSessionResult = 'accepted' | 'rejected' | 'unavailable';

interface AdminLoginResponse {
  token?: string;
  expiresAt?: number;
  configured?: boolean;
}

export const requestAdminSession = async (message: string): Promise<AdminSessionResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (response.status === 401) {
      clearAdminSession();
      return 'rejected';
    }

    if (!response.ok) {
      return 'unavailable';
    }

    const data = (await response.json()) as AdminLoginResponse;
    if (data.configured === false) {
      return 'unavailable';
    }

    if (data.token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
    }

    return 'accepted';
  } catch (error) {
    console.warn('Admin session request failed:', error);
    return 'unavailable';
  }
};

export const getAdminAuthHeaders = (): Record<string, string> => {
  try {
    const token = window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const clearAdminSession = () => {
  try {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage failures in private browsing modes.
  }
};
