const { guardApi, RATE_LIMITS } = require('../_helpers/security');

module.exports = async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.telegram, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
};