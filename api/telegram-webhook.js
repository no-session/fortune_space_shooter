import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const CHAT_KEY = 'fortune-chat-messages';
const ALLOWED_CHAT_ID = process.env.NOTIFY_CHAT_ID || '6927192277';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const update = req.body;
  const msg = update?.message;

  if (!msg || !msg.text) {
    return res.status(200).json({ ok: true });
  }

  // Only accept messages from Dad's chat
  const chatId = String(msg.chat?.id || '');
  if (chatId !== String(ALLOWED_CHAT_ID)) {
    return res.status(200).json({ ok: true });
  }

  // Store message in Redis (expires in 1 hour)
  const chatMessage = JSON.stringify({
    from: 'papa',
    text: msg.text,
    timestamp: Date.now()
  });

  await redis.rpush(CHAT_KEY, chatMessage).catch(() => {});
  await redis.expire(CHAT_KEY, 3600).catch(() => {}); // 1 hour TTL

  return res.status(200).json({ ok: true });
}
