const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');

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
  if (req.method !== 'DELETE') {
    applyCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!assertAdmin(req, res)) return;

  const id = (req.query && req.query.id) || '';
  if (!id || typeof id !== 'string') {
    applyCors(res);
    return res.status(400).json({ error: 'Missing id query parameter' });
  }

  try {
    const sql = getSql();
    await sql`DELETE FROM past_events WHERE id = ${id}`;
    applyCors(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Server error' });
  }
};
