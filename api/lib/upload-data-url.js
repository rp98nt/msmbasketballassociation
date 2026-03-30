const { put } = require('@vercel/blob');

/**
 * Upload a base64 data URL to Vercel Blob. Returns public URL.
 */
async function uploadDataUrlToBlob(dataUrl, pathPrefix) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured');
  }
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) {
    throw new Error('Invalid image data URL');
  }
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 6 * 1024 * 1024) {
    throw new Error('Image too large (max 6MB)');
  }
  const ext = m[1].includes('png') ? 'png' : m[1].includes('webp') ? 'webp' : 'jpg';
  const safePrefix = String(pathPrefix || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '_');
  const path = `${safePrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const blob = await put(path, buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

module.exports = { uploadDataUrlToBlob };
