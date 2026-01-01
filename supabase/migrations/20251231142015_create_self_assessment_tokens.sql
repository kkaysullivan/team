/*
  # Create Self-Assessment Tokens Table

  1. New Tables
    - `self_assessment_tokens`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, foreign key to team_members)
      - `token` (text, unique) - secure token for shareable link
      - `expires_at` (timestamptz) - expiration date
      - `completed_at` (timestamptz, nullable) - when assessment was completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `self_assessment_tokens` table
    - Policy for managers to create and view tokens for their team members
    - Policy for public access to validate tokens (no auth required)

  3. Notes
    - Tokens are used to generate shareable links for team members to complete self-assessments
    - Links expire after 30 days by default
    - Once completed, tokens can be reused until expiration
*/

CREATE TABLE IF NOT EXISTS self_assessment_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE self_assessment_tokens ENABLE ROW LEVEL SECURITY;

-- Policy for managers to create and view tokens for their team members
CREATE POLICY "Managers can manage tokens for their team members"
  ON self_assessment_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = self_assessment_tokens.team_member_id
      AND team_members.manager_id = auth.uid()
    )
  );

-- Policy for public access to validate and use tokens (no authentication required)
CREATE POLICY "Anyone can read valid tokens"
  ON self_assessment_tokens
  FOR SELECT
  TO anon
  USING (expires_at > now());

-- Policy for public to update completion status
CREATE POLICY "Anyone can update token completion"
  ON self_assessment_tokens
  FOR UPDATE
  TO anon
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_self_assessment_tokens_token ON self_assessment_tokens(token);
CREATE INDEX IF NOT EXISTS idx_self_assessment_tokens_team_member ON self_assessment_tokens(team_member_id);
