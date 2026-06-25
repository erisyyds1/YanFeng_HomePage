import { VideoContent } from '../types';
import { API_BASE_URL } from './config';

export const fetchVideos = async (): Promise<VideoContent[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`);
    if (!response.ok) {
        throw new Error('Failed to fetch videos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

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
