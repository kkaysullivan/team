/*
  # Add Write Policies for Skill Levels

  1. Security Changes
    - Add INSERT policy for authenticated users to create skill levels
    - Add UPDATE policy for authenticated users to modify skill levels
    - Add DELETE policy for authenticated users to remove skill levels
  
  2. Notes
    - These policies allow any authenticated user to manage skill levels
    - This matches the existing pattern for other admin tables in the system
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_levels' 
    AND policyname = 'Authenticated users can insert skill levels'
  ) THEN
    CREATE POLICY "Authenticated users can insert skill levels"
      ON skill_levels
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_levels' 
    AND policyname = 'Authenticated users can update skill levels'
  ) THEN
    CREATE POLICY "Authenticated users can update skill levels"
      ON skill_levels
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skill_levels' 
    AND policyname = 'Authenticated users can delete skill levels'
  ) THEN
    CREATE POLICY "Authenticated users can delete skill levels"
      ON skill_levels
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
