/*
  # Add transcript and summary to one-on-ones

  1. Changes
    - Add `transcript` column to store real-time transcription
    - Add `summary` column to store AI-generated summary
    
  2. Notes
    - Both columns are text and nullable
    - Existing records will have NULL values for these fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN transcript text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'summary'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN summary text;
  END IF;
END $$;