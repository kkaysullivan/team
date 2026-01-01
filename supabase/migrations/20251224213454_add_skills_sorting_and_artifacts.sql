/*
  # Add Skills Sorting and Evidence & Artifacts

  1. Schema Changes
    - Add `display_order` column to `maturity_skills` table for global skill sorting
    
  2. New Tables
    - `skill_level_artifacts`
      - `id` (uuid, primary key)
      - `skill_level_id` (uuid, FK to skill_levels)
      - `artifact` (text) - Evidence or artifact description
      - `display_order` (integer) - Sort order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `skill_level_artifacts` table
    - Add policies for authenticated users to manage artifacts
*/

-- Add display_order to maturity_skills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_skills' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE maturity_skills ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Initialize display_order for existing skills based on creation time
UPDATE maturity_skills
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM maturity_skills
) AS subquery
WHERE maturity_skills.id = subquery.id AND maturity_skills.display_order = 0;

-- Create skill_level_artifacts table
CREATE TABLE IF NOT EXISTS skill_level_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_level_id uuid NOT NULL REFERENCES skill_levels(id) ON DELETE CASCADE,
  artifact text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE skill_level_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view skill level artifacts"
  ON skill_level_artifacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert skill level artifacts"
  ON skill_level_artifacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update skill level artifacts"
  ON skill_level_artifacts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete skill level artifacts"
  ON skill_level_artifacts FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skill_level_artifacts_skill_level ON skill_level_artifacts(skill_level_id);
CREATE INDEX IF NOT EXISTS idx_maturity_skills_display_order ON maturity_skills(display_order);