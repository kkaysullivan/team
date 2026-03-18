/*
  # Add write policies for roles table

  ## Changes
  - Add INSERT policy allowing authenticated users to create roles
  - Add UPDATE policy allowing authenticated users to update roles
  - Add DELETE policy allowing authenticated users to delete roles

  ## Notes
  The roles table is admin-managed content. All authenticated users (managers)
  are permitted to write to this table, consistent with how other admin tables
  are managed in this application.
*/

CREATE POLICY "Authenticated users can insert roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roles"
  ON roles
  FOR DELETE
  TO authenticated
  USING (true);
