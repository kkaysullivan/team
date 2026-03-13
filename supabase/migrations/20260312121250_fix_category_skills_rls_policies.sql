/*
  # Fix Category Skills RLS Policies

  1. Security Changes
    - Drop old restrictive policies that block all writes
    - Create new policies allowing authenticated users to manage category skills
  
  2. Notes
    - The old policies had `false` conditions blocking all operations
    - New policies allow authenticated users full access to manage category-skill associations
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Only managers with proper access can insert category skills" ON category_skills;
DROP POLICY IF EXISTS "Only managers with proper access can update category skills" ON category_skills;
DROP POLICY IF EXISTS "Only managers with proper access can delete category skills" ON category_skills;

-- Create new permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert category skills"
  ON category_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update category skills"
  ON category_skills
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete category skills"
  ON category_skills
  FOR DELETE
  TO authenticated
  USING (true);
