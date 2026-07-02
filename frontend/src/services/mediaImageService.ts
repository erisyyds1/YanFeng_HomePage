import { ManagedImageItem } from '../types';
import { getAdminAuthHeaders } from './adminAuth';
import { API_BASE_URL } from './config';

export const fetchManagedImages = async (): Promise<ManagedImageItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/media-images`);
    if (!response.ok) {
      throw new Error('Failed to fetch media images');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching media images:', error);
    return [];
  }
};

export const addManagedImage = async (image: Omit<ManagedImageItem, 'id'>): Promise<ManagedImageItem | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/media-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(image),
    });

    if (!response.ok) {
      throw new Error('Failed to add media image');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding media image:', error);
    return null;
  }
};

export const updateManagedImage = async (id: string, image: Omit<ManagedImageItem, 'id'>): Promise<ManagedImageItem | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/media-images/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(image),
    });

    if (!response.ok) {
      throw new Error('Failed to update media image');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating media image:', error);
    return null;
  }
};

export const deleteManagedImage = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/media-images/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        ...getAdminAuthHeaders(),
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting media image:', error);
    return false;
  }
};
