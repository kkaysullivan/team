/*
  # Scope team_members SELECT policy to manager's own team

  ## Summary
  The existing SELECT policy allows all authenticated users to see all team members.
  This migration replaces it with a scoped policy so that:
  - Managers can only see team members where manager_id = their user id
  - Team members can see their own record (where user_id = their user id)
  - Super admins can see all team members

  ## Changes
  - Drop the overly permissive "Authenticated users can view team members" policy
  - Add three separate SELECT policies for proper scoping
*/

DROP POLICY IF EXISTS "Authenticated users can view team members" ON team_members;

CREATE POLICY "Managers can view their own team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (( SELECT auth.uid() AS uid) = manager_id);

CREATE POLICY "Team members can view their own record"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (( SELECT auth.uid() AS uid) = user_id);

CREATE POLICY "Super admins can view all team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (is_super_admin());
