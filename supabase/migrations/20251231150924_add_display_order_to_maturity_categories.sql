/*
  # Add display_order back to maturity_categories

  1. Changes
    - Add display_order column to maturity_categories table
    - Set default values for existing rows based on name order
    
  2. Security
    - No RLS changes needed
*/

-- Add display_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maturity_categories' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE maturity_categories ADD COLUMN display_order integer DEFAULT 0;
    
    -- Update existing rows with display_order based on alphabetical order
    WITH ordered_categories AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
      FROM maturity_categories
    )
    UPDATE maturity_categories
    SET display_order = ordered_categories.row_num
    FROM ordered_categories
    WHERE maturity_categories.id = ordered_categories.id;
    
    -- Make display_order NOT NULL after setting values
    ALTER TABLE maturity_categories ALTER COLUMN display_order SET NOT NULL;
  END IF;
END $$;
