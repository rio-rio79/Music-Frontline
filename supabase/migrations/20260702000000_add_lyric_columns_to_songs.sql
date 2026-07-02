-- Add lyricist, composer, and lyrics columns to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyricist TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS composer TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS lyrics TEXT;
