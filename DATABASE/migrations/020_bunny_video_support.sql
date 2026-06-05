-- Add Bunny.net video support to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bunny_video_id UUID;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS bunny_embed_url TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lessons_bunny_video_id ON lessons(bunny_video_id);
