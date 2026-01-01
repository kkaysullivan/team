/*
  # Remove Time Off Requests Table

  1. Tables to Remove
    - `time_off_requests` - Time off management table (no longer needed)

  2. Notes
    - All related data will be permanently deleted
    - Indexes are automatically removed with the table
*/

-- Drop time_off_requests table
DROP TABLE IF EXISTS time_off_requests CASCADE;
