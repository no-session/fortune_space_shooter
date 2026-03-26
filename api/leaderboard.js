export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Leaderboard not configured' });
  }

  const { action, name, score, wave, limit: queryLimit } = req.body || {};

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    if (action === 'submit') {
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'name and score required' });
      }

      // Store as JSON member with score as the sorted set score
      const member = JSON.stringify({ name, score, wave: wave || 0, ts: Date.now() });

      // ZADD fortune-leaderboard <score> <member>
      await fetch(`${url}/zadd/fortune-leaderboard/${score}/${encodeURIComponent(member)}`, {
        method: 'POST',
        headers
      });

      // Get player rank (ZREVRANK returns 0-based)
      const rankRes = await fetch(`${url}/zrevrank/fortune-leaderboard/${encodeURIComponent(member)}`, {
        method: 'GET',
        headers
      });
      const rankData = await rankRes.json();
      const playerRank = rankData.result !== null ? rankData.result + 1 : null;

      return res.status(200).json({ ok: true, playerRank });
    }

    if (action === 'top') {
      const count = Math.min(queryLimit || 10, 50);

      // ZREVRANGE with scores
      const rangeRes = await fetch(`${url}/zrevrange/fortune-leaderboard/0/${count - 1}/WITHSCORES`, {
        method: 'GET',
        headers
      });
      const rangeData = await rangeRes.json();
      const raw = rangeData.result || [];

      // Parse pairs: [member, score, member, score, ...]
      const scores = [];
      for (let i = 0; i < raw.length; i += 2) {
        try {
          const entry = JSON.parse(raw[i]);
          scores.push({
            name: entry.name,
            score: parseInt(raw[i + 1], 10),
            wave: entry.wave || 0
          });
        } catch {
          scores.push({
            name: '???',
            score: parseInt(raw[i + 1], 10),
            wave: 0
          });
        }
      }

      // Deduplicate by name (keep highest score per player)
      const bestByName = {};
      for (const entry of scores) {
        if (!bestByName[entry.name] || entry.score > bestByName[entry.name].score) {
          bestByName[entry.name] = entry;
        }
      }
      const deduped = Object.values(bestByName)
        .sort((a, b) => b.score - a.score)
        .slice(0, count);

      return res.status(200).json({ scores: deduped });
    }

    return res.status(400).json({ error: 'Invalid action. Use submit or top.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
