import { SiteSettings } from '../types';
import { getAdminAuthHeaders } from './adminAuth';
import { API_BASE_URL } from './config';

export const fetchSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch site settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<SiteSettings | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/site-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update site settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating site settings:', error);
    return null;
  }
};
