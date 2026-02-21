/*
  # Add 1-on-1 Notes Field to Check-ins

  1. Changes
    - Add `one_on_one_notes` text field to performance_reviews table
    - This field allows managers to paste consolidated 1-on-1 notes directly into check-ins
    - Provides better context for quarterly and annual check-ins
  
  2. Purpose
    - Consolidate 1-on-1 tracking into check-ins
    - Single copy/paste entry instead of separate weekly entries
    - Better integration of ongoing conversations with formal check-ins
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'one_on_one_notes'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN one_on_one_notes text DEFAULT NULL;
  END IF;
END $$;
