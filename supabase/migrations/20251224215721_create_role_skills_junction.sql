/*
  # Create Role-Skills Junction Table

  1. New Tables
    - `role_skills`
      - `id` (uuid, primary key)
      - `role_id` (uuid, FK to roles)
      - `skill_id` (uuid, FK to maturity_skills)
      - `display_order` (integer) - Optional ordering
      - `created_at` (timestamptz)
      - UNIQUE constraint on (role_id, skill_id)
  
  2. Security
    - Enable RLS on `role_skills` table
    - Authenticated users can manage role-skill associations

  3. Important Notes
    - This creates a direct many-to-many relationship between roles and skills
    - Replaces the indirect relationship via categories and maturity models
*/

CREATE TABLE IF NOT EXISTS role_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, skill_id)
);

ALTER TABLE role_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view role skills"
  ON role_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert role skills"
  ON role_skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update role skills"
  ON role_skills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete role skills"
  ON role_skills FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_role_skills_role ON role_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_role_skills_skill ON role_skills(skill_id);
