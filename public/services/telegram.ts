
// Safe access to environment variables
const getEnv = (): any => {
    try {
        // @ts-ignore
        return (import.meta && import.meta.env) ? import.meta.env : {};
    } catch {
        return {};
    }
};

const env = getEnv();
const BOT_TOKEN = env.VITE_TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export const sendTelegramMessage = async (chatId: string, text: string): Promise<boolean> => {
    if (!BOT_TOKEN) {
        console.warn('Telegram Bot Token belum dikonfigurasi di .env');
        return false;
    }

    try {
        const response = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            }),
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Telegram Send Error:', error);
        return false;
    }
};

// Memory state caches for Telegram to avoid redundant heavy API integrations
let cachedBotInfo: any = null;
let lastUpdatesFetch: number = 0;
let cachedUpdatesResult: any[] | null = null;

// Helper to try and find the user's Chat ID based on recent updates
// This is a client-side workaround since we don't have a backend webhook
export const checkTelegramUpdatesForUser = async (uniqueCode: string): Promise<string | null> => {
    if (!BOT_TOKEN) return null;

    try {
        let result = cachedUpdatesResult;
        
        // Cache updates for 4 seconds to limit API load during rapid onboarding attempts
        if (!result || (Date.now() - lastUpdatesFetch > 4000)) {
            const response = await fetch(`${BASE_URL}/getUpdates`);
            const data = await response.json();
            if (data.ok && data.result) {
                cachedUpdatesResult = data.result;
                lastUpdatesFetch = Date.now();
                result = data.result;
            } else {
                return null;
            }
        }
        
        // Find a message that contains the unique code (e.g., "/start 12345")
        const match = result.find((update: any) => 
            update.message && 
            update.message.text && 
            update.message.text.includes(uniqueCode)
        );

        if (match) {
            return match.message.chat.id.toString();
        }
        return null;
    } catch (error) {
        console.error('Telegram Update Error:', error);
        return null;
    }
};

export const getBotInfo = async () => {
    if (!BOT_TOKEN) return null;
    if (cachedBotInfo) return cachedBotInfo;
    
    try {
        const response = await fetch(`${BASE_URL}/getMe`);
        const data = await response.json();
        if (data && data.ok) {
            cachedBotInfo = data;
        }
        return data;
    } catch (e) {
        return null;
    }
}
