-- Run once in Neon SQL Editor if `past_events` already exists without recap columns.

ALTER TABLE past_events ADD COLUMN IF NOT EXISTS recap_text TEXT NOT NULL DEFAULT '';
ALTER TABLE past_events ADD COLUMN IF NOT EXISTS gallery_urls TEXT NOT NULL DEFAULT '[]';
