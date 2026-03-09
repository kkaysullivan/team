/*
  # Add Write Policies for Maturity Skills

  1. Security Changes
    - Add INSERT policy for authenticated users on maturity_skills table
    - Add UPDATE policy for authenticated users on maturity_skills table
    - Add DELETE policy for authenticated users on maturity_skills table
    
  These policies allow authenticated users (admins) to manage skills in the system.
*/

-- Allow authenticated users to insert new skills
CREATE POLICY "Authenticated users can insert maturity skills"
  ON maturity_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update skills
CREATE POLICY "Authenticated users can update maturity skills"
  ON maturity_skills
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete skills
CREATE POLICY "Authenticated users can delete maturity skills"
  ON maturity_skills
  FOR DELETE
  TO authenticated
  USING (true);
