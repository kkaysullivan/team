/*
  # Fix team_members SELECT policy to allow all authenticated users to view team members

  ## Problem
  The current SELECT policy restricts team member visibility to only the manager
  whose manager_id matches auth.uid(). This breaks when a user logs in with a
  different account than the one used to create the team members.

  ## Change
  - Drop the overly restrictive SELECT policy
  - Replace with a policy that allows any authenticated user to view all team members
  
  This is appropriate for a single-organization app where all authenticated users
  are trusted managers/admins within the same team.
*/

DROP POLICY IF EXISTS "Authenticated users can view relevant team members" ON team_members;

CREATE POLICY "Authenticated users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);
