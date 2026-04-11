ALTER TABLE karaoke_guest_songs ADD COLUMN artist TEXT NOT NULL DEFAULT '';
ALTER TABLE karaoke_guest_songs ADD COLUMN youtube_url TEXT NOT NULL DEFAULT '';
ALTER TABLE karaoke_queue ADD COLUMN artist TEXT NOT NULL DEFAULT '';
ALTER TABLE karaoke_queue ADD COLUMN youtube_url TEXT NOT NULL DEFAULT '';
