/*
  # Seed Business Acumen Category Data

  1. Business Acumen Category
    - Creates the Business Acumen category
    - Adds 5 skills under Human Skills
    - Adds level descriptions for each skill (Associate, Level 1, Level 2, Senior, Lead)

  2. Skills
    - Discerning how much time to spend on work
    - Creating multiple solutions to find value early
    - Following results to ensure outcomes
    - Pointing work to the business priority
    - Working efficiently
*/

-- Insert Business Acumen category
INSERT INTO maturity_categories (id, name, description, display_order)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Business Acumen',
  'A Ramsey Creative knows what lifts the business, prioritizes effectively, and aligns design effort to value.',
  1
)
ON CONFLICT (id) DO NOTHING;

-- Insert Skills for Business Acumen
INSERT INTO maturity_skills (id, category_id, name, description, display_order)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Discerning how much time to spend on work',
    '',
    1
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Creating multiple solutions to find value early',
    '',
    2
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Following results to ensure outcomes',
    '',
    3
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Pointing work to the business priority',
    '',
    4
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Working efficiently',
    '',
    5
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Skill Levels for "Discerning how much time to spend on work"
INSERT INTO maturity_skill_levels (skill_id, level_name, level_order, description)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    'Associate',
    1,
    'Learns that different work has different value.'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'Level 1',
    2,
    'Articulates how time spent should vary based on value.'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'Level 2',
    3,
    'Consistently invests the right level of effort relative to impact.'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'Senior',
    4,
    'Holds teams accountable to right-sizing effort.'
  ),
  (
    '00000000-0000-0000-0001-000000000001',
    'Lead',
    5,
    'Coaches others on evaluating effort vs impact.'
  );

-- Insert Skill Levels for "Creating multiple solutions to find value early"
INSERT INTO maturity_skill_levels (skill_id, level_name, level_order, description)
VALUES
  (
    '00000000-0000-0000-0001-000000000002',
    'Associate',
    1,
    'Learns to ship work quickly.'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Level 1',
    2,
    'Creates multiple options and seeks early feedback.'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Level 2',
    3,
    'Rapidly explores multiple solutions with customer input.'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Senior',
    4,
    'Models comfort sharing work early and unfinished.'
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    'Lead',
    5,
    'Coaches others on divergent thinking and early validation.'
  );

-- Insert Skill Levels for "Following results to ensure outcomes"
INSERT INTO maturity_skill_levels (skill_id, level_name, level_order, description)
VALUES
  (
    '00000000-0000-0000-0001-000000000003',
    'Associate',
    1,
    'Learns what results matter.'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Level 1',
    2,
    'Articulates success criteria for their work.'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Level 2',
    3,
    'Seeks results of shipped work and reflects on learnings.'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Senior',
    4,
    'Partners cross-functionally to surface outcomes and insights.'
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    'Lead',
    5,
    'Coaches others on outcome analysis and evidence-based decisions.'
  );

-- Insert Skill Levels for "Pointing work to the business priority"
INSERT INTO maturity_skill_levels (skill_id, level_name, level_order, description)
VALUES
  (
    '00000000-0000-0000-0001-000000000004',
    'Associate',
    1,
    'Learns about the business and brand priorities.'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    'Level 1',
    2,
    'Clearly articulates how work supports priorities.'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    'Level 2',
    3,
    'Consistently aligns work to business objectives.'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    'Senior',
    4,
    'Holds teams accountable to staying focused on priorities.'
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    'Lead',
    5,
    'Coaches others to connect user needs to business outcomes.'
  );

-- Insert Skill Levels for "Working efficiently"
INSERT INTO maturity_skill_levels (skill_id, level_name, level_order, description)
VALUES
  (
    '00000000-0000-0000-0001-000000000005',
    'Associate',
    1,
    'Learns how work gets done.'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    'Level 1',
    2,
    'Explains workflows and keeps work organized.'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    'Level 2',
    3,
    'Improves efficiency through templates, reuse, and process improvements.'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    'Senior',
    4,
    'Simplifies production and removes friction for speed.'
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    'Lead',
    5,
    'Coaches others and scales efficient ways of working across teams.'
  );