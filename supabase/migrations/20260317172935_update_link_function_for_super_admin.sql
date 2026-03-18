/*
  # Update link_team_member_to_user function for super admin access

  ## Changes
  - Super admins can link any team member to any user account
  - Also adds a new unlink_team_member function for super admins to remove user links
  - Adds helper function is_super_admin() for RLS and application use
*/

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION link_team_member_to_user(
  p_team_member_id uuid,
  p_user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_manager_id uuid;
BEGIN
  SELECT manager_id INTO v_manager_id
  FROM team_members
  WHERE id = p_team_member_id;

  IF v_manager_id IS NULL THEN
    RETURN json_build_object('error', 'Team member not found');
  END IF;

  IF v_manager_id != (SELECT auth.uid()) AND NOT is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized: you do not manage this team member');
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'No user account found with that email address');
  END IF;

  UPDATE team_members
  SET user_id = v_user_id
  WHERE id = p_team_member_id;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION unlink_team_member_from_user(
  p_team_member_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id uuid;
BEGIN
  SELECT manager_id INTO v_manager_id
  FROM team_members
  WHERE id = p_team_member_id;

  IF v_manager_id IS NULL THEN
    RETURN json_build_object('error', 'Team member not found');
  END IF;

  IF v_manager_id != (SELECT auth.uid()) AND NOT is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  UPDATE team_members
  SET user_id = NULL
  WHERE id = p_team_member_id;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION reassign_team_member_manager(
  p_team_member_id uuid,
  p_new_manager_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_super_admin() THEN
    RETURN json_build_object('error', 'Unauthorized: super admin access required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_new_manager_id) THEN
    RETURN json_build_object('error', 'Manager user not found');
  END IF;

  UPDATE team_members
  SET manager_id = p_new_manager_id
  WHERE id = p_team_member_id;

  RETURN json_build_object('success', true);
END;
$$;
