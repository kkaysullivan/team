/*
  # Update one_on_ones table structure

  1. Changes
    - Remove `mood` and `action_items` columns
    - Add `morale` (integer 1-5) for morale rating
    - Add `stress` (integer 1-5) for stress rating  
    - Add `workload` (integer 1-5) for workload rating
    - Add `agenda` (jsonb) for structured agenda items
    - Add `transcription` (text) for raw meeting transcription
    - Add `formatted_notes` (text) for AI-generated formatted notes
    - Keep `notes` (text) for manual note-taking
  
  2. Security
    - No changes to RLS policies needed
*/

-- Remove old columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'one_on_ones' AND column_name = 'mood'
  ) THEN
    ALTER TABLE one_on_ones DROP COLUMN mood;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'one_on_ones' AND column_name = 'action_items'
  ) THEN
    ALTER TABLE one_on_ones DROP COLUMN action_items;
  END IF;
END $$;

-- Add new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'morale'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN morale integer CHECK (morale >= 1 AND morale <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'stress'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN stress integer CHECK (stress >= 1 AND stress <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'workload'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN workload integer CHECK (workload >= 1 AND workload <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'agenda'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN agenda jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'transcription'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN transcription text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'one_on_ones' AND column_name = 'formatted_notes'
  ) THEN
    ALTER TABLE one_on_ones ADD COLUMN formatted_notes text;
  END IF;
END $$;
