/*
  # Add Current Level to Team Members

  1. Changes
    - Add `current_level` column to `team_members` table to track their official maturity level
    - This is separate from their performance-based level shown in the category average
    - Used to determine growth status (Needs Coaching, On Track, Promotion Ready)

  2. Notes
    - Valid values: 'Associate', 'Level 1', 'Level 2', 'Senior Level', 'Lead'
    - Defaults to 'Associate' for new team members
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'current_level'
  ) THEN
    ALTER TABLE team_members 
    ADD COLUMN current_level text DEFAULT 'Associate';
  END IF;
END $$;