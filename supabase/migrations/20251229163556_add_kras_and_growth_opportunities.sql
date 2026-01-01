/*
  # Add KRAs and Growth Opportunities

  1. New Tables
    - `key_result_areas`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `manager_id` (uuid, references auth.users)
      - `title` (text) - KRA title
      - `description` (text, nullable) - KRA description
      - `target` (text, nullable) - Target or goal
      - `status` (text) - active, completed, archived
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `growth_opportunities`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `manager_id` (uuid, references auth.users)
      - `opportunity` (text) - Growth opportunity description
      - `action_plan` (text, nullable) - Action plan to achieve
      - `priority` (integer) - 1, 2, or 3 for top 3
      - `status` (text) - active, in_progress, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Managers can only access their own team's data
    - All operations restricted to authenticated users
*/

-- Key Result Areas Table
CREATE TABLE IF NOT EXISTS key_result_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target text,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE key_result_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their team's KRAs"
  ON key_result_areas FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert their team's KRAs"
  ON key_result_areas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update their team's KRAs"
  ON key_result_areas FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their team's KRAs"
  ON key_result_areas FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Growth Opportunities Table
CREATE TABLE IF NOT EXISTS growth_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity text NOT NULL,
  action_plan text,
  priority integer NOT NULL CHECK (priority BETWEEN 1 AND 3),
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE growth_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their team's growth opportunities"
  ON growth_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert their team's growth opportunities"
  ON growth_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update their team's growth opportunities"
  ON growth_opportunities FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their team's growth opportunities"
  ON growth_opportunities FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_key_result_areas_team_member_id ON key_result_areas(team_member_id);
CREATE INDEX IF NOT EXISTS idx_key_result_areas_manager_id ON key_result_areas(manager_id);
CREATE INDEX IF NOT EXISTS idx_growth_opportunities_team_member_id ON growth_opportunities(team_member_id);
CREATE INDEX IF NOT EXISTS idx_growth_opportunities_manager_id ON growth_opportunities(manager_id);
