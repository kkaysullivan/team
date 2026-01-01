/*
  # Add Role Assignment to Team Members

  1. Schema Changes
    - Add `role_id` column to `team_members` table
    - This allows assigning a role (and thus maturity model) to each team member
    - The existing `role` text column will be kept for backwards compatibility but can be deprecated later
    
  2. Important Notes
    - `role_id` is nullable to allow team members without assigned roles
    - Foreign key references the `roles` table
    - Team members will inherit their maturity model through their assigned role
*/

-- Add role_id to team_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE team_members ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role_id);
