/*
  # Add Missing Foreign Key Indexes for Performance

  This migration adds indexes to foreign key columns that are currently missing indexes,
  which will significantly improve query performance for JOIN operations and foreign key lookups.

  ## Indexes Added

  1. **team_members.manager_id** - Used for manager-team queries
  2. **performance_reviews.manager_id** - Used for manager review queries
  3. **roles.maturity_model_id** - Used for role-model joins
  4. **key_result_areas.team_member_id** - Used for KRA lookups
  5. **growth_opportunities.team_member_id** - Used for growth opportunity queries
  6. **self_assessment_tokens.team_member_id** - Used for token lookups

  ## Performance Impact

  - Faster JOIN operations between related tables
  - Improved foreign key constraint checking
  - Better query planning for WHERE clauses on these columns
*/

-- Index for team_members.manager_id (used in many manager queries)
CREATE INDEX IF NOT EXISTS idx_team_members_manager_id 
  ON team_members(manager_id);

-- Index for performance_reviews.manager_id (used in review queries)
CREATE INDEX IF NOT EXISTS idx_performance_reviews_manager_id 
  ON performance_reviews(manager_id);

-- Index for roles.maturity_model_id (used in role-model joins)
CREATE INDEX IF NOT EXISTS idx_roles_maturity_model_id 
  ON roles(maturity_model_id);

-- Index for key_result_areas.team_member_id (used in KRA lookups)
CREATE INDEX IF NOT EXISTS idx_key_result_areas_team_member_id 
  ON key_result_areas(team_member_id);

-- Index for growth_opportunities.team_member_id (used in growth queries)
CREATE INDEX IF NOT EXISTS idx_growth_opportunities_team_member_id 
  ON growth_opportunities(team_member_id);

-- Index for self_assessment_tokens.team_member_id (used in token lookups)
CREATE INDEX IF NOT EXISTS idx_self_assessment_tokens_team_member_id 
  ON self_assessment_tokens(team_member_id);
