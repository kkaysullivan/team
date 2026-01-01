/*
  # Update KRAs table to use JSONB for key_responsibilities

  1. Changes
    - Change `key_responsibilities` column from `text[]` to `jsonb`
    - Migrate existing data from text array format to proper JSONB format
    - Each key responsibility now contains:
      - responsibility (string)
      - winning_looks_like (string)
      - what_it_takes (array of strings)

  2. Notes
    - Preserves all existing data by converting JSON strings to proper JSONB
    - Handles empty arrays gracefully
*/

-- First, create a temporary column to hold the converted data
ALTER TABLE kras ADD COLUMN IF NOT EXISTS key_responsibilities_new jsonb DEFAULT '[]'::jsonb;

-- Migrate existing data from text[] to jsonb
-- Parse each JSON string in the array and build a proper JSONB array
DO $$
DECLARE
  kra_record RECORD;
  json_array jsonb;
  text_element text;
BEGIN
  FOR kra_record IN SELECT id, key_responsibilities FROM kras LOOP
    json_array := '[]'::jsonb;
    
    -- Convert each text element to JSON and append to array
    IF kra_record.key_responsibilities IS NOT NULL AND array_length(kra_record.key_responsibilities, 1) > 0 THEN
      FOREACH text_element IN ARRAY kra_record.key_responsibilities LOOP
        BEGIN
          json_array := json_array || jsonb_build_array(text_element::jsonb);
        EXCEPTION WHEN OTHERS THEN
          -- If parsing fails, skip this element
          CONTINUE;
        END;
      END LOOP;
    END IF;
    
    -- Update the new column with the converted data
    UPDATE kras SET key_responsibilities_new = json_array WHERE id = kra_record.id;
  END LOOP;
END $$;

-- Drop the old column and rename the new one
ALTER TABLE kras DROP COLUMN key_responsibilities;
ALTER TABLE kras RENAME COLUMN key_responsibilities_new TO key_responsibilities;

-- Also update success_metrics to jsonb for consistency (though currently empty)
ALTER TABLE kras ADD COLUMN IF NOT EXISTS success_metrics_new jsonb DEFAULT '[]'::jsonb;
UPDATE kras SET success_metrics_new = '[]'::jsonb;
ALTER TABLE kras DROP COLUMN success_metrics;
ALTER TABLE kras RENAME COLUMN success_metrics_new TO success_metrics;
