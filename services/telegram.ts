/** Telegram — all Bot API calls proxied through server (no token in client). */

export const sendTelegramMessage = async (chatId: string, text: string): Promise<boolean> => {
  if (!chatId || !text) return false;

  try {
    const response = await fetch('/api/telegram/send-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, text }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('Telegram Send Error:', error);
    return false;
  }
};

export const checkTelegramUpdatesForUser = async (uniqueCode: string): Promise<string | null> => {
  if (!uniqueCode) return null;

  try {
    const response = await fetch('/api/telegram/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniqueCode }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.chatId || null;
  } catch (error) {
    console.error('Telegram Update Error:', error);
    return null;
  }
};

let cachedBotInfo: { ok?: boolean; username?: string; first_name?: string } | null = null;

export const getBotInfo = async () => {
  if (cachedBotInfo) return cachedBotInfo;

  try {
    const response = await fetch('/api/telegram/me');
    if (!response.ok) return null;
    const data = await response.json();
    cachedBotInfo = data;
    return data;
  } catch {
    return null;
  }
};