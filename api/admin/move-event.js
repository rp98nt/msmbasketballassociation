const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');
const { readJsonBody } = require('../lib/body');

function assertAdmin(req, res) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    applyCors(res);
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }
  if (req.method !== 'POST') {
    applyCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!assertAdmin(req, res)) return;

  try {
    const body = await readJsonBody(req);
    const id = (body.id || '').trim();
    if (!id) {
      applyCors(res);
      return res.status(400).json({ error: 'Missing id' });
    }

    const sql = getSql();
    const rows = await sql`
      SELECT image, title, time, description, link
      FROM upcoming_events
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      applyCors(res);
      return res.status(404).json({ error: 'Event not found' });
    }

    const e = rows[0];
    await sql`
      INSERT INTO past_events (image, title, time, description, link, recap_text, gallery_urls)
      VALUES (${e.image}, ${e.title}, ${e.time}, ${e.description}, ${e.link || ''}, '', '[]')
    `;
    await sql`DELETE FROM upcoming_events WHERE id = ${id}`;

    applyCors(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Server error' });
  }
};
