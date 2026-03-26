export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple rate limiting via cooldown header check (optional)
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.NOTIFY_CHAT_ID || '6927192277';

  if (!botToken) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🎮 Ridhaan just started playing Fortune!',
        parse_mode: 'HTML'
      })
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
