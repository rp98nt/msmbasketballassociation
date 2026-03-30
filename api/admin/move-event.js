const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');
const { readJsonBody } = require('../lib/body');

function assertAdmin(req, res) {
  const key = String(req.headers['x-admin-key'] || '').trim();
  const expected = String(process.env.ADMIN_API_KEY || '').trim();
  if (!expected || key !== expected) {
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
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (!rows.length) {
      applyCors(res);
      return res.status(404).json({ error: 'Event not found' });
    }

    const e = rows[0];
    // Omit recap columns so DBs without migration still accept the row (defaults apply when columns exist).
    await sql`
      INSERT INTO past_events (image, title, time, description, link)
      VALUES (${e.image}, ${e.title}, ${e.time}, ${e.description}, ${e.link || ''})
    `;
    await sql`DELETE FROM upcoming_events WHERE id = ${id}::uuid`;

    applyCors(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Server error' });
  }
};
