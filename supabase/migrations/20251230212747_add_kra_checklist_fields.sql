/*
  # Add KRA Checklist Fields

  1. Changes
    - Add `leader_alignment` boolean column to kras table (default false)
    - Add `uploaded_to_paycom` boolean column to kras table (default false)
  
  2. Purpose
    - Track whether KRA has been aligned with team leader
    - Track whether KRA has been uploaded to Paycom system
    - These fields are editable for active KRAs, read-only for inactive KRAs
*/

-- Add leader_alignment column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kras' AND column_name = 'leader_alignment'
  ) THEN
    ALTER TABLE kras ADD COLUMN leader_alignment boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add uploaded_to_paycom column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kras' AND column_name = 'uploaded_to_paycom'
  ) THEN
    ALTER TABLE kras ADD COLUMN uploaded_to_paycom boolean DEFAULT false NOT NULL;
  END IF;
END $$;