/*
  # Fix RLS auth.uid() Per-Row Evaluation Performance

  ## Performance Issue
  Several RLS policies call `auth.uid()` directly, which causes the function to be
  re-evaluated for every row scanned. Wrapping it in `(SELECT auth.uid())` causes
  it to be evaluated once per query, significantly improving performance at scale.

  ## Tables Fixed
  - `cadence_schedules` — "Managers can view cadence for their team"
  - `checkin_prep_checklists` — all 4 policies
  - `calendar_invite_templates` — all 4 policies

  ## Also Fixed
  - `cadence_schedules` had both a "manage" (ALL) and a "view" (SELECT) policy — the
    redundant SELECT policy is removed since the ALL policy already covers SELECT.
*/

-- cadence_schedules: drop redundant SELECT policy (ALL policy already covers SELECT)
DROP POLICY IF EXISTS "Managers can view cadence for their team" ON cadence_schedules;

-- checkin_prep_checklists: rebuild all 4 policies with (SELECT auth.uid())
DROP POLICY IF EXISTS "Managers can view their team's checklists" ON checkin_prep_checklists;
DROP POLICY IF EXISTS "Managers can create checklists for their team" ON checkin_prep_checklists;
DROP POLICY IF EXISTS "Managers can update their team's checklists" ON checkin_prep_checklists;
DROP POLICY IF EXISTS "Managers can delete their team's checklists" ON checkin_prep_checklists;

CREATE POLICY "Managers can view their team's checklists"
  ON checkin_prep_checklists FOR SELECT
  TO authenticated
  USING (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can create checklists for their team"
  ON checkin_prep_checklists FOR INSERT
  TO authenticated
  WITH CHECK (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can update their team's checklists"
  ON checkin_prep_checklists FOR UPDATE
  TO authenticated
  USING (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Managers can delete their team's checklists"
  ON checkin_prep_checklists FOR DELETE
  TO authenticated
  USING (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = checkin_prep_checklists.team_member_id
        AND team_members.manager_id = (SELECT auth.uid())
    )
  );

-- calendar_invite_templates: rebuild all 4 policies with (SELECT auth.uid())
DROP POLICY IF EXISTS "Managers can view their own templates" ON calendar_invite_templates;
DROP POLICY IF EXISTS "Managers can create their own templates" ON calendar_invite_templates;
DROP POLICY IF EXISTS "Managers can update their own templates" ON calendar_invite_templates;
DROP POLICY IF EXISTS "Managers can delete their own templates" ON calendar_invite_templates;

CREATE POLICY "Managers can view their own templates"
  ON calendar_invite_templates FOR SELECT
  TO authenticated
  USING (manager_id = (SELECT auth.uid()));

CREATE POLICY "Managers can create their own templates"
  ON calendar_invite_templates FOR INSERT
  TO authenticated
  WITH CHECK (manager_id = (SELECT auth.uid()));

CREATE POLICY "Managers can update their own templates"
  ON calendar_invite_templates FOR UPDATE
  TO authenticated
  USING (manager_id = (SELECT auth.uid()))
  WITH CHECK (manager_id = (SELECT auth.uid()));

CREATE POLICY "Managers can delete their own templates"
  ON calendar_invite_templates FOR DELETE
  TO authenticated
  USING (manager_id = (SELECT auth.uid()));
