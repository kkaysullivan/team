/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all foreign keys that lack covering indexes
    - Improves query performance for joins and foreign key lookups

  2. Indexes Added
    - growth_areas.skill_id
    - growth_opportunities.manager_id
    - key_result_areas.manager_id
    - maturity_assessments.assessor_id
    - maturity_model_categories.category_id
    - maturity_skill_levels.skill_id
    - role_skills.skill_id
    - skill_level_artifacts.skill_level_id
    - skill_levels.level_id
    - team_members.role_id
*/

-- Add index for growth_areas.skill_id
CREATE INDEX IF NOT EXISTS idx_growth_areas_skill_id
ON growth_areas(skill_id);

-- Add index for growth_opportunities.manager_id
CREATE INDEX IF NOT EXISTS idx_growth_opportunities_manager_id
ON growth_opportunities(manager_id);

-- Add index for key_result_areas.manager_id
CREATE INDEX IF NOT EXISTS idx_key_result_areas_manager_id
ON key_result_areas(manager_id);

-- Add index for maturity_assessments.assessor_id
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_assessor_id
ON maturity_assessments(assessor_id);

-- Add index for maturity_model_categories.category_id
CREATE INDEX IF NOT EXISTS idx_maturity_model_categories_category_id
ON maturity_model_categories(category_id);

-- Add index for maturity_skill_levels.skill_id
CREATE INDEX IF NOT EXISTS idx_maturity_skill_levels_skill_id
ON maturity_skill_levels(skill_id);

-- Add index for role_skills.skill_id
CREATE INDEX IF NOT EXISTS idx_role_skills_skill_id
ON role_skills(skill_id);

-- Add index for skill_level_artifacts.skill_level_id
CREATE INDEX IF NOT EXISTS idx_skill_level_artifacts_skill_level_id
ON skill_level_artifacts(skill_level_id);

-- Add index for skill_levels.level_id
CREATE INDEX IF NOT EXISTS idx_skill_levels_level_id
ON skill_levels(level_id);

-- Add index for team_members.role_id
CREATE INDEX IF NOT EXISTS idx_team_members_role_id
ON team_members(role_id);
