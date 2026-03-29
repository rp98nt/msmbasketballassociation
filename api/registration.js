const { getSql } = require('./lib/db');
const { applyCors, handleOptions } = require('./lib/cors');
const { readJsonBody } = require('./lib/body');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }
  if (req.method !== 'POST') {
    applyCors(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = await readJsonBody(req);
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const phone = (body.phone || '').trim();
    const event = (body.event || '').trim();
    if (!name || !email || !phone || !event) {
      applyCors(res);
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const sql = getSql();
    await sql`
      INSERT INTO registrations (name, email, phone, event)
      VALUES (${name}, ${email}, ${phone}, ${event})
    `;
    applyCors(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Server error' });
  }
};
