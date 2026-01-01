/*
  # Add start and end dates to KRAs

  1. Changes
    - Add `start_date` column to kras table (date when KRA becomes active)
    - Add `end_date` column to kras table (date when KRA expires or was replaced)

  2. Notes
    - start_date defaults to current date for new records
    - end_date is nullable (null means currently active)
*/

-- Add start_date and end_date columns
ALTER TABLE kras
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS end_date date;

-- Update existing active KRAs to have a start_date if null
UPDATE kras
SET start_date = COALESCE(start_date, created_at::date)
WHERE start_date IS NULL;