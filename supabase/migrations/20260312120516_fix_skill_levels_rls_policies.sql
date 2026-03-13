/*
  # Fix Skill Levels RLS Policies

  1. Security Changes
    - Drop old restrictive policies that block all writes
    - Create new policies allowing authenticated users to manage skill levels
  
  2. Notes
    - The old policies had `false` conditions blocking all operations
    - New policies allow authenticated users full access to manage skill levels
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Only managers with proper access can insert skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Only managers with proper access can update skill levels" ON skill_levels;
DROP POLICY IF EXISTS "Only managers with proper access can delete skill levels" ON skill_levels;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert skill levels"
  ON skill_levels
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update skill levels"
  ON skill_levels
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete skill levels"
  ON skill_levels
  FOR DELETE
  TO authenticated
  USING (true);
