/*
  # Fix Remaining Security and Performance Issues

  ## Summary
  This migration addresses the remaining security and performance issues:
  - Fixes function search path for `update_updated_at_column` 
  - Removes unused indexes that waste storage and slow down write operations

  ## Changes

  ### 1. Fix Function Search Path
  Updates `update_updated_at_column` with explicit search path to prevent SQL injection risks.

  ### 2. Remove Unused Indexes
  Removes the following unused indexes to improve write performance and reduce storage overhead:
  - `idx_performance_reviews_team_member_id` - No longer needed
  - `idx_maturity_model_categories_category` - Not being used by queries
  - `idx_role_skills_role` - Not being used by queries
  - `idx_role_skills_skill` - Not being used by queries
  - `idx_skill_levels_level` - Not being used by queries
  - `idx_kras_is_active` - Not being used by queries
  - `idx_team_members_role` - Not being used by queries
  - `idx_one_on_ones_team_member_id` - No longer needed
  - `idx_maturity_skills_display_order` - Not being used by queries
  - `idx_maturity_assessments_skill` - Not being used by queries
  - `idx_maturity_assessments_assessor` - Not being used by queries
  - `idx_maturity_skill_levels_skill` - Not being used by queries
  - `idx_skill_level_artifacts_skill_level` - Not being used by queries
  - `idx_growth_opportunities_manager_id` - Not being used by queries
  - `idx_key_result_areas_manager_id` - Not being used by queries

  ## Notes
  - Indexes can be re-added in the future if query patterns change
  - The Auth DB connection strategy and leaked password protection require changes in Supabase project settings
*/

-- =====================================================
-- 1. FIX FUNCTION SEARCH PATH
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_performance_reviews_team_member_id;
DROP INDEX IF EXISTS idx_maturity_model_categories_category;
DROP INDEX IF EXISTS idx_role_skills_role;
DROP INDEX IF EXISTS idx_role_skills_skill;
DROP INDEX IF EXISTS idx_skill_levels_level;
DROP INDEX IF EXISTS idx_kras_is_active;
DROP INDEX IF EXISTS idx_team_members_role;
DROP INDEX IF EXISTS idx_one_on_ones_team_member_id;
DROP INDEX IF EXISTS idx_maturity_skills_display_order;
DROP INDEX IF EXISTS idx_maturity_assessments_skill;
DROP INDEX IF EXISTS idx_maturity_assessments_assessor;
DROP INDEX IF EXISTS idx_maturity_skill_levels_skill;
DROP INDEX IF EXISTS idx_skill_level_artifacts_skill_level;
DROP INDEX IF EXISTS idx_growth_opportunities_manager_id;
DROP INDEX IF EXISTS idx_key_result_areas_manager_id;