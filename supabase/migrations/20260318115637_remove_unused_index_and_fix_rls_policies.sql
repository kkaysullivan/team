/*
  # Remove Unused Index and Fix RLS Policies

  ## Summary
  1. Drops the unused idx_maturity_assessments_skill_id index (covered by the
     existing maturity_assessments_team_member_skill_key unique index)
  2. Consolidates multiple permissive SELECT/INSERT/UPDATE/DELETE policies on
     team_members into single policies that combine manager + super admin access
  3. Fixes always-true write policies on maturity_models and roles to restrict
     access to managers only (authenticated users who manage at least one team member)

  ## Changes

  ### Removed
  - idx_maturity_assessments_skill_id (unused index)

  ### team_members policies consolidated
  - SELECT: 3 policies merged into 1 (manager OR super admin OR own record)
  - INSERT: 2 policies merged into 1 (manager OR super admin)
  - UPDATE: 2 policies merged into 1 (manager OR super admin)
  - DELETE: 2 policies merged into 1 (manager OR super admin)

  ### maturity_models write policies tightened
  - INSERT/UPDATE/DELETE now restricted to managers only

  ### roles write policies tightened
  - INSERT/UPDATE/DELETE now restricted to managers only
*/

-- Remove unused index
DROP INDEX IF EXISTS public.idx_maturity_assessments_skill_id;

-- ============================================================
-- Consolidate team_members permissive policies
-- ============================================================

-- DROP old SELECT policies
DROP POLICY IF EXISTS "Managers can view their own team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their own record" ON public.team_members;

-- DROP old INSERT policies
DROP POLICY IF EXISTS "Managers can insert their team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can insert any team member" ON public.team_members;

-- DROP old UPDATE policies
DROP POLICY IF EXISTS "Managers can update their team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can update any team member" ON public.team_members;

-- DROP old DELETE policies
DROP POLICY IF EXISTS "Managers can delete their team members" ON public.team_members;
DROP POLICY IF EXISTS "Super admins can delete any team member" ON public.team_members;

-- CREATE consolidated SELECT policy
CREATE POLICY "Managers, super admins, and self can view team members"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = manager_id
    OR (SELECT auth.uid()) = user_id
    OR is_super_admin()
  );

-- CREATE consolidated INSERT policy
CREATE POLICY "Managers and super admins can insert team members"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = manager_id
    OR is_super_admin()
  );

-- CREATE consolidated UPDATE policy
CREATE POLICY "Managers and super admins can update team members"
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = manager_id
    OR is_super_admin()
  )
  WITH CHECK (
    (SELECT auth.uid()) = manager_id
    OR is_super_admin()
  );

-- CREATE consolidated DELETE policy
CREATE POLICY "Managers and super admins can delete team members"
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = manager_id
    OR is_super_admin()
  );

-- ============================================================
-- Fix always-true write policies on maturity_models
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert maturity models" ON public.maturity_models;
DROP POLICY IF EXISTS "Authenticated users can update maturity models" ON public.maturity_models;
DROP POLICY IF EXISTS "Authenticated users can delete maturity models" ON public.maturity_models;

CREATE POLICY "Managers can insert maturity models"
  ON public.maturity_models
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );

CREATE POLICY "Managers can update maturity models"
  ON public.maturity_models
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );

CREATE POLICY "Managers can delete maturity models"
  ON public.maturity_models
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );

-- ============================================================
-- Fix always-true write policies on roles
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON public.roles;

CREATE POLICY "Managers can insert roles"
  ON public.roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );

CREATE POLICY "Managers can update roles"
  ON public.roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );

CREATE POLICY "Managers can delete roles"
  ON public.roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE manager_id = (SELECT auth.uid())
    )
    OR is_super_admin()
  );
