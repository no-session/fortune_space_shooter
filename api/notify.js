export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.NOTIFY_CHAT_ID || '6927192277';
  const action = req.body?.action || 'start';

  if (!botToken) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  const city = req.headers['x-vercel-ip-city'] || 'Unknown';
  const country = req.headers['x-vercel-ip-country'] || 'Unknown';

  const isMumbai = city.toLowerCase().includes('mumbai') ||
                   city.toLowerCase().includes('navi mumbai') ||
                   city.toLowerCase().includes('thane');

  if (action === 'start') {
    // Notify dad
    const dadMessage = isMumbai
      ? `🎮🇮🇳 Ridhaan is playing Fortune!\n📍 ${city}, India`
      : `🎮 Someone started playing Fortune!\n📍 ${city}, ${country}`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: dadMessage })
    }).catch(() => {});

    // Tell the game if this is from Mumbai
    return res.status(200).json({ ok: true, isMumbai });
  }

  if (action === 'confirm_ridhaan') {
    // Ridhaan confirmed — return the personal message
    return res.status(200).json({
      ok: true,
      message: "🌟 Hey Ridhaan! Dad sees you playing! Have fun and try to beat your high score! Love you champ! 💪🚀"
    });
  }

  res.status(200).json({ ok: true });
}
