/*
  # Remove Projects and Tasks Tables

  1. Tables to Remove
    - `tasks` - Task management table (no longer needed)
    - `project_assignments` - Project to team member assignments (no longer needed)
    - `projects` - Projects table (no longer needed)

  2. Notes
    - Tables are dropped in order to respect foreign key constraints
    - All related data will be permanently deleted
    - Indexes are automatically removed with the tables
*/

-- Drop tables in order (child tables first due to foreign key constraints)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
