const { guardApi, RATE_LIMITS } = require('../_helpers/security');

module.exports = async function handler(req, res) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.dbRead })) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
};