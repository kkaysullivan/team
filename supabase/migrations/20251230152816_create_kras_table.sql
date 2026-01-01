/*
  # Create KRAs (Key Result Areas) Table

  1. New Tables
    - `kras`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, foreign key to team_members)
      - `title` (text) - KRA title/name
      - `description` (text) - detailed description
      - `key_responsibilities` (text array) - list of responsibilities
      - `success_metrics` (text array) - measurable success criteria
      - `is_active` (boolean) - whether this is the current KRA
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `kras` table
    - Add policies for authenticated users to manage KRAs
*/

-- Create KRAs table
CREATE TABLE IF NOT EXISTS kras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  key_responsibilities text[] DEFAULT '{}',
  success_metrics text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kras ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view KRAs"
  ON kras
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert KRAs"
  ON kras
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update KRAs"
  ON kras
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete KRAs"
  ON kras
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_kras_team_member_id ON kras(team_member_id);
CREATE INDEX IF NOT EXISTS idx_kras_is_active ON kras(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_kras_updated_at_trigger ON kras;
CREATE TRIGGER update_kras_updated_at_trigger
  BEFORE UPDATE ON kras
  FOR EACH ROW
  EXECUTE FUNCTION update_kras_updated_at();