/*
  # Add Personality Assessment Fields

  1. Changes
    - Add DISC profile fields (disc_d, disc_i, disc_s, disc_c) to team_members table
    - Add Enneagram fields (enneagram_primary, enneagram_wing) to team_members table
    - Add Working Genius field (working_genius) to team_members table

  2. Field Details
    - DISC values are integers 0-100 for each dimension (Dominance, Influence, Steadiness, Conscientiousness)
    - Enneagram primary type is integer 1-9
    - Enneagram wing is optional integer 1-9
    - Working Genius stores JSON array of the 6 types ranked by strength

  3. Security
    - No changes to RLS policies needed (inherits from existing team_members policies)
*/

-- Add DISC profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'disc_d'
  ) THEN
    ALTER TABLE team_members ADD COLUMN disc_d integer CHECK (disc_d >= 0 AND disc_d <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'disc_i'
  ) THEN
    ALTER TABLE team_members ADD COLUMN disc_i integer CHECK (disc_i >= 0 AND disc_i <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'disc_s'
  ) THEN
    ALTER TABLE team_members ADD COLUMN disc_s integer CHECK (disc_s >= 0 AND disc_s <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'disc_c'
  ) THEN
    ALTER TABLE team_members ADD COLUMN disc_c integer CHECK (disc_c >= 0 AND disc_c <= 100);
  END IF;
END $$;

-- Add Enneagram fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'enneagram_primary'
  ) THEN
    ALTER TABLE team_members ADD COLUMN enneagram_primary integer CHECK (enneagram_primary >= 1 AND enneagram_primary <= 9);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'enneagram_wing'
  ) THEN
    ALTER TABLE team_members ADD COLUMN enneagram_wing integer CHECK (enneagram_wing >= 1 AND enneagram_wing <= 9);
  END IF;
END $$;

-- Add Working Genius field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'working_genius'
  ) THEN
    ALTER TABLE team_members ADD COLUMN working_genius jsonb;
  END IF;
END $$;
