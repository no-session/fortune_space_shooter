import { readFileSync, writeFileSync } from 'fs';

const MESSAGES_FILE = '/tmp/chat-messages.json';
const ALLOWED_CHAT_ID = process.env.NOTIFY_CHAT_ID || '6927192277';

function readMessages() {
  try {
    return JSON.parse(readFileSync(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeMessages(messages) {
  writeFileSync(MESSAGES_FILE, JSON.stringify(messages));
}

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
  const chatId = String(msg.chat?.id);
  if (chatId !== String(ALLOWED_CHAT_ID)) {
    return res.status(200).json({ ok: true });
  }

  const messages = readMessages();
  messages.push({
    from: 'papa',
    text: msg.text,
    timestamp: Date.now()
  });
  writeMessages(messages);

  return res.status(200).json({ ok: true });
}
