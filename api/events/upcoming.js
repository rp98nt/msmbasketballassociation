const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');

function rowsToKeyedEventObject(rows) {
  const out = {};
  for (const row of rows) {
    const id = String(row.id);
    out[id] = {
      image: row.image,
      title: row.title,
      time: row.time,
      description: row.description,
      link: row.link || '',
    };
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }
  if (req.method !== 'GET') {
    applyCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const sql = getSql();
    const rows = await sql`
      SELECT id::text AS id, image, title, time, description, link
      FROM upcoming_events
      ORDER BY created_at DESC
    `;
    applyCors(res);
    return res.status(200).json(rowsToKeyedEventObject(rows));
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Database error' });
  }
};
