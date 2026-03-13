/*
  # Fix maturity_skills write permissions

  1. Changes
    - Drop overly restrictive policies that block all writes
    - Add new policies allowing authenticated users to insert, update, and delete skills
    - Maintain read access for both authenticated and anonymous users

  2. Security
    - Only authenticated users can modify skills (create, update, delete)
    - Read access remains open for all users
*/

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Only managers with proper access can insert maturity skills" ON maturity_skills;
DROP POLICY IF EXISTS "Only managers with proper access can update maturity skills" ON maturity_skills;
DROP POLICY IF EXISTS "Only managers with proper access can delete maturity skills" ON maturity_skills;

-- Add new policies that allow authenticated users to manage skills
CREATE POLICY "Authenticated users can insert maturity skills"
  ON maturity_skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maturity skills"
  ON maturity_skills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maturity skills"
  ON maturity_skills FOR DELETE
  TO authenticated
  USING (true);
