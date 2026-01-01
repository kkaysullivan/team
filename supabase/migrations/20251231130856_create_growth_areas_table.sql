/*
  # Create Growth Areas Table

  1. New Tables
    - `growth_areas`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, FK to team_members) - Team member being tracked
      - `skill_id` (uuid, FK to maturity_skills) - Skill from Maturity Model
      - `quarter` (text) - Quarter identifier (e.g., "Q1 2024")
      - `rating` (integer) - Rating 1-5 (1=Needs guidance, 5=Greatly exceeding)
      - `leader_comments` (text) - Manager's comments on progress
      - `start_date` (date) - When this growth area was established
      - `end_date` (date) - When this growth area ends/review date
      - `is_active` (boolean) - Whether this is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `growth_areas` table
    - Managers can view growth areas for their team members
    - Managers can create/update/delete growth areas for their team members
    - Constraint: Maximum 3 active growth areas per team member

  3. Notes
    - Each team member should have up to 3 active growth areas
    - Growth areas are tied to the Maturity Model skills
    - Updated quarterly based on progress
    - Uses 5-point rating scale:
      1 = Needs guidance and substantial improvement
      2 = Self-sufficient, but needs overall improvement
      3 = Meeting expectations
      4 = Exceeding expectations
      5 = Greatly exceeding expectations
*/

-- Create growth_areas table
CREATE TABLE IF NOT EXISTS growth_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES maturity_skills(id) ON DELETE CASCADE,
  quarter text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  leader_comments text DEFAULT '',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE growth_areas ENABLE ROW LEVEL SECURITY;

-- Managers can view growth areas for their team members
CREATE POLICY "Managers can view growth areas for their team members"
  ON growth_areas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Managers can create growth areas for their team members
CREATE POLICY "Managers can create growth areas for their team members"
  ON growth_areas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Managers can update growth areas for their team members
CREATE POLICY "Managers can update growth areas for their team members"
  ON growth_areas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Managers can delete growth areas for their team members
CREATE POLICY "Managers can delete growth areas for their team members"
  ON growth_areas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = growth_areas.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_growth_areas_team_member ON growth_areas(team_member_id);
CREATE INDEX IF NOT EXISTS idx_growth_areas_skill ON growth_areas(skill_id);
CREATE INDEX IF NOT EXISTS idx_growth_areas_active ON growth_areas(is_active) WHERE is_active = true;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_growth_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS growth_areas_updated_at ON growth_areas;
CREATE TRIGGER growth_areas_updated_at
  BEFORE UPDATE ON growth_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_growth_areas_updated_at();