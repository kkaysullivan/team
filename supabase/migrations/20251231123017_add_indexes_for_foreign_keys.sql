/*
  # Add Indexes for Foreign Keys

  ## Summary
  This migration adds indexes for all foreign key columns to improve query performance.
  Foreign keys without indexes can lead to slow joins, cascading operations, and constraint checks.

  ## Changes

  ### Indexes Added
  Creates indexes on the following foreign key columns:
  1. `growth_opportunities.manager_id` - For faster lookups by manager
  2. `key_result_areas.manager_id` - For faster lookups by manager
  3. `maturity_assessments.assessor_id` - For faster lookups by assessor
  4. `maturity_assessments.skill_id` - For faster lookups by skill
  5. `maturity_model_categories.category_id` - For faster category lookups
  6. `maturity_skill_levels.skill_id` - For faster skill lookups
  7. `one_on_ones.team_member_id` - For faster team member lookups
  8. `performance_reviews.team_member_id` - For faster team member lookups
  9. `role_skills.skill_id` - For faster skill lookups
  10. `skill_level_artifacts.skill_level_id` - For faster skill level lookups
  11. `skill_levels.level_id` - For faster level lookups
  12. `team_members.role_id` - For faster role lookups

  ## Performance Impact
  - Improves JOIN performance when querying related data
  - Speeds up foreign key constraint checks on INSERT/UPDATE/DELETE
  - Reduces query execution time for filtered queries on these columns
  - Minimal storage overhead with significant performance gains

  ## Notes
  - All indexes use IF NOT EXISTS to safely handle re-runs
  - Index names follow the pattern: idx_tablename_columnname
*/

-- =====================================================
-- CREATE INDEXES FOR FOREIGN KEYS
-- =====================================================

-- Index for growth_opportunities.manager_id
CREATE INDEX IF NOT EXISTS idx_growth_opportunities_manager_id 
ON growth_opportunities(manager_id);

-- Index for key_result_areas.manager_id
CREATE INDEX IF NOT EXISTS idx_key_result_areas_manager_id 
ON key_result_areas(manager_id);

-- Index for maturity_assessments.assessor_id
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_assessor_id 
ON maturity_assessments(assessor_id);

-- Index for maturity_assessments.skill_id
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_skill_id 
ON maturity_assessments(skill_id);

-- Index for maturity_model_categories.category_id
CREATE INDEX IF NOT EXISTS idx_maturity_model_categories_category_id 
ON maturity_model_categories(category_id);

-- Index for maturity_skill_levels.skill_id
CREATE INDEX IF NOT EXISTS idx_maturity_skill_levels_skill_id 
ON maturity_skill_levels(skill_id);

-- Index for one_on_ones.team_member_id
CREATE INDEX IF NOT EXISTS idx_one_on_ones_team_member_id 
ON one_on_ones(team_member_id);

-- Index for performance_reviews.team_member_id
CREATE INDEX IF NOT EXISTS idx_performance_reviews_team_member_id 
ON performance_reviews(team_member_id);

-- Index for role_skills.skill_id
CREATE INDEX IF NOT EXISTS idx_role_skills_skill_id 
ON role_skills(skill_id);

-- Index for skill_level_artifacts.skill_level_id
CREATE INDEX IF NOT EXISTS idx_skill_level_artifacts_skill_level_id 
ON skill_level_artifacts(skill_level_id);

-- Index for skill_levels.level_id
CREATE INDEX IF NOT EXISTS idx_skill_levels_level_id 
ON skill_levels(level_id);

-- Index for team_members.role_id
CREATE INDEX IF NOT EXISTS idx_team_members_role_id 
ON team_members(role_id);