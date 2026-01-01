/*
  # Seed Collaboration Category

  1. Inserts
    - Collaboration category
    - 4 skills under Collaboration (Human Skills subcategory)
    - Level descriptions for each skill across 5 levels (Associate, Level 1, Level 2, Senior, Lead)
  
  2. Description
    - Category: "A Ramsey Creative is a joy to work with — empathetic, aligned, and proactive in feedback."
    - Skills:
      1. Applying feedback from peers about their work
      2. Keeping a group going the same direction
      3. Showing empathy for other discipline responsibilities
      4. Trio collaboration
*/

-- Insert Collaboration category
INSERT INTO maturity_categories (id, name, description)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  'Collaboration',
  'A Ramsey Creative is a joy to work with — empathetic, aligned, and proactive in feedback.'
)
ON CONFLICT (id) DO NOTHING;

-- Insert skills
INSERT INTO maturity_skills (id, name, description, display_order) VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    'Applying feedback from peers about their work',
    'Human Skills',
    1
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'Keeping a group going the same direction',
    'Human Skills',
    2
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'Showing empathy for other discipline responsibilities',
    'Human Skills',
    3
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    'Trio collaboration',
    'Human Skills',
    4
  )
ON CONFLICT (id) DO NOTHING;

-- Link skills to Collaboration category
INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1),
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 2),
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 3),
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 4)
ON CONFLICT DO NOTHING;

-- Skill 1: Applying feedback from peers about their work
INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Learns to receive feedback from PMs, Engineers, and peers.',
    1
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Applies feedback and learns when and how to incorporate cross-discipline input.',
    2
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    'Consistently seeks and applies feedback during ideation and synthesis.',
    3
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    'Seeks feedback before decisions harden and integrates it into problem framing.',
    4
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000005',
    'Coaches teams to use feedback as an ongoing learning loop.',
    5
  )
ON CONFLICT DO NOTHING;

-- Skill 2: Keeping a group going the same direction
INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Learns squad goals and how design work connects to them.',
    1
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Articulates squad goals and how current work supports them.',
    2
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    'Reinforces direction using shared artifacts (flows, OST nodes).',
    3
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000004',
    'Guides trio alignment through clarified opportunities and tradeoffs.',
    4
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000005',
    'Resolves cross-squad misalignment and coaches teams on shared direction.',
    5
  )
ON CONFLICT DO NOTHING;

-- Skill 3: Showing empathy for other discipline responsibilities
INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  (
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Learns PM and Engineering roles in discovery and delivery.',
    1
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Articulates PM and Engineering responsibilities and constraints.',
    2
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'Adapts design approach based on PM and Engineering realities.',
    3
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004',
    'Shares accountability for outcomes, not just design output.',
    4
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    'Coaches PMs and Engineers on shared ownership and healthy role boundaries.',
    5
  )
ON CONFLICT DO NOTHING;

-- Skill 4: Trio collaboration
INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  (
    '50000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Joins trio rituals and contributes notes and synthesis.',
    1
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Participates consistently in interviews, synthesis, and planning.',
    2
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    'Co-facilitates ideation, updates OSTs, raises usability risks.',
    3
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    'Leads discovery activities and drives trio alignment on priorities.',
    4
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000005',
    'Coaches PMs and Engineers on discovery practices and improves cadence across squads.',
    5
  )
ON CONFLICT DO NOTHING;