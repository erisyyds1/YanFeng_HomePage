import type { WechatArticle } from '../types';
import { getAdminAuthHeaders } from './adminAuth';
import { API_BASE_URL } from './config';

export type WechatArticleInput = Omit<WechatArticle, 'id'>;

export interface ParsedWechatArticle {
  title?: string;
  summary?: string;
  coverUrl?: string;
  wechatUrl: string;
  publishedAt?: string;
}

export interface WechatArticleSyncResult {
  fetched: number;
  created: number;
  skipped: number;
  failed: number;
  errors?: string[];
}

export const fetchWechatArticles = async (includeDrafts = false): Promise<WechatArticle[]> => {
  try {
    const endpoint = includeDrafts ? '/wechat-articles/admin' : '/wechat-articles';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: includeDrafts ? getAdminAuthHeaders() : undefined
    });

    if (!response.ok) {
      throw new Error('Failed to fetch WeChat articles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching WeChat articles:', error);
    return [];
  }
};

export const parseWechatArticleUrl = async (wechatUrl: string): Promise<ParsedWechatArticle | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wechat-articles/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify({ wechatUrl })
    });

    if (!response.ok) {
      throw new Error('Failed to parse WeChat article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing WeChat article:', error);
    return null;
  }
};

export const addWechatArticle = async (article: WechatArticleInput): Promise<WechatArticle | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wechat-articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify(article)
    });

    if (!response.ok) {
      throw new Error('Failed to add WeChat article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding WeChat article:', error);
    return null;
  }
};

export const updateWechatArticle = async (id: string, article: WechatArticleInput): Promise<WechatArticle | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wechat-articles/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders()
      },
      body: JSON.stringify(article)
    });

    if (!response.ok) {
      throw new Error('Failed to update WeChat article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating WeChat article:', error);
    return null;
  }
};

export const deleteWechatArticle = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wechat-articles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting WeChat article:', error);
    return false;
  }
};

export const syncWechatArticles = async (): Promise<WechatArticleSyncResult | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/wechat-articles/sync`, {
      method: 'POST',
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to sync WeChat articles');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing WeChat articles:', error);
    return null;
  }
};
