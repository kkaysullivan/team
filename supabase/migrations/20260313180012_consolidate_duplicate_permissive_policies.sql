/*
  # Consolidate Duplicate Permissive RLS Policies

  ## Issue
  Multiple permissive policies for the same role and action on a table cause
  Postgres to evaluate all of them with OR logic, which is inefficient and
  confusing. Each table/action combination should have exactly one policy.

  ## Changes

  For each affected table, the multiple SELECT (or INSERT/UPDATE) policies are
  merged into a single policy with combined OR conditions.

  Tables fixed:
  - growth_areas (SELECT: manager view + team member own view)
  - kras (SELECT: manager manage-all + team member own view)
  - maturity_assessments (SELECT, INSERT, UPDATE: manager + token-based access)
  - performance_reviews (SELECT: manager view + team member own view)
  - self_assessment_tokens (SELECT, UPDATE: manager manage + public token access)
  - team_member_preferences (SELECT: manager manage + team member own view)
  - team_members (SELECT: manager view + team member own profile + token read)
*/

-- ============================================================
-- growth_areas: consolidate two SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "Managers can view growth areas for their team members" ON growth_areas;
DROP POLICY IF EXISTS "Team members can view own growth areas" ON growth_areas;

CREATE POLICY "Authenticated users can view relevant growth areas"
  ON growth_areas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
        AND (
          team_members.manager_id = (SELECT auth.uid())
          OR team_members.user_id = (SELECT auth.uid())
        )
    )
  );

-- ============================================================
-- kras: consolidate ALL + separate SELECT into separate policies
-- ============================================================
DROP POLICY IF EXISTS "Managers can manage KRAs for their team" ON kras;
DROP POLICY IF EXISTS "Team members can view own kras" ON kras;

CREATE POLICY "Authenticated users can view relevant kras"
  ON kras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
        AND (
          team_members.manager_id = (SELECT auth.uid())
          OR team_members.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "Managers can insert KRAs for their team"
  ON kras FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can update KRAs for their team"
  ON kras FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can delete KRAs for their team"
  ON kras FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- maturity_assessments: consolidate SELECT (3 -> 1), INSERT (2 -> 1), UPDATE (2 -> 1)
-- ============================================================
DROP POLICY IF EXISTS "Managers can view assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Team members can view own maturity assessments" ON maturity_assessments;
DROP POLICY IF EXISTS "Anyone can read assessments with valid unused token" ON maturity_assessments;

CREATE POLICY "Authenticated users can view relevant maturity assessments"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
        AND (
          team_members.manager_id = (SELECT auth.uid())
          OR team_members.user_id = (SELECT auth.uid())
        )
    )
    OR EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Managers can create assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Anyone can insert assessments with valid unused token" ON maturity_assessments;

CREATE POLICY "Authenticated users can insert relevant maturity assessments"
  ON maturity_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Managers can update assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Anyone can update self rating with valid unused token" ON maturity_assessments;

CREATE POLICY "Authenticated users can update relevant maturity assessments"
  ON maturity_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );

-- ============================================================
-- performance_reviews: consolidate two SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "Managers can view performance reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Team members can view own check-ins" ON performance_reviews;

CREATE POLICY "Authenticated users can view relevant performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
        AND (
          team_members.manager_id = (SELECT auth.uid())
          OR team_members.user_id = (SELECT auth.uid())
        )
    )
  );

-- ============================================================
-- self_assessment_tokens: consolidate SELECT and UPDATE
-- ============================================================
DROP POLICY IF EXISTS "Managers can manage tokens for their team members" ON self_assessment_tokens;
DROP POLICY IF EXISTS "Anyone can read valid unused tokens" ON self_assessment_tokens;
DROP POLICY IF EXISTS "Anyone can complete unused tokens" ON self_assessment_tokens;

CREATE POLICY "Authenticated users can view relevant tokens"
  ON self_assessment_tokens FOR SELECT
  TO authenticated
  USING (
    (expires_at > now() AND completed_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Authenticated users can insert tokens for their team"
  ON self_assessment_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Authenticated users can update relevant tokens"
  ON self_assessment_tokens FOR UPDATE
  TO authenticated
  USING (
    (expires_at > now() AND completed_at IS NULL)
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    expires_at > now()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can delete tokens for their team"
  ON self_assessment_tokens FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- team_member_preferences: consolidate ALL + separate SELECT
-- ============================================================
DROP POLICY IF EXISTS "Managers can manage preferences for their team" ON team_member_preferences;
DROP POLICY IF EXISTS "Team members can view own preferences" ON team_member_preferences;

CREATE POLICY "Authenticated users can view relevant preferences"
  ON team_member_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
        AND (
          team_members.manager_id = (SELECT auth.uid())
          OR team_members.user_id = (SELECT auth.uid())
        )
    )
  );

CREATE POLICY "Managers can insert preferences for their team"
  ON team_member_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can update preferences for their team"
  ON team_member_preferences FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can delete preferences for their team"
  ON team_member_preferences FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- team_members: consolidate three SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "Managers can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team members can view own profile" ON team_members;
DROP POLICY IF EXISTS "Anyone can read team member with valid token" ON team_members;

CREATE POLICY "Authenticated users can view relevant team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    manager_id = (SELECT auth.uid())
    OR user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = team_members.id
        AND self_assessment_tokens.expires_at > now()
    )
  );
