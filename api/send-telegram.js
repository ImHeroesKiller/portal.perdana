const { guardApi, RATE_LIMITS } = require('./_helpers/security');
const { wrapHandler, captureError } = require('./_helpers/sentry');

async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.telegram, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body || {};
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(503).json({ error: 'Telegram belum dikonfigurasi di server.' });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: "Field 'message' wajib diisi." });
  }

  if (message.length > 4096) {
    return res.status(400).json({ error: 'Pesan terlalu panjang.' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    const data = await response.json();
    if (data.ok) {
      return res.status(200).json({ success: true });
    }
    return res.status(502).json({ error: 'Gagal mengirim pesan Telegram.' });
  } catch (err) {
    console.error('send-telegram error:', err);
    captureError(err, { route: 'send-telegram' });
    return res.status(500).json({ error: 'Gagal mengirim pesan Telegram.' });
  }
}

module.exports = wrapHandler(handler);