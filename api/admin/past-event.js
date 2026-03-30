const { getSql } = require('../lib/db');
const { applyCors, handleOptions } = require('../lib/cors');
const { readJsonBody } = require('../lib/body');
const { uploadDataUrlToBlob } = require('../lib/upload-data-url');

const MAX_RECAP = 12000;
const MAX_GALLERY = 40;

function assertAdmin(req, res) {
  const key = req.headers['x-admin-key'];
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    applyCors(res);
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method === 'PATCH') {
    if (!assertAdmin(req, res)) return;
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      applyCors(res);
      return res.status(503).json({
        error: 'BLOB_READ_WRITE_TOKEN is not configured. Add it in Vercel project settings.',
      });
    }

    try {
      const body = await readJsonBody(req);
      const id = (body.id || '').trim();
      const recapText =
        typeof body.recapText === 'string' ? body.recapText : body.recapText === null ? '' : '';

      if (!id) {
        applyCors(res);
        return res.status(400).json({ error: 'Missing id' });
      }
      if (recapText.length > MAX_RECAP) {
        applyCors(res);
        return res.status(400).json({ error: `Recap must be at most ${MAX_RECAP} characters` });
      }

      const existingGalleryUrls = Array.isArray(body.existingGalleryUrls)
        ? body.existingGalleryUrls.filter((u) => typeof u === 'string' && u.startsWith('http'))
        : [];

      const newItems = Array.isArray(body.newImages) ? body.newImages : [];
      if (existingGalleryUrls.length + newItems.length > MAX_GALLERY) {
        applyCors(res);
        return res.status(400).json({ error: `At most ${MAX_GALLERY} images total` });
      }

      const uploaded = [];
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        const dataUrl = typeof item === 'string' ? item : item && item.dataUrl;
        if (!dataUrl || typeof dataUrl !== 'string') continue;
        const fileName =
          typeof item === 'object' && item && item.fileName ? String(item.fileName) : `photo-${i}.jpg`;
        const url = await uploadDataUrlToBlob(dataUrl, `past_event_gallery/${id}`);
        uploaded.push(url);
      }

      const allUrls = [...existingGalleryUrls, ...uploaded].slice(0, MAX_GALLERY);
      const galleryJson = JSON.stringify(allUrls);

      const sql = getSql();
      const updated = await sql`
        UPDATE past_events
        SET recap_text = ${recapText}, gallery_urls = ${galleryJson}
        WHERE id = ${id}::uuid
        RETURNING id::text AS id
      `;

      if (!updated.length) {
        applyCors(res);
        return res.status(404).json({ error: 'Past event not found' });
      }

      applyCors(res);
      return res.status(200).json({ ok: true, id: updated[0].id, galleryUrls: allUrls });
    } catch (err) {
      console.error(err);
      applyCors(res);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  }

  if (req.method === 'GET') {
    if (!assertAdmin(req, res)) return;
    const id = (req.query && req.query.id) || '';
    if (!id || typeof id !== 'string') {
      applyCors(res);
      return res.status(400).json({ error: 'Missing id query parameter' });
    }
    try {
      const sql = getSql();
      const rows = await sql`
        SELECT id::text AS id, image, title, time, description, link, recap_text, gallery_urls
        FROM past_events
        WHERE id = ${id}::uuid
        LIMIT 1
      `;
      applyCors(res);
      if (!rows.length) {
        return res.status(404).json({ error: 'Not found' });
      }
      const r = rows[0];
      return res.status(200).json({
        id: r.id,
        image: r.image,
        title: r.title,
        time: r.time,
        description: r.description,
        link: r.link || '',
        recapText: r.recap_text != null ? String(r.recap_text) : '',
        galleryUrls: parseGalleryUrls(r.gallery_urls),
      });
    } catch (err) {
      console.error(err);
      applyCors(res);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    if (!assertAdmin(req, res)) return;

    const id = (req.query && req.query.id) || '';
    if (!id || typeof id !== 'string') {
      applyCors(res);
      return res.status(400).json({ error: 'Missing id query parameter' });
    }

    try {
      const sql = getSql();
      await sql`DELETE FROM past_events WHERE id = ${id}::uuid`;
      applyCors(res);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      applyCors(res);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  applyCors(res);
  return res.status(405).json({ error: 'Method not allowed' });
};
