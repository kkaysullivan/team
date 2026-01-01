/*
  # Team Management System Schema

  1. New Tables
    - `team_members`
      - `id` (uuid, primary key)
      - `manager_id` (uuid, references auth.users) - the manager who owns this team member
      - `full_name` (text) - team member's full name
      - `email` (text) - team member's email
      - `role` (text) - job title/role
      - `avatar_url` (text, nullable) - profile photo URL
      - `start_date` (date) - employment start date
      - `status` (text) - active, on_leave, etc.
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, primary key)
      - `manager_id` (uuid, references auth.users)
      - `name` (text) - project name
      - `description` (text, nullable)
      - `status` (text) - active, completed, on_hold
      - `start_date` (date, nullable)
      - `end_date` (date, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `project_assignments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `team_member_id` (uuid, references team_members)
      - `created_at` (timestamptz)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `assigned_to` (uuid, references team_members, nullable)
      - `title` (text)
      - `description` (text, nullable)
      - `status` (text) - todo, in_progress, completed
      - `priority` (text) - low, medium, high
      - `due_date` (date, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `time_off_requests`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `manager_id` (uuid, references auth.users)
      - `type` (text) - vacation, sick, personal
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text) - pending, approved, rejected
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `performance_reviews`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `manager_id` (uuid, references auth.users)
      - `review_date` (date)
      - `period_start` (date)
      - `period_end` (date)
      - `strengths` (text, nullable)
      - `areas_for_improvement` (text, nullable)
      - `goals` (text, nullable)
      - `overall_rating` (integer, nullable) - 1-5 scale
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `one_on_ones`
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, references team_members)
      - `manager_id` (uuid, references auth.users)
      - `meeting_date` (date)
      - `notes` (text, nullable)
      - `action_items` (text, nullable)
      - `mood` (text, nullable) - great, good, neutral, struggling
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Managers can only access their own team data
    - All operations restricted to authenticated users
*/

-- Team Members Table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  avatar_url text,
  start_date date NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert their team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update their team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert their projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Project Assignments Table
CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, team_member_id)
);

ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view project assignments"
  ON project_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert project assignments"
  ON project_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete project assignments"
  ON project_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_assignments.project_id
      AND projects.manager_id = auth.uid()
    )
  );

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES team_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' NOT NULL,
  priority text DEFAULT 'medium' NOT NULL,
  due_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.manager_id = auth.uid()
    )
  );

-- Time Off Requests Table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view time off requests"
  ON time_off_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert time off requests"
  ON time_off_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update time off requests"
  ON time_off_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete time off requests"
  ON time_off_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  review_date date NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  strengths text,
  areas_for_improvement text,
  goals text,
  overall_rating integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view performance reviews"
  ON performance_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert performance reviews"
  ON performance_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update performance reviews"
  ON performance_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete performance reviews"
  ON performance_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- One on Ones Table
CREATE TABLE IF NOT EXISTS one_on_ones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE NOT NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meeting_date date NOT NULL,
  notes text,
  action_items text,
  mood text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE one_on_ones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view one on ones"
  ON one_on_ones FOR SELECT
  TO authenticated
  USING (auth.uid() = manager_id);

CREATE POLICY "Managers can insert one on ones"
  ON one_on_ones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update one on ones"
  ON one_on_ones FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id)
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can delete one on ones"
  ON one_on_ones FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_manager_id ON team_members(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_manager_id ON time_off_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_manager_id ON performance_reviews(manager_id);
CREATE INDEX IF NOT EXISTS idx_one_on_ones_manager_id ON one_on_ones(manager_id);