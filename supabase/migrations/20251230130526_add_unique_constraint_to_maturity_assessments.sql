/*
  # Add Unique Constraint to Maturity Assessments

  1. Changes
    - Add unique constraint on (team_member_id, skill_id) to prevent duplicate assessments
    - This ensures each team member can only have one assessment per skill
  
  2. Notes
    - This constraint allows us to use upsert operations for saving assessments
    - Existing duplicate records (if any) will need to be resolved before this constraint can be applied
*/

-- Add unique constraint to prevent duplicate assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'maturity_assessments_team_member_skill_key'
  ) THEN
    ALTER TABLE maturity_assessments 
    ADD CONSTRAINT maturity_assessments_team_member_skill_key 
    UNIQUE (team_member_id, skill_id);
  END IF;
END $$;
