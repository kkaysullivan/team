/*
  # Update Growth Areas to Reference Skill Levels

  1. Changes
    - Drop the existing foreign key constraint from growth_areas.skill_id to maturity_skills.id
    - Add a new foreign key constraint from growth_areas.skill_id to skill_levels.id
    - This allows tracking specific skill-level combinations rather than just generic skills

  2. Security
    - No changes to RLS policies
*/

DO $$
BEGIN
  -- Drop the existing foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'growth_areas_skill_id_fkey'
    AND table_name = 'growth_areas'
  ) THEN
    ALTER TABLE growth_areas DROP CONSTRAINT growth_areas_skill_id_fkey;
  END IF;

  -- Add new foreign key constraint to skill_levels
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'growth_areas_skill_level_id_fkey'
    AND table_name = 'growth_areas'
  ) THEN
    ALTER TABLE growth_areas 
    ADD CONSTRAINT growth_areas_skill_level_id_fkey 
    FOREIGN KEY (skill_id) 
    REFERENCES skill_levels(id) 
    ON DELETE CASCADE;
  END IF;
END $$;
