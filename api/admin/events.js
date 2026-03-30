const { put } = require('@vercel/blob');
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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    applyCors(res);
    return res.status(503).json({
      error: 'BLOB_READ_WRITE_TOKEN is not configured. Add it in Vercel project settings.',
    });
  }

  try {
    const body = await readJsonBody(req);
    const image = body.image;
    const fileName = body.fileName || 'upload.jpg';
    const title = (body.title || '').trim();
    const time = (body.time || '').trim();
    const description = (body.description || '').trim();
    const link = (body.link || '').trim();

    if (!image || typeof image !== 'string' || !title || !time || !description) {
      applyCors(res);
      return res.status(400).json({ error: 'Missing image, title, time, or description' });
    }

    const m = /^data:([^;]+);base64,(.+)$/s.exec(image);
    if (!m) {
      applyCors(res);
      return res.status(400).json({ error: 'Image must be a base64 data URL' });
    }
    const buffer = Buffer.from(m[2], 'base64');
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `event_images/${Date.now()}-${safeName}`;

    const blob = await put(path, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const sql = getSql();
    const inserted = await sql`
      INSERT INTO upcoming_events (image, title, time, description, link)
      VALUES (${blob.url}, ${title}, ${time}, ${description}, ${link})
      RETURNING id::text AS id
    `;

    applyCors(res);
    return res.status(200).json({ ok: true, id: inserted[0].id });
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Server error' });
  }
};
