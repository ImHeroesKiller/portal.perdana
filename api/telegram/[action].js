const { guardApi, RATE_LIMITS } = require('../_helpers/security');

async function handleMe(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'Telegram belum dikonfigurasi di server.' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    if (!data.ok) {
      return res.status(502).json({ error: 'Gagal mengambil info bot.' });
    }
    return res.status(200).json({
      ok: true,
      username: data.result?.username || null,
      first_name: data.result?.first_name || null,
    });
  } catch (err) {
    console.error('telegram/me error:', err);
    return res.status(500).json({ error: 'Gagal mengambil info bot.' });
  }
}

async function handleSendUser(req, res) {
  const { chatId, text } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(503).json({ error: 'Telegram belum dikonfigurasi di server.' });
  }

  if (!chatId || !text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Field chatId dan text wajib diisi.' });
  }

  if (text.length > 4096) {
    return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return res.status(200).json({ success: true });
    }
    return res.status(502).json({ error: 'Gagal mengirim pesan Telegram.' });
  } catch (err) {
    console.error('telegram/send-user error:', err);
    return res.status(500).json({ error: 'Gagal mengirim pesan Telegram.' });
  }
}

async function handleUpdates(req, res) {
  const { uniqueCode } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(503).json({ error: 'Telegram belum dikonfigurasi di server.' });
  }

  if (!uniqueCode || typeof uniqueCode !== 'string') {
    return res.status(400).json({ error: 'Field uniqueCode wajib diisi.' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();

    if (!data.ok || !Array.isArray(data.result)) {
      return res.status(200).json({ chatId: null });
    }

    const match = data.result.find(
      (update) =>
        update.message &&
        typeof update.message.text === 'string' &&
        update.message.text.includes(uniqueCode)
    );

    return res.status(200).json({
      chatId: match ? String(match.message.chat.id) : null,
    });
  } catch (err) {
    console.error('telegram/updates error:', err);
    return res.status(500).json({ error: 'Gagal membaca update Telegram.' });
  }
}

const ACTIONS = {
  me: { method: 'GET', rateLimit: RATE_LIMITS.dbRead, handler: handleMe },
  'send-user': { method: 'POST', rateLimit: RATE_LIMITS.telegram, requireOrigin: true, handler: handleSendUser },
  updates: { method: 'POST', rateLimit: RATE_LIMITS.telegram, requireOrigin: true, handler: handleUpdates },
};

module.exports = async function handler(req, res) {
  const action = req.query?.action;
  const config = ACTIONS[action];

  if (!config) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (!guardApi(req, res, { rateLimit: config.rateLimit, requireOrigin: config.requireOrigin })) return;

  if (req.method !== config.method) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return config.handler(req, res);
};