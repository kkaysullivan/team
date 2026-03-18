/*
  # Create super_admins table

  ## Summary
  Creates a super_admins table to designate certain users as super administrators
  who have full control over all users and team member assignments.

  ## New Tables
  - `super_admins`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) - the authenticated user granted super admin access
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled with strict policies
  - Only super admins can read the super_admins table
  - No self-registration: inserts/updates/deletes blocked at RLS level (managed via migrations only)

  ## Initial Data
  - Seeds kristy.sullivan@ramseysolutions.com as the first super admin
*/

CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super_admins table"
  ON super_admins
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins sa
      WHERE sa.user_id = (SELECT auth.uid())
    )
  );

INSERT INTO super_admins (user_id)
SELECT id FROM auth.users WHERE email = 'kristy.sullivan@ramseysolutions.com'
ON CONFLICT (user_id) DO NOTHING;
