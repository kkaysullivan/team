/*
  # Add User Account Linking Helper Function

  1. New Function
    - `link_team_member_to_user` - Links a team member to a user account by email
    - This allows managers to link team members to existing user accounts

  2. Security
    - Only managers can link their own team members to user accounts
    - Function verifies manager owns the team member before linking
*/

-- Create a function to link team members to user accounts by email
CREATE OR REPLACE FUNCTION link_team_member_to_user(
  p_team_member_id uuid,
  p_user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_manager_id uuid;
  v_result json;
BEGIN
  -- Check if the team member belongs to the current user (manager)
  SELECT manager_id INTO v_manager_id
  FROM team_members
  WHERE id = p_team_member_id;

  IF v_manager_id IS NULL THEN
    RETURN json_build_object('error', 'Team member not found');
  END IF;

  IF v_manager_id != auth.uid() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Look up user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User account not found with that email');
  END IF;

  -- Check if user is already linked to another team member
  IF EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = v_user_id
    AND id != p_team_member_id
  ) THEN
    RETURN json_build_object('error', 'User account is already linked to another team member');
  END IF;

  -- Link the team member to the user
  UPDATE team_members
  SET user_id = v_user_id
  WHERE id = p_team_member_id;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;