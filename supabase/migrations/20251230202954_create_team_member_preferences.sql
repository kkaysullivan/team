/*
  # Team Member Preferences

  1. New Tables
    - `team_member_preferences`
      - `id` (uuid, primary key) - Unique identifier for the preference
      - `team_member_id` (uuid, foreign key) - References team_members table
      - `category` (text) - Category of the preference (e.g., "Drink", "Color", "Restaurant")
      - `value` (text) - The preference value
      - `icon` (text, nullable) - Optional emoji or icon identifier
      - `display_order` (integer) - Order for displaying preferences
      - `created_at` (timestamptz) - When the preference was created
      - `updated_at` (timestamptz) - When the preference was last updated

  2. Security
    - Enable RLS on `team_member_preferences` table
    - Add policy for authenticated users to read all preferences
    - Add policy for authenticated users to manage preferences

  3. Indexes
    - Create index on team_member_id for faster lookups
    - Create unique constraint on (team_member_id, category) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS team_member_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  category text NOT NULL,
  value text NOT NULL DEFAULT '',
  icon text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_team_member_category UNIQUE (team_member_id, category)
);

CREATE INDEX IF NOT EXISTS idx_team_member_preferences_team_member_id 
  ON team_member_preferences(team_member_id);

ALTER TABLE team_member_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all preferences"
  ON team_member_preferences
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert preferences"
  ON team_member_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update preferences"
  ON team_member_preferences
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete preferences"
  ON team_member_preferences
  FOR DELETE
  TO authenticated
  USING (true);