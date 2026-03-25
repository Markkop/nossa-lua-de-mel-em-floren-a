-- Karaoke tables (Neon project: karaoke). Applied via Neon MCP / console.

CREATE TABLE IF NOT EXISTS karaoke_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  song TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_karaoke_queue_sort ON karaoke_queue (sort_order);

CREATE TABLE IF NOT EXISTS karaoke_guest_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  song TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS karaoke_other_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
