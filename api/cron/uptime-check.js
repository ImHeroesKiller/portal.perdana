const { captureError } = require('../_helpers/sentry');

const DEFAULT_BASE_URL = 'https://portal.perada.net';

async function sendTelegramAlert(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.warn('uptime-check: Telegram not configured, skipping alert');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return response.ok;
  } catch (error) {
    console.error('uptime-check: Telegram alert failed:', error);
    return false;
  }
}

function verifyCronAuth(req) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.VERCEL_ENV !== 'production';
  }
  const auth = typeof req.headers?.authorization === 'string' ? req.headers.authorization : '';
  return auth === `Bearer ${secret}`;
}

async function runCheck(name, url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const ok = response.ok && body?.ok === true;
    return { name, ok, status: response.status, body };
  } catch (error) {
    return { name, ok: false, error: error?.message || String(error) };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!verifyCronAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const baseUrl = (process.env.UPTIME_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const checks = await Promise.all([
    runCheck('ping', `${baseUrl}/api/ping`),
    runCheck('firebase-health', `${baseUrl}/api/firebase-health`),
  ]);

  const failed = checks.filter((check) => !check.ok);
  const allOk = failed.length === 0;
  const timestamp = new Date().toISOString();

  if (!allOk) {
    const lines = failed.map((check) => {
      if (check.error) return `- ${check.name}: ${check.error}`;
      return `- ${check.name}: HTTP ${check.status}`;
    });
    const message = [
      '🚨 Portal uptime alert',
      '',
      'Checks failed:',
      ...lines,
      '',
      `Time: ${timestamp}`,
      `Base URL: ${baseUrl}`,
    ].join('\n');

    await sendTelegramAlert(message);
    captureError(new Error('Uptime check failed'), { checks, baseUrl });
  }

  return res.status(allOk ? 200 : 503).json({
    ok: allOk,
    timestamp,
    baseUrl,
    checks: checks.map(({ name, ok, status, error }) => ({ name, ok, status, error })),
  });
};