const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');

function parseGalleryUrls(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((u) => typeof u === 'string');
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw || '[]');
      return Array.isArray(p) ? p.filter((u) => typeof u === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

function isMissingRecapColumnsError(err) {
  const code = err && err.code;
  const msg = String((err && err.message) || '');
  if (code === '42703') return true;
  return /column .* does not exist/i.test(msg) && /recap_text|gallery_urls/i.test(msg);
}

function rowToEvent(row) {
  return {
    image: row.image,
    title: row.title,
    time: row.time,
    description: row.description,
    link: row.link || '',
    recapText: row.recap_text != null ? String(row.recap_text) : '',
    galleryUrls: parseGalleryUrls(row.gallery_urls),
  };
}

function rowsToKeyedEventObject(rows) {
  const out = {};
  for (const row of rows) {
    const id = String(row.id);
    out[id] = rowToEvent(row);
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
    const id = req.query && req.query.id ? String(req.query.id).trim() : '';

    if (id) {
      let rows;
      try {
        rows = await sql`
          SELECT id::text AS id, image, title, time, description, link, recap_text, gallery_urls
          FROM past_events
          WHERE id = ${id}::uuid
          LIMIT 1
        `;
      } catch (err) {
        if (!isMissingRecapColumnsError(err)) throw err;
        rows = await sql`
          SELECT id::text AS id, image, title, time, description, link
          FROM past_events
          WHERE id = ${id}::uuid
          LIMIT 1
        `;
        if (rows.length) {
          rows[0].recap_text = '';
          rows[0].gallery_urls = '[]';
        }
      }
      applyCors(res);
      if (!rows.length) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({ id: rows[0].id, ...rowToEvent(rows[0]) });
    }

    let rows;
    try {
      rows = await sql`
        SELECT id::text AS id, image, title, time, description, link, recap_text, gallery_urls
        FROM past_events
        ORDER BY created_at DESC
      `;
    } catch (err) {
      if (!isMissingRecapColumnsError(err)) throw err;
      rows = await sql`
        SELECT id::text AS id, image, title, time, description, link
        FROM past_events
        ORDER BY created_at DESC
      `;
      rows = rows.map((r) => ({
        ...r,
        recap_text: '',
        gallery_urls: '[]',
      }));
    }
    applyCors(res);
    return res.status(200).json(rowsToKeyedEventObject(rows));
  } catch (err) {
    console.error(err);
    applyCors(res);
    return res.status(500).json({ error: 'Database error' });
  }
};
