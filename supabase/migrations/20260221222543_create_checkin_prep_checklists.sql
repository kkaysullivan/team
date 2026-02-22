/*
  # Create Check-In Preparation Checklists

  1. New Tables
    - `checkin_prep_checklists`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, foreign key to team_members)
      - `manager_id` (uuid, foreign key to auth.users)
      - `checkin_date` (date) - The scheduled check-in date
      - `anniversary_date` (date) - The team member's anniversary date
      - `checklist_data` (jsonb) - Stores all checklist item states
      - `notes` (text) - Additional notes for the prep process
      - `status` (text) - Overall status: 'not_started', 'in_progress', 'completed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `checkin_prep_checklists` table
    - Add policies for managers to manage their team's checklists
    - Add policies for managers to read checklists for team members they manage

  3. Important Notes
    - The checklist_data JSONB field will store the state of all checklist items
    - Each checklist is tied to a specific team member and their manager
    - Managers can only access checklists for their direct reports
*/

-- Create the checkin_prep_checklists table
CREATE TABLE IF NOT EXISTS checkin_prep_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date date,
  anniversary_date date,
  checklist_data jsonb DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  status text DEFAULT 'not_started',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_checkin_prep_team_member_id 
  ON checkin_prep_checklists(team_member_id);

CREATE INDEX IF NOT EXISTS idx_checkin_prep_manager_id 
  ON checkin_prep_checklists(manager_id);

CREATE INDEX IF NOT EXISTS idx_checkin_prep_status 
  ON checkin_prep_checklists(status);

-- Enable RLS
ALTER TABLE checkin_prep_checklists ENABLE ROW LEVEL SECURITY;

-- Policy: Managers can view checklists for their team members
CREATE POLICY "Managers can view their team's checklists"
  ON checkin_prep_checklists
  FOR SELECT
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Policy: Managers can create checklists for their team members
CREATE POLICY "Managers can create checklists for their team"
  ON checkin_prep_checklists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    manager_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Policy: Managers can update checklists for their team members
CREATE POLICY "Managers can update their team's checklists"
  ON checkin_prep_checklists
  FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    manager_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Policy: Managers can delete checklists for their team members
CREATE POLICY "Managers can delete their team's checklists"
  ON checkin_prep_checklists
  FOR DELETE
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );
