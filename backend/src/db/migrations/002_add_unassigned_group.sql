-- Migration: Add special "Unassigned Channels" group
-- This group is used for channels without a proper group assignment
-- It should always exist and cannot be deleted

-- Add is_special column to group_titles
-- This marks groups that have special behavior (like Unassigned)
ALTER TABLE group_titles ADD COLUMN is_special INTEGER DEFAULT 0;

-- Create the Unassigned Channels group with a fixed UUID
INSERT OR IGNORE INTO group_titles (
  id,
  name,
  sort_order,
  is_exported,
  is_special,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Unassigned Channels',
  999999,  -- Always last in sort order
  0,       -- Never exported by default
  1,       -- Mark as special group
  datetime('now'),
  datetime('now')
);

-- Migrate any NULL custom_group_id to the Unassigned group
UPDATE channels
SET custom_group_id = '00000000-0000-0000-0000-000000000000'
WHERE custom_group_id IS NULL;
