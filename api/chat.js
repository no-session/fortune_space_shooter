import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const CHAT_KEY = 'fortune-chat-messages';
const READ_INDEX_KEY = 'fortune-chat-read-index';

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

    // Store Ridhaan's message too (for history)
    const chatMessage = JSON.stringify({
      from: 'ridhaan',
      text: message,
      timestamp: Date.now()
    });
    await redis.rpush(CHAT_KEY, chatMessage).catch(() => {});
    await redis.expire(CHAT_KEY, 86400).catch(() => {}); // 24 hour TTL

    // Forward to Telegram
    const text = '💬 Ridhaan: ' + message;
    await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  if (action === 'poll') {
    // Get all messages
    const messages = await redis.lrange(CHAT_KEY, 0, -1).catch(() => []);

    // Get read index (how many Ridhaan has already seen)
    const readIndex = parseInt(await redis.get(READ_INDEX_KEY).catch(() => '0')) || 0;

    // Return only unread messages, but also include recent history on first load
    const allMessages = (messages || []).map(m => typeof m === 'string' ? JSON.parse(m) : m);
    const unread = allMessages.slice(readIndex);

    // Update read index
    if (allMessages.length > readIndex) {
      await redis.set(READ_INDEX_KEY, allMessages.length).catch(() => {});
      await redis.expire(READ_INDEX_KEY, 86400).catch(() => {});
    }

    return res.status(200).json({ messages: unread, total: allMessages.length });
  }

  if (action === 'history') {
    // Return full chat history (for when chat box opens)
    const messages = await redis.lrange(CHAT_KEY, 0, -1).catch(() => []);
    const allMessages = (messages || []).map(m => typeof m === 'string' ? JSON.parse(m) : m);

    // Mark all as read
    await redis.set(READ_INDEX_KEY, allMessages.length).catch(() => {});
    await redis.expire(READ_INDEX_KEY, 86400).catch(() => {});

    return res.status(200).json({ messages: allMessages });
  }

  res.status(200).json({ ok: true });
}
