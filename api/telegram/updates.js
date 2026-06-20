const { guardApi, RATE_LIMITS } = require('../_helpers/security');

module.exports = async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.telegram, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
};