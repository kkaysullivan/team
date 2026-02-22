/*
  # Remove One-on-One References

  This migration removes all one-on-one related functionality from the database.

  ## Changes Made
    1. Drop the `one_on_ones` table entirely
    2. Remove the `one_on_one_notes` column from `performance_reviews` table

  ## Security
    - No RLS changes needed as table is being dropped
*/

-- Drop one_on_ones table
DROP TABLE IF EXISTS one_on_ones CASCADE;

-- Remove one_on_one_notes column from performance_reviews
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'one_on_one_notes'
  ) THEN
    ALTER TABLE performance_reviews DROP COLUMN one_on_one_notes;
  END IF;
END $$;