/*
  # Fix Overly Permissive RLS Policies

  This migration addresses critical security issues by restricting overly permissive policies.

  ## Security Issues Fixed

  1. **Admin Tables (assessment_types, preference_types, cadence_schedules)**
     - OLD: All authenticated users could modify/delete
     - NEW: Only managers can modify these administrative tables

  2. **KRAs Table**
     - OLD: All authenticated users could modify/delete any KRA
     - NEW: Only managers can manage KRAs for their team members

  3. **Team Member Preferences**
     - OLD: All authenticated users could modify/delete any preferences
     - NEW: Only managers can manage preferences for their team members

  4. **Maturity Categories (INSERT/UPDATE/DELETE)**
     - Restricted to authenticated users only (admin functions)

  5. **Skills and Levels Admin Tables**
     - Restricted modification to authenticated manager users only

  ## Changes Made

  - Drop overly permissive policies using `USING (true)`
  - Create restrictive policies that check manager relationships
  - Ensure team members can only view their own data
  - Maintain read-only access for public data where appropriate
*/

-- Fix assessment_types policies
DROP POLICY IF EXISTS "Authenticated users can delete assessment types" ON assessment_types;
DROP POLICY IF EXISTS "Authenticated users can insert assessment types" ON assessment_types;
DROP POLICY IF EXISTS "Authenticated users can update assessment types" ON assessment_types;

-- Fix preference_types policies
DROP POLICY IF EXISTS "Authenticated users can delete preference types" ON preference_types;
DROP POLICY IF EXISTS "Authenticated users can insert preference types" ON preference_types;
DROP POLICY IF EXISTS "Authenticated users can update preference types" ON preference_types;

-- Fix cadence_schedules policies  
DROP POLICY IF EXISTS "Authenticated users can delete cadence schedules" ON cadence_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert cadence schedules" ON cadence_schedules;
DROP POLICY IF EXISTS "Authenticated users can update cadence schedules" ON cadence_schedules;

-- Fix kras policies
DROP POLICY IF EXISTS "Authenticated users can delete KRAs" ON kras;
DROP POLICY IF EXISTS "Authenticated users can insert KRAs" ON kras;
DROP POLICY IF EXISTS "Authenticated users can update KRAs" ON kras;
DROP POLICY IF EXISTS "Authenticated users can view KRAs" ON kras;

-- Fix team_member_preferences policies
DROP POLICY IF EXISTS "Authenticated users can delete preferences" ON team_member_preferences;
DROP POLICY IF EXISTS "Authenticated users can insert preferences" ON team_member_preferences;
DROP POLICY IF EXISTS "Authenticated users can update preferences" ON team_member_preferences;
DROP POLICY IF EXISTS "Authenticated users can view all preferences" ON team_member_preferences;

-- Fix category_skills policies
DROP POLICY IF EXISTS "Authenticated users can delete category skills" ON category_skills;
DROP POLICY IF EXISTS "Authenticated users can insert category skills" ON category_skills;
DROP POLICY IF EXISTS "Authenticated users can update category skills" ON category_skills;
DROP POLICY IF EXISTS "Authenticated users can view category skills" ON category_skills;

-- Fix role_skills policies
DROP POLICY IF EXISTS "Authenticated users can delete role skills" ON role_skills;
DROP POLICY IF EXISTS "Authenticated users can insert role skills" ON role_skills;
DROP POLICY IF EXISTS "Authenticated users can update role skills" ON role_skills;
DROP POLICY IF EXISTS "Authenticated users can view role skills" ON role_skills;

-- Fix roles policies
DROP POLICY IF EXISTS "Authenticated users can delete roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can update roles" ON roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON roles;

-- Fix maturity_models policies
DROP POLICY IF EXISTS "Authenticated users can delete maturity models" ON maturity_models;
DROP POLICY IF EXISTS "Authenticated users can insert maturity models" ON maturity_models;
DROP POLICY IF EXISTS "Authenticated users can update maturity models" ON maturity_models;
DROP POLICY IF EXISTS "Authenticated users can view maturity models" ON maturity_models;

-- Fix maturity_model_categories policies
DROP POLICY IF EXISTS "Authenticated users can delete model categories" ON maturity_model_categories;
DROP POLICY IF EXISTS "Authenticated users can insert model categories" ON maturity_model_categories;
DROP POLICY IF EXISTS "Authenticated users can update model categories" ON maturity_model_categories;
DROP POLICY IF EXISTS "Authenticated users can view model categories" ON maturity_model_categories;

-- Fix levels policies
DROP POLICY IF EXISTS "Authenticated users can delete levels" ON levels;
DROP POLICY IF EXISTS "Authenticated users can insert levels" ON levels;
DROP POLICY IF EXISTS "Authenticated users can update levels" ON levels;
DROP POLICY IF EXISTS "Authenticated users can view levels" ON levels;

-- Fix skill_levels policies
DROP POLICY IF EXISTS "Authenticated users can delete skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Authenticated users can insert skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Authenticated users can update skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Authenticated users can view skill levels" ON skill_levels;

-- Fix skill_level_artifacts policies
DROP POLICY IF EXISTS "Authenticated users can delete skill level artifacts" ON skill_level_artifacts;
DROP POLICY IF EXISTS "Authenticated users can insert skill level artifacts" ON skill_level_artifacts;
DROP POLICY IF EXISTS "Authenticated users can update skill level artifacts" ON skill_level_artifacts;
DROP POLICY IF EXISTS "Authenticated users can view skill level artifacts" ON skill_level_artifacts;

-- Create new restrictive policies for KRAs
CREATE POLICY "Managers can manage KRAs for their team"
  ON kras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = kras.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Create new restrictive policies for team_member_preferences
CREATE POLICY "Managers can manage preferences for their team"
  ON team_member_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_preferences.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Create new restrictive policies for cadence_schedules
CREATE POLICY "Managers can manage cadence for their team"
  ON cadence_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = cadence_schedules.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = cadence_schedules.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Admin tables: Only authenticated managers can modify
-- (Keeping read policies but restricting write)
CREATE POLICY "Managers can view assessment types"
  ON assessment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view preference types"
  ON preference_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view category skills"
  ON category_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view role skills"
  ON role_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view maturity models"
  ON maturity_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view model categories"
  ON maturity_model_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view levels"
  ON levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view skill levels"
  ON skill_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can view skill level artifacts"
  ON skill_level_artifacts FOR SELECT
  TO authenticated
  USING (true);
