/*
  # Update Performance Reviews to Check-ins

  1. Changes
    - Add `type` column (quarterly or annual)
    - Add `quarter` column for quarterly check-ins (Q1, Q2, Q3, Q4)
    - Add `year` column for quarterly check-ins

  2. Notes
    - Existing reviews will default to 'annual' type
    - Quarter and year are optional (only used for quarterly check-ins)
*/

-- Add new columns to performance_reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'type'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN type text DEFAULT 'annual' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'quarter'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN quarter text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'year'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN year integer;
  END IF;
END $$;
