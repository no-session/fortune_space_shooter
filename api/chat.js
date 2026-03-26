import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const CHAT_KEY = 'fortune-chat-messages';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, message } = req.body || {};

  if (action === 'send') {
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.NOTIFY_CHAT_ID || '6927192277';

    if (!botToken) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const text = '💬 Ridhaan: ' + message;

    await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  if (action === 'poll') {
    // Get all messages from Redis list
    const messages = await redis.lrange(CHAT_KEY, 0, -1).catch(() => []);
    
    // Clear after reading
    if (messages && messages.length > 0) {
      await redis.del(CHAT_KEY).catch(() => {});
    }

    return res.status(200).json({ messages: messages || [] });
  }

  res.status(200).json({ ok: true });
}
