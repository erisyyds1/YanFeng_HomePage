import { API_BASE_URL } from './config';

let currentConversationId: string | null = null;
const userId = getOrCreateUserId();

interface ChatApiResponse {
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  error?: string;
}

export const sendMessageToDify = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        conversation_id: currentConversationId,
        user: userId,
      }),
    });

    const data = (await response.json()) as ChatApiResponse;

    if (!response.ok) {
      throw new Error(data.error || data.answer || 'Chat API request failed');
    }
    
    if (data.conversation_id) {
      currentConversationId = data.conversation_id;
    }

    return data.answer || '抱歉，我暂时没有组织好答案，请换个问法再试试。';

  } catch (error) {
    console.error('Chat API Error:', error);
    return '连接社团 AI 服务失败，请稍后再试。';
  }
};

function getOrCreateUserId(): string {
  const key = 'yanfeng-chat-user-id';

  try {
    const existingId = window.localStorage.getItem(key);
    if (existingId) {
      return existingId;
    }

    const newId = `user-${crypto.randomUUID()}`;
    window.localStorage.setItem(key, newId);
    return newId;
  } catch {
    return `user-${Math.random().toString(36).slice(2)}`;
  }
}
