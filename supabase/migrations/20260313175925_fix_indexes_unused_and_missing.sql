/*
  # Fix Indexes: Remove Unused, Remove Duplicate, Add Missing

  ## Changes

  ### Remove Unused Indexes
  These indexes have never been used by the query planner and add unnecessary
  write overhead on INSERT/UPDATE/DELETE operations.

  - idx_skill_levels_level_id
  - idx_team_members_role_id
  - idx_growth_areas_skill_id
  - idx_growth_opportunities_manager_id
  - idx_key_result_areas_manager_id
  - idx_maturity_assessments_assessor_id
  - idx_maturity_model_categories_category_id
  - idx_checkin_prep_status
  - idx_team_members_manager_id
  - idx_performance_reviews_manager_id
  - idx_roles_maturity_model_id
  - idx_key_result_areas_team_member_id
  - idx_growth_opportunities_team_member_id
  - idx_category_skills_skill_category

  ### Remove Duplicate Index
  - idx_maturity_assessments_team_member (duplicate of idx_maturity_assessments_team_member_id)

  ### Add Missing FK Index
  - maturity_assessments.skill_id — foreign key without a covering index
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_skill_levels_level_id;
DROP INDEX IF EXISTS idx_team_members_role_id;
DROP INDEX IF EXISTS idx_growth_areas_skill_id;
DROP INDEX IF EXISTS idx_growth_opportunities_manager_id;
DROP INDEX IF EXISTS idx_key_result_areas_manager_id;
DROP INDEX IF EXISTS idx_maturity_assessments_assessor_id;
DROP INDEX IF EXISTS idx_maturity_model_categories_category_id;
DROP INDEX IF EXISTS idx_checkin_prep_status;
DROP INDEX IF EXISTS idx_team_members_manager_id;
DROP INDEX IF EXISTS idx_performance_reviews_manager_id;
DROP INDEX IF EXISTS idx_roles_maturity_model_id;
DROP INDEX IF EXISTS idx_key_result_areas_team_member_id;
DROP INDEX IF EXISTS idx_growth_opportunities_team_member_id;
DROP INDEX IF EXISTS idx_category_skills_skill_category;

-- Remove duplicate index (keep idx_maturity_assessments_team_member_id)
DROP INDEX IF EXISTS idx_maturity_assessments_team_member;

-- Add missing FK index on maturity_assessments.skill_id
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_skill_id
  ON maturity_assessments (skill_id);
