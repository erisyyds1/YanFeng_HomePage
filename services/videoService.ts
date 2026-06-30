import { VideoContent } from '../types';
import { API_BASE_URL } from './config';

export const addVideo = async (video: Omit<VideoContent, 'id'>): Promise<VideoContent | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
    });

    if (!response.ok) {
        throw new Error('Failed to add video');
    }
    return await response.json();
  } catch (error) {
    console.error('Error adding video:', error);
    return null;
  }
};

export const updateVideo = async (id: string, video: Omit<VideoContent, 'id'>): Promise<VideoContent | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
    });

    if (!response.ok) {
        throw new Error('Failed to update video');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating video:', error);
    return null;
  }
};

// Delete a video
export const deleteVideo = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting video:', error);
        return false;
    }
};
