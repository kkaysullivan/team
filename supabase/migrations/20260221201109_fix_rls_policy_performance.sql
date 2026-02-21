/*
  # Fix RLS Policy Performance

  1. Performance Improvements
    - Update RLS policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale

  2. Policies Updated
    - team_members: Team members can view own profile
    - performance_reviews: Team members can view own check-ins
    - one_on_ones: Team members can view own one-on-ones
    - maturity_assessments: Team members can view own maturity assessments
    - cadence_schedules: Managers can manage cadence for their team
    - kras: Managers can manage KRAs for their team, Team members can view own kras
    - team_member_preferences: Managers can manage preferences for their team, Team members can view own preferences
    - growth_areas: Team members can view own growth areas
*/

-- Drop and recreate team_members policies
DROP POLICY IF EXISTS "Team members can view own profile" ON team_members;
CREATE POLICY "Team members can view own profile"
  ON team_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Drop and recreate performance_reviews policies
DROP POLICY IF EXISTS "Team members can view own check-ins" ON performance_reviews;
CREATE POLICY "Team members can view own check-ins"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- Drop and recreate one_on_ones policies
DROP POLICY IF EXISTS "Team members can view own one-on-ones" ON one_on_ones;
CREATE POLICY "Team members can view own one-on-ones"
  ON one_on_ones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- Drop and recreate maturity_assessments policies
DROP POLICY IF EXISTS "Team members can view own maturity assessments" ON maturity_assessments;
CREATE POLICY "Team members can view own maturity assessments"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- Drop and recreate cadence_schedules policies
DROP POLICY IF EXISTS "Managers can manage cadence for their team" ON cadence_schedules;
CREATE POLICY "Managers can manage cadence for their team"
  ON cadence_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = cadence_schedules.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = cadence_schedules.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- Drop and recreate kras policies
DROP POLICY IF EXISTS "Managers can manage KRAs for their team" ON kras;
CREATE POLICY "Managers can manage KRAs for their team"
  ON kras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can view own kras" ON kras;
CREATE POLICY "Team members can view own kras"
  ON kras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- Drop and recreate team_member_preferences policies
DROP POLICY IF EXISTS "Managers can manage preferences for their team" ON team_member_preferences;
CREATE POLICY "Managers can manage preferences for their team"
  ON team_member_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can view own preferences" ON team_member_preferences;
CREATE POLICY "Team members can view own preferences"
  ON team_member_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- Drop and recreate growth_areas policies
DROP POLICY IF EXISTS "Team members can view own growth areas" ON growth_areas;
CREATE POLICY "Team members can view own growth areas"
  ON growth_areas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.user_id = (select auth.uid())
    )
  );
