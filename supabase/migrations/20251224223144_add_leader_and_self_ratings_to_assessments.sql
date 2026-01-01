/*
  # Update Maturity Assessments to Support Dual Ratings
  
  ## Changes
  
  1. Schema Updates
    - Add `leader_rating` column to store leader's assessment level
    - Add `self_rating` column to store team member's self-assessment level
    - Keep `assessed_level` for backward compatibility but make it nullable
    - Keep `assessor_id` for tracking who made updates
  
  2. Notes
    - Both ratings are optional to allow for partial assessments
    - This allows managers to see both their own assessment and the team member's self-assessment side by side
*/

-- Add new columns for leader and self ratings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_assessments' AND column_name = 'leader_rating'
  ) THEN
    ALTER TABLE maturity_assessments ADD COLUMN leader_rating text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_assessments' AND column_name = 'self_rating'
  ) THEN
    ALTER TABLE maturity_assessments ADD COLUMN self_rating text;
  END IF;
END $$;

-- Make assessed_level nullable for backward compatibility
ALTER TABLE maturity_assessments ALTER COLUMN assessed_level DROP NOT NULL;

-- Migrate existing data: copy assessed_level to leader_rating
UPDATE maturity_assessments 
SET leader_rating = assessed_level 
WHERE leader_rating IS NULL AND assessed_level IS NOT NULL;
