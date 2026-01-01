/*
  # Seed Default Levels and Migrate Existing Data

  1. Insert default levels (Associate, Level 1, Level 2, Senior, Lead)
  2. Migrate existing Business Acumen category data
  3. Create default maturity model and role
*/

-- Insert default levels
INSERT INTO levels (id, name, description) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Associate', 'Entry level position'),
  ('10000000-0000-0000-0000-000000000002', 'Level 1', 'Intermediate position'),
  ('10000000-0000-0000-0000-000000000003', 'Level 2', 'Advanced position'),
  ('10000000-0000-0000-0000-000000000004', 'Senior', 'Senior level position'),
  ('10000000-0000-0000-0000-000000000005', 'Lead', 'Leadership position')
ON CONFLICT (name) DO NOTHING;

-- Remove category_id from maturity_skills if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_skills' AND column_name = 'category_id'
  ) THEN
    -- First, migrate existing skills to the junction table
    INSERT INTO category_skills (category_id, skill_id, display_order)
    SELECT category_id, id, display_order
    FROM maturity_skills
    WHERE category_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    -- Then remove the column
    ALTER TABLE maturity_skills DROP COLUMN category_id;
  END IF;
END $$;

-- Remove display_order from maturity_skills if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_skills' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE maturity_skills DROP COLUMN display_order;
  END IF;
END $$;

-- Remove display_order from maturity_categories if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE maturity_categories DROP COLUMN display_order;
  END IF;
END $$;

-- Migrate existing skill levels to the new structure
INSERT INTO skill_levels (skill_id, level_id, description, display_order)
SELECT 
  msl.skill_id,
  CASE msl.level_name
    WHEN 'Associate' THEN '10000000-0000-0000-0000-000000000001'
    WHEN 'Level 1' THEN '10000000-0000-0000-0000-000000000002'
    WHEN 'Level 2' THEN '10000000-0000-0000-0000-000000000003'
    WHEN 'Senior' THEN '10000000-0000-0000-0000-000000000004'
    WHEN 'Lead' THEN '10000000-0000-0000-0000-000000000005'
  END::uuid,
  msl.description,
  msl.level_order
FROM maturity_skill_levels msl
WHERE msl.level_name IN ('Associate', 'Level 1', 'Level 2', 'Senior', 'Lead')
ON CONFLICT DO NOTHING;

-- Create a default maturity model for existing data
INSERT INTO maturity_models (id, name, description)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Default Creative Maturity Model',
  'Default maturity model for creative roles'
)
ON CONFLICT DO NOTHING;

-- Link existing Business Acumen category to the default model
INSERT INTO maturity_model_categories (maturity_model_id, category_id, display_order)
SELECT 
  '20000000-0000-0000-0000-000000000001'::uuid,
  id,
  1
FROM maturity_categories
WHERE name = 'Business Acumen'
ON CONFLICT DO NOTHING;

-- Create a default role
INSERT INTO roles (id, name, description, maturity_model_id)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  'Product Designer',
  'Product design role',
  '20000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;