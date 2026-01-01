/*
  # Add Team Member User Accounts

  1. Changes
    - Add `user_id` column to `team_members` table to link team members to auth.users
    - This allows team members to log in and view their own data
    - Update RLS policies to allow team members to read their own data
    - Managers retain full access to their team members' data

  2. Security
    - Add policy for team members to view their own profile
    - Add policy for team members to view their own check-ins, one-on-ones, KRAs, etc.
    - Team members can read but not modify their own data (managers control updates)

  3. Notes
    - `user_id` is nullable to support team members without login accounts
    - `user_id` must be unique when set (one team member per auth user)
    - Email matching can be used to initially link team members to user accounts
*/

-- Add user_id column to team_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE team_members ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE UNIQUE INDEX idx_team_members_user_id ON team_members(user_id) WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Add RLS policy for team members to view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own profile' AND tablename = 'team_members'
  ) THEN
    CREATE POLICY "Team members can view own profile"
      ON team_members
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update maturity_assessments policies to allow team members to view their own assessments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own maturity assessments' AND tablename = 'maturity_assessments'
  ) THEN
    CREATE POLICY "Team members can view own maturity assessments"
      ON maturity_assessments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = maturity_assessments.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update growth_areas policies to allow team members to view their own growth areas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own growth areas' AND tablename = 'growth_areas'
  ) THEN
    CREATE POLICY "Team members can view own growth areas"
      ON growth_areas
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = growth_areas.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update kras policies to allow team members to view their own KRAs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own kras' AND tablename = 'kras'
  ) THEN
    CREATE POLICY "Team members can view own kras"
      ON kras
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = kras.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update performance_reviews (check-ins) policies to allow team members to view their own check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own check-ins' AND tablename = 'performance_reviews'
  ) THEN
    CREATE POLICY "Team members can view own check-ins"
      ON performance_reviews
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = performance_reviews.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update one_on_ones policies to allow team members to view their own one-on-ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own one-on-ones' AND tablename = 'one_on_ones'
  ) THEN
    CREATE POLICY "Team members can view own one-on-ones"
      ON one_on_ones
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = one_on_ones.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Update team_member_preferences policies to allow team members to view their own preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view own preferences' AND tablename = 'team_member_preferences'
  ) THEN
    CREATE POLICY "Team members can view own preferences"
      ON team_member_preferences
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.id = team_member_preferences.team_member_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;