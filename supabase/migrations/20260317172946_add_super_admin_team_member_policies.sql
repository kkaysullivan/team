/*
  # Add super admin policies for team_members table

  ## Changes
  - Super admins can insert team members for any manager
  - Super admins can update any team member
  - Super admins can delete any team member
*/

CREATE POLICY "Super admins can insert any team member"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update any team member"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can delete any team member"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (is_super_admin());
