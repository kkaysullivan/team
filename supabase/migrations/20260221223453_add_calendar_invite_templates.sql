/*
  # Add Calendar Invite Templates

  1. New Tables
    - `calendar_invite_templates`
      - `id` (uuid, primary key)
      - `manager_id` (uuid, foreign key to auth.users)
      - `template_name` (text) - Name/description of the template
      - `subject_template` (text) - Subject line with placeholder
      - `body_template` (text) - Body content with placeholder
      - `is_default` (boolean) - Whether this is the default template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `calendar_invite_templates` table
    - Add policies for managers to manage their own templates

  3. Important Notes
    - Templates use [TeamMember] placeholder that gets replaced with actual name
    - Each manager can have their own customized templates
    - System provides a default template on first use
*/

CREATE TABLE IF NOT EXISTS calendar_invite_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name text DEFAULT 'Annual Check-In Invite',
  subject_template text NOT NULL,
  body_template text NOT NULL,
  is_default boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_templates_manager_id 
  ON calendar_invite_templates(manager_id);

ALTER TABLE calendar_invite_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their own templates"
  ON calendar_invite_templates
  FOR SELECT
  TO authenticated
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can create their own templates"
  ON calendar_invite_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Managers can update their own templates"
  ON calendar_invite_templates
  FOR UPDATE
  TO authenticated
  USING (manager_id = auth.uid())
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Managers can delete their own templates"
  ON calendar_invite_templates
  FOR DELETE
  TO authenticated
  USING (manager_id = auth.uid());
