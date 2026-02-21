/*
  # Remove Unused Indexes

  1. Performance Improvements
    - Remove indexes that are not being used
    - Reduces storage overhead
    - Improves write performance (fewer indexes to update)

  2. Indexes Removed
    - idx_team_members_manager_id (unused)
    - idx_performance_reviews_manager_id (unused)
    - idx_one_on_ones_manager_id (unused)
    - idx_maturity_assessments_skill_id (unused)
    - idx_roles_maturity_model (unused)
    - idx_maturity_model_categories_model (unused)
    - idx_key_result_areas_team_member_id (unused)
    - idx_growth_opportunities_team_member_id (unused)
    - idx_team_member_preferences_team_member_id (unused)
    - idx_self_assessment_tokens_token (unused)
    - idx_self_assessment_tokens_team_member (unused)
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_team_members_manager_id;
DROP INDEX IF EXISTS idx_performance_reviews_manager_id;
DROP INDEX IF EXISTS idx_one_on_ones_manager_id;
DROP INDEX IF EXISTS idx_maturity_assessments_skill_id;
DROP INDEX IF EXISTS idx_roles_maturity_model;
DROP INDEX IF EXISTS idx_maturity_model_categories_model;
DROP INDEX IF EXISTS idx_key_result_areas_team_member_id;
DROP INDEX IF EXISTS idx_growth_opportunities_team_member_id;
DROP INDEX IF EXISTS idx_team_member_preferences_team_member_id;
DROP INDEX IF EXISTS idx_self_assessment_tokens_token;
DROP INDEX IF EXISTS idx_self_assessment_tokens_team_member;
