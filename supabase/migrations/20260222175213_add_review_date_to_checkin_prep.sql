/*
  # Add Review Date to Check-In Prep Checklists

  ## Summary
  Adds a review_date column to the checkin_prep_checklists table to track the actual annual check-in meeting date (separate from the anniversary date). This enables deadline tracking and validation for various checklist items.

  ## Changes
  1. New Column
    - `review_date` (date, nullable) - The scheduled date for the annual check-in meeting
      - Should be at least 5 days before the anniversary date
      - Used for calculating deadlines for various preparation tasks

  ## Important Notes
  - The review_date is optional initially to allow gradual adoption
  - Deadline calculations will only work when review_date is set
  - The review_date should typically be 5-45 days before the anniversary date
*/

-- Add review_date column to checkin_prep_checklists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkin_prep_checklists' AND column_name = 'review_date'
  ) THEN
    ALTER TABLE checkin_prep_checklists ADD COLUMN review_date date;
  END IF;
END $$;

-- Add a check constraint to ensure review_date is before anniversary_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_review_before_anniversary'
  ) THEN
    ALTER TABLE checkin_prep_checklists
    ADD CONSTRAINT check_review_before_anniversary
    CHECK (review_date IS NULL OR anniversary_date IS NULL OR review_date < anniversary_date);
  END IF;
END $$;