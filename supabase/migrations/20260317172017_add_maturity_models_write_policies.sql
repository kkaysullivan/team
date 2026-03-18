/*
  # Add write policies for maturity_models table

  ## Changes
  - Add INSERT policy allowing authenticated users to create maturity models
  - Add UPDATE policy allowing authenticated users to update maturity models
  - Add DELETE policy allowing authenticated users to delete maturity models
*/

CREATE POLICY "Authenticated users can insert maturity models"
  ON maturity_models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maturity models"
  ON maturity_models
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete maturity models"
  ON maturity_models
  FOR DELETE
  TO authenticated
  USING (true);
