/*
  # Consolidate Duplicate Permissive Policies

  1. Security Improvements
    - Remove duplicate permissive policies for the same role and action
    - Consolidate overlapping policies into single policies
    - Improves policy evaluation performance

  2. Tables Updated
    - assessment_types: Merge duplicate SELECT policies
    - cadence_schedules: Merge duplicate SELECT policies
    - growth_areas: Keep both policies (they serve different purposes)
    - kras: Keep both policies (they serve different purposes)
    - maturity_assessments: Keep both policies (they serve different purposes)
    - one_on_ones: Keep both policies (they serve different purposes)
    - performance_reviews: Keep both policies (they serve different purposes)
    - preference_types: Merge duplicate SELECT policies
    - team_member_preferences: Keep both policies (they serve different purposes)
    - team_members: Keep both policies (they serve different purposes)

  Note: Some policies need to remain separate because they serve different user roles
  (managers vs team members). Only truly duplicate policies are removed.
*/

-- Consolidate assessment_types policies
DROP POLICY IF EXISTS "Authenticated users can view assessment types" ON assessment_types;
DROP POLICY IF EXISTS "Managers can view assessment types" ON assessment_types;

CREATE POLICY "Authenticated users can view assessment types"
  ON assessment_types FOR SELECT
  TO authenticated
  USING (true);

-- Consolidate preference_types policies
DROP POLICY IF EXISTS "Authenticated users can view preference types" ON preference_types;
DROP POLICY IF EXISTS "Managers can view preference types" ON preference_types;

CREATE POLICY "Authenticated users can view preference types"
  ON preference_types FOR SELECT
  TO authenticated
  USING (true);

-- Consolidate cadence_schedules SELECT policies
-- Keep the manager policy for ALL operations, add a separate SELECT policy for viewing
DROP POLICY IF EXISTS "Authenticated users can view all cadence schedules" ON cadence_schedules;

CREATE POLICY "Authenticated users can view all cadence schedules"
  ON cadence_schedules FOR SELECT
  TO authenticated
  USING (true);
