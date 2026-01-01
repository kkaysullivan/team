/*
  # Create Maturity Model Schema

  1. New Tables
    - `maturity_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (e.g., "Business Acumen")
      - `description` (text) - Category description
      - `display_order` (integer) - Order for display
      - `created_at` (timestamptz)
    
    - `maturity_skills`
      - `id` (uuid, primary key)
      - `category_id` (uuid, FK to maturity_categories)
      - `name` (text) - Skill name
      - `description` (text) - Skill description
      - `display_order` (integer) - Order within category
      - `created_at` (timestamptz)
    
    - `maturity_skill_levels`
      - `id` (uuid, primary key)
      - `skill_id` (uuid, FK to maturity_skills)
      - `level_name` (text) - Associate, Level 1, Level 2, Senior, Lead
      - `level_order` (integer) - 1, 2, 3, 4, 5
      - `description` (text) - Attribute description for this level
      - `created_at` (timestamptz)
    
    - `maturity_assessments`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, FK to team_members)
      - `assessor_id` (uuid, FK to auth.users) - Leader doing assessment
      - `skill_id` (uuid, FK to maturity_skills)
      - `assessed_level` (text) - Current assessed level
      - `notes` (text) - Optional notes
      - `assessed_at` (timestamptz) - When assessment was made
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can read all maturity model structure (categories, skills, levels)
    - Only managers can create/update assessments for their team members
    - Users can read assessments for their team members
*/

-- Create maturity_categories table
CREATE TABLE IF NOT EXISTS maturity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maturity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view maturity categories"
  ON maturity_categories FOR SELECT
  TO authenticated
  USING (true);

-- Create maturity_skills table
CREATE TABLE IF NOT EXISTS maturity_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES maturity_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maturity_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view maturity skills"
  ON maturity_skills FOR SELECT
  TO authenticated
  USING (true);

-- Create maturity_skill_levels table
CREATE TABLE IF NOT EXISTS maturity_skill_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  level_name text NOT NULL,
  level_order integer NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maturity_skill_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view maturity skill levels"
  ON maturity_skill_levels FOR SELECT
  TO authenticated
  USING (true);

-- Create maturity_assessments table
CREATE TABLE IF NOT EXISTS maturity_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assessor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  assessed_level text NOT NULL,
  notes text DEFAULT '',
  assessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maturity_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view assessments for their team members"
  ON maturity_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create assessments for their team members"
  ON maturity_assessments FOR INSERT
  TO authenticated
  WITH CHECK (
    assessor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update assessments for their team members"
  ON maturity_assessments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete assessments for their team members"
  ON maturity_assessments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = maturity_assessments.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maturity_skills_category ON maturity_skills(category_id);
CREATE INDEX IF NOT EXISTS idx_maturity_skill_levels_skill ON maturity_skill_levels(skill_id);
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_team_member ON maturity_assessments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_skill ON maturity_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_maturity_assessments_assessor ON maturity_assessments(assessor_id);