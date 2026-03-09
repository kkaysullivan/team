/*
  # Add Write Policies for Category Skills

  1. Security Changes
    - Add INSERT policy for authenticated users on category_skills table
    - Add UPDATE policy for authenticated users on category_skills table
    - Add DELETE policy for authenticated users on category_skills table
    
  These policies allow authenticated users (admins) to manage skill assignments to categories
  and update display ordering.
*/

-- Allow authenticated users to insert category-skill associations
CREATE POLICY "Authenticated users can insert category skills"
  ON category_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update category-skill associations (needed for sorting)
CREATE POLICY "Authenticated users can update category skills"
  ON category_skills
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete category-skill associations
CREATE POLICY "Authenticated users can delete category skills"
  ON category_skills
  FOR DELETE
  TO authenticated
  USING (true);
