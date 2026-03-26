export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.NOTIFY_CHAT_ID || '6927192277';

  if (!botToken) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  // Vercel provides geo data in headers
  const city = req.headers['x-vercel-ip-city'] || 'Unknown';
  const country = req.headers['x-vercel-ip-country'] || 'Unknown';
  const region = req.headers['x-vercel-ip-country-region'] || '';

  const isMumbai = city.toLowerCase().includes('mumbai') || 
                   city.toLowerCase().includes('navi mumbai') ||
                   city.toLowerCase().includes('thane');

  let message;
  if (isMumbai) {
    message = `🎮🇮🇳 Ridhaan is playing Fortune!\n📍 ${city}, India\n\n🌟 Hey champ — Dad sees you playing! Have fun and try to beat your high score! 💪`;
  } else {
    message = `🎮 Someone started playing Fortune!\n📍 ${city}, ${country}`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
