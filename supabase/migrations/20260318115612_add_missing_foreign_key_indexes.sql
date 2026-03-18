/*
  # Add Missing Foreign Key Indexes

  ## Summary
  Adds covering indexes for all unindexed foreign key columns identified as performance issues.
  Uses IF NOT EXISTS to be safe on re-run.

  ## New Indexes
  - growth_areas.skill_id (foreign key growth_areas_skill_level_id_fkey)
  - growth_opportunities.manager_id
  - growth_opportunities.team_member_id
  - key_result_areas.manager_id
  - key_result_areas.team_member_id
  - maturity_assessments.assessor_id
  - maturity_model_categories.category_id
  - performance_reviews.manager_id
  - roles.maturity_model_id
  - skill_levels.level_id
  - team_members.manager_id
  - team_members.role_id
*/

CREATE INDEX IF NOT EXISTS idx_growth_areas_skill_id
  ON public.growth_areas (skill_id);

CREATE INDEX IF NOT EXISTS idx_growth_opportunities_manager_id
  ON public.growth_opportunities (manager_id);

CREATE INDEX IF NOT EXISTS idx_growth_opportunities_team_member_id
  ON public.growth_opportunities (team_member_id);

CREATE INDEX IF NOT EXISTS idx_key_result_areas_manager_id
  ON public.key_result_areas (manager_id);

CREATE INDEX IF NOT EXISTS idx_key_result_areas_team_member_id
  ON public.key_result_areas (team_member_id);

CREATE INDEX IF NOT EXISTS idx_maturity_assessments_assessor_id
  ON public.maturity_assessments (assessor_id);

CREATE INDEX IF NOT EXISTS idx_maturity_model_categories_category_id
  ON public.maturity_model_categories (category_id);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_manager_id
  ON public.performance_reviews (manager_id);

CREATE INDEX IF NOT EXISTS idx_roles_maturity_model_id
  ON public.roles (maturity_model_id);

CREATE INDEX IF NOT EXISTS idx_skill_levels_level_id
  ON public.skill_levels (level_id);

CREATE INDEX IF NOT EXISTS idx_team_members_manager_id
  ON public.team_members (manager_id);

CREATE INDEX IF NOT EXISTS idx_team_members_role_id
  ON public.team_members (role_id);
