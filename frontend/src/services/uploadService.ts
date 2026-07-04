import type { ManagedImageCategory } from '../types';
import { getAdminAuthHeaders } from './adminAuth';
import { API_BASE_URL } from './config';

export interface UploadedImage {
  id: string;
  key?: string;
  url: string;
  filename: string;
  contentType: string;
  byteSize: number;
}

export type UploadImageCategory = ManagedImageCategory | 'thumbnail' | 'wechat';

export const uploadImageFile = async (file: File, category: UploadImageCategory): Promise<UploadedImage | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        ...getAdminAuthHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};
