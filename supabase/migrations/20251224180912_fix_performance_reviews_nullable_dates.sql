/*
  # Fix Performance Reviews Date Fields

  1. Changes
    - Make `review_date`, `period_start`, and `period_end` nullable
    - These fields are not always required (e.g., quarterly reviews use quarter/year instead)
  
  2. Notes
    - Allows check-ins to be saved without requiring all date fields
*/

ALTER TABLE performance_reviews 
  ALTER COLUMN review_date DROP NOT NULL,
  ALTER COLUMN period_start DROP NOT NULL,
  ALTER COLUMN period_end DROP NOT NULL;
