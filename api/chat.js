import { readFileSync, writeFileSync } from 'fs';

const MESSAGES_FILE = '/tmp/chat-messages.json';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, message, from } = req.body || {};

  if (action === 'send') {
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.NOTIFY_CHAT_ID || '6927192277';

    if (!botToken) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const text = `💬 Ridhaan: ${message}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    }).catch(() => {});

    return res.status(200).json({ ok: true });
  }

  if (action === 'poll') {
    const messages = readMessages();
    // Clear after reading
    writeMessages([]);
    return res.status(200).json({ messages });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
