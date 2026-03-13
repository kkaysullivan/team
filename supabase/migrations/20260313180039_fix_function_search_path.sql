/*
  # Fix Mutable search_path on link_team_member_to_user Function

  ## Security Issue
  The function `public.link_team_member_to_user` has a mutable search_path,
  which means a malicious user could potentially manipulate the search_path
  to cause the function to call unintended objects.

  ## Fix
  Recreate the function with `SET search_path = ''` and use fully-qualified
  schema names (public., auth.) throughout the function body.
*/

CREATE OR REPLACE FUNCTION public.link_team_member_to_user(
  p_team_member_id uuid,
  p_user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid;
  v_manager_id uuid;
BEGIN
  SELECT manager_id INTO v_manager_id
  FROM public.team_members
  WHERE id = p_team_member_id;

  IF v_manager_id IS NULL THEN
    RETURN json_build_object('error', 'Team member not found');
  END IF;

  IF v_manager_id != auth.uid() THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User account not found with that email');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = v_user_id
      AND id != p_team_member_id
  ) THEN
    RETURN json_build_object('error', 'User account is already linked to another team member');
  END IF;

  UPDATE public.team_members
  SET user_id = v_user_id
  WHERE id = p_team_member_id;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$function$;
