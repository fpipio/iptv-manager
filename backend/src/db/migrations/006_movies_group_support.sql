-- Migration 006: Movies Group-Title Support
-- Adds group_title support for organizing movies by category
-- Movies will be organized as: /{output_dir}/{group_title}/{movie_name}/{movie_name}.strm

-- Add group_title column to movies table
ALTER TABLE movies ADD COLUMN group_title TEXT DEFAULT 'Uncategorized';

-- Create index for group_title filtering
CREATE INDEX IF NOT EXISTS idx_movies_group_title ON movies(group_title);
