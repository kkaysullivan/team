/*
  # Fix RLS Performance Issues and Remove Unused Indexes

  1. RLS Performance Optimizations
    - Replace `auth.uid()` with `(select auth.uid())` in all growth_areas policies
    - Replace `auth.uid()` with `(select auth.uid())` in self_assessment_tokens policy
    - This prevents re-evaluation of auth.uid() for each row, improving query performance

  2. Remove Unused Indexes
    - Drop unused indexes that are not being utilized by queries
    - Improves write performance and reduces storage overhead
    - Indexes dropped:
      - idx_maturity_model_categories_category_id
      - idx_role_skills_skill_id
      - idx_skill_levels_level_id
      - idx_team_members_role_id
      - idx_maturity_assessments_assessor_id
      - idx_maturity_skill_levels_skill_id
      - idx_skill_level_artifacts_skill_level_id
      - idx_growth_opportunities_manager_id
      - idx_key_result_areas_manager_id
      - idx_growth_areas_skill
      - idx_growth_areas_active

  3. Function Search Path Fix
    - Add SECURITY DEFINER and SET search_path to update_growth_areas_updated_at function
    - Prevents function search path from being mutable
*/

-- Drop and recreate growth_areas RLS policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Managers can view growth areas for their team members" ON growth_areas;
CREATE POLICY "Managers can view growth areas for their team members"
  ON growth_areas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Managers can create growth areas for their team members" ON growth_areas;
CREATE POLICY "Managers can create growth areas for their team members"
  ON growth_areas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Managers can update growth areas for their team members" ON growth_areas;
CREATE POLICY "Managers can update growth areas for their team members"
  ON growth_areas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Managers can delete growth areas for their team members" ON growth_areas;
CREATE POLICY "Managers can delete growth areas for their team members"
  ON growth_areas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- Drop and recreate self_assessment_tokens RLS policy with optimized auth.uid() calls

DROP POLICY IF EXISTS "Managers can manage tokens for their team members" ON self_assessment_tokens;
CREATE POLICY "Managers can manage tokens for their team members"
  ON self_assessment_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
      AND team_members.manager_id = (select auth.uid())
    )
  );

-- Drop unused indexes

DROP INDEX IF EXISTS idx_maturity_model_categories_category_id;
DROP INDEX IF EXISTS idx_role_skills_skill_id;
DROP INDEX IF EXISTS idx_skill_levels_level_id;
DROP INDEX IF EXISTS idx_team_members_role_id;
DROP INDEX IF EXISTS idx_maturity_assessments_assessor_id;
DROP INDEX IF EXISTS idx_maturity_skill_levels_skill_id;
DROP INDEX IF EXISTS idx_skill_level_artifacts_skill_level_id;
DROP INDEX IF EXISTS idx_growth_opportunities_manager_id;
DROP INDEX IF EXISTS idx_key_result_areas_manager_id;
DROP INDEX IF EXISTS idx_growth_areas_skill;
DROP INDEX IF EXISTS idx_growth_areas_active;

-- Fix function search path issue

CREATE OR REPLACE FUNCTION update_growth_areas_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
