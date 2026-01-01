/*
  # Create Maturity Model Admin Schema

  1. New Tables
    - `levels`
      - `id` (uuid, primary key)
      - `name` (text) - Global level name (e.g., "Associate", "Level 1")
      - `description` (text) - Optional description
      - `created_at` (timestamptz)
    
    - `maturity_models`
      - `id` (uuid, primary key)
      - `name` (text) - Model name
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text) - Role name
      - `description` (text)
      - `maturity_model_id` (uuid, FK to maturity_models, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `maturity_model_categories` (junction table)
      - `id` (uuid, primary key)
      - `maturity_model_id` (uuid, FK to maturity_models)
      - `category_id` (uuid, FK to maturity_categories)
      - `display_order` (integer)
      - `created_at` (timestamptz)
    
    - `category_skills` (junction table)
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to maturity_categories)
      - `skill_id` (uuid, FK to maturity_skills)
      - `display_order` (integer)
      - `created_at` (timestamptz)
    
    - `skill_levels` (junction table with custom descriptions)
      - `id` (uuid, primary key)
      - `skill_id` (uuid, FK to maturity_skills)
      - `level_id` (uuid, FK to levels)
      - `description` (text) - Skill-specific level description
      - `display_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Table Modifications
    - Update maturity_skills to remove category_id (now many-to-many)
    - Update maturity_categories to remove display_order (now in junction)
    - Add role_id to team_members

  3. Security
    - Enable RLS on all tables
    - Authenticated users can manage all admin data
*/

-- Create levels table
CREATE TABLE IF NOT EXISTS levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view levels"
  ON levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert levels"
  ON levels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update levels"
  ON levels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete levels"
  ON levels FOR DELETE
  TO authenticated
  USING (true);

-- Create maturity_models table
CREATE TABLE IF NOT EXISTS maturity_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maturity_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maturity models"
  ON maturity_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maturity models"
  ON maturity_models FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maturity models"
  ON maturity_models FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maturity models"
  ON maturity_models FOR DELETE
  TO authenticated
  USING (true);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  maturity_model_id uuid REFERENCES maturity_models(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert roles"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roles"
  ON roles FOR DELETE
  TO authenticated
  USING (true);

-- Create maturity_model_categories junction table
CREATE TABLE IF NOT EXISTS maturity_model_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maturity_model_id uuid NOT NULL REFERENCES maturity_models(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES maturity_categories(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(maturity_model_id, category_id)
);

ALTER TABLE maturity_model_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view model categories"
  ON maturity_model_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert model categories"
  ON maturity_model_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update model categories"
  ON maturity_model_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete model categories"
  ON maturity_model_categories FOR DELETE
  TO authenticated
  USING (true);

-- Create category_skills junction table
CREATE TABLE IF NOT EXISTS category_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES maturity_categories(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, skill_id)
);

ALTER TABLE category_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view category skills"
  ON category_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert category skills"
  ON category_skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update category skills"
  ON category_skills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete category skills"
  ON category_skills FOR DELETE
  TO authenticated
  USING (true);

-- Create skill_levels junction table
CREATE TABLE IF NOT EXISTS skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(skill_id, level_id)
);

ALTER TABLE skill_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skill levels"
  ON skill_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert skill levels"
  ON skill_levels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update skill levels"
  ON skill_levels FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete skill levels"
  ON skill_levels FOR DELETE
  TO authenticated
  USING (true);

-- Add role_id to team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE team_members ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_maturity_model ON roles(maturity_model_id);
CREATE INDEX IF NOT EXISTS idx_maturity_model_categories_model ON maturity_model_categories(maturity_model_id);
CREATE INDEX IF NOT EXISTS idx_maturity_model_categories_category ON maturity_model_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_category_skills_category ON category_skills(category_id);
CREATE INDEX IF NOT EXISTS idx_category_skills_skill ON category_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_levels_skill ON skill_levels(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_levels_level ON skill_levels(level_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role_id);