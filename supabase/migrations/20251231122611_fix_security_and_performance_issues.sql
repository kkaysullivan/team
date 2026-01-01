/*
  # Fix Security and Performance Issues

  ## Summary
  This migration addresses critical security and performance issues identified in the database audit:
  - Adds missing indexes on foreign key columns for optimal query performance
  - Optimizes RLS policies to prevent per-row function re-evaluation
  - Fixes function search paths for security compliance

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  - `one_on_ones(team_member_id)` - Improves join performance
  - `performance_reviews(team_member_id)` - Improves join performance

  ### 2. Optimize RLS Policies
  Updates all RLS policies to use `(select auth.uid())` pattern instead of direct `auth.uid()` calls.
  This prevents the function from being re-evaluated for each row, significantly improving query performance at scale.

  Affected tables and policies:
  - **team_members**: 4 policies (view, insert, update, delete)
  - **maturity_assessments**: 4 policies (view, create, update, delete)
  - **performance_reviews**: 4 policies (view, insert, update, delete)
  - **one_on_ones**: 4 policies (view, insert, update, delete)
  - **key_result_areas**: 4 policies (view, insert, update, delete)
  - **growth_opportunities**: 4 policies (view, insert, update, delete)

  ### 3. Fix Function Search Paths
  - `update_kras_updated_at` - Add explicit search path for security

  ## Security Notes
  - All changes maintain existing security model
  - RLS policies remain restrictive and check manager ownership
  - Function search paths are explicitly set to prevent SQL injection risks
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_one_on_ones_team_member_id 
  ON one_on_ones(team_member_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_team_member_id 
  ON performance_reviews(team_member_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - TEAM_MEMBERS
-- =====================================================

DROP POLICY IF EXISTS "Managers can view their team members" ON team_members;
DROP POLICY IF EXISTS "Managers can insert their team members" ON team_members;
DROP POLICY IF EXISTS "Managers can update their team members" ON team_members;
DROP POLICY IF EXISTS "Managers can delete their team members" ON team_members;

CREATE POLICY "Managers can view their team members"
  ON team_members FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = manager_id);

CREATE POLICY "Managers can insert their team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = manager_id);

CREATE POLICY "Managers can update their team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = manager_id)
  WITH CHECK ((select auth.uid()) = manager_id);

CREATE POLICY "Managers can delete their team members"
  ON team_members FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = manager_id);

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - MATURITY_ASSESSMENTS
-- =====================================================

DROP POLICY IF EXISTS "Managers can view assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Managers can create assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Managers can update assessments for their team members" ON maturity_assessments;
DROP POLICY IF EXISTS "Managers can delete assessments for their team members" ON maturity_assessments;

CREATE POLICY "Managers can view assessments for their team members"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can create assessments for their team members"
  ON maturity_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can update assessments for their team members"
  ON maturity_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can delete assessments for their team members"
  ON maturity_assessments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - PERFORMANCE_REVIEWS
-- =====================================================

DROP POLICY IF EXISTS "Managers can view performance reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Managers can insert performance reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Managers can update performance reviews" ON performance_reviews;
DROP POLICY IF EXISTS "Managers can delete performance reviews" ON performance_reviews;

CREATE POLICY "Managers can view performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can insert performance reviews"
  ON performance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can update performance reviews"
  ON performance_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can delete performance reviews"
  ON performance_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = performance_reviews.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - ONE_ON_ONES
-- =====================================================

DROP POLICY IF EXISTS "Managers can view one on ones" ON one_on_ones;
DROP POLICY IF EXISTS "Managers can insert one on ones" ON one_on_ones;
DROP POLICY IF EXISTS "Managers can update one on ones" ON one_on_ones;
DROP POLICY IF EXISTS "Managers can delete one on ones" ON one_on_ones;

CREATE POLICY "Managers can view one on ones"
  ON one_on_ones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can insert one on ones"
  ON one_on_ones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can update one on ones"
  ON one_on_ones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can delete one on ones"
  ON one_on_ones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = one_on_ones.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - KEY_RESULT_AREAS
-- =====================================================

DROP POLICY IF EXISTS "Managers can view their team's KRAs" ON key_result_areas;
DROP POLICY IF EXISTS "Managers can insert their team's KRAs" ON key_result_areas;
DROP POLICY IF EXISTS "Managers can update their team's KRAs" ON key_result_areas;
DROP POLICY IF EXISTS "Managers can delete their team's KRAs" ON key_result_areas;

CREATE POLICY "Managers can view their team's KRAs"
  ON key_result_areas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = key_result_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can insert their team's KRAs"
  ON key_result_areas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = key_result_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can update their team's KRAs"
  ON key_result_areas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = key_result_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = key_result_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can delete their team's KRAs"
  ON key_result_areas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = key_result_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - GROWTH_OPPORTUNITIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can view their team's growth opportunities" ON growth_opportunities;
DROP POLICY IF EXISTS "Managers can insert their team's growth opportunities" ON growth_opportunities;
DROP POLICY IF EXISTS "Managers can update their team's growth opportunities" ON growth_opportunities;
DROP POLICY IF EXISTS "Managers can delete their team's growth opportunities" ON growth_opportunities;

CREATE POLICY "Managers can view their team's growth opportunities"
  ON growth_opportunities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_opportunities.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can insert their team's growth opportunities"
  ON growth_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_opportunities.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can update their team's growth opportunities"
  ON growth_opportunities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_opportunities.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_opportunities.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

CREATE POLICY "Managers can delete their team's growth opportunities"
  ON growth_opportunities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_opportunities.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- =====================================================
-- 8. FIX FUNCTION SEARCH PATHS
-- =====================================================

CREATE OR REPLACE FUNCTION update_kras_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;