/*
  # Fix RLS Always-True Write Policies

  ## Security Issues Fixed

  Tables `category_skills`, `maturity_skills`, and `skill_levels` have INSERT/UPDATE/DELETE
  policies with `USING (true)` / `WITH CHECK (true)` — meaning any authenticated user can
  modify these admin-managed reference tables.

  These are admin-only tables (skill/maturity model configuration). Write access should be
  restricted to users who are managers (have at least one team member).

  ## Changes
  - Drop overly permissive INSERT/UPDATE/DELETE policies on all three tables
  - Replace with policies that restrict writes to authenticated managers only
  - SELECT policies remain open to all authenticated users (reference data needed by all)
*/

-- Fix category_skills write policies
DROP POLICY IF EXISTS "Authenticated users can insert category skills" ON category_skills;
DROP POLICY IF EXISTS "Authenticated users can update category skills" ON category_skills;
DROP POLICY IF EXISTS "Authenticated users can delete category skills" ON category_skills;

CREATE POLICY "Managers can insert category skills"
  ON category_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can update category skills"
  ON category_skills FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can delete category skills"
  ON category_skills FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

-- Fix maturity_skills write policies
DROP POLICY IF EXISTS "Authenticated users can insert maturity skills" ON maturity_skills;
DROP POLICY IF EXISTS "Authenticated users can update maturity skills" ON maturity_skills;
DROP POLICY IF EXISTS "Authenticated users can delete maturity skills" ON maturity_skills;

CREATE POLICY "Managers can insert maturity skills"
  ON maturity_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can update maturity skills"
  ON maturity_skills FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can delete maturity skills"
  ON maturity_skills FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

-- Fix skill_levels write policies
DROP POLICY IF EXISTS "Authenticated users can insert skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Authenticated users can update skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Authenticated users can delete skill levels" ON skill_levels;

CREATE POLICY "Managers can insert skill levels"
  ON skill_levels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can update skill levels"
  ON skill_levels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );

CREATE POLICY "Managers can delete skill levels"
  ON skill_levels FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.manager_id = (SELECT auth.uid()))
  );
