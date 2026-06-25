import { NewsItem } from '../types';
import { API_BASE_URL } from './config';

interface ArticlesEnvelope {
  data?: {
    list?: NewsItem[];
  };
}

export const fetchWeChatArticles = async (): Promise<NewsItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = (await response.json()) as NewsItem[] | ArticlesEnvelope;
    if (Array.isArray(data)) {
      return data;
    }

    return data.data?.list || [];
  } catch (error) {
    console.error('Failed to fetch WeChat articles:', error);
    return [];
  }
};
