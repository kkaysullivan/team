/*
  # Create Profile Admin Tables

  1. New Tables
    - `preference_types`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text, unique) - Category name (e.g., "Drink", "Color")
      - `icon` (text) - Emoji or icon identifier
      - `color` (text) - Tailwind color classes for styling
      - `display_order` (integer) - Order for displaying preferences
      - `is_active` (boolean) - Whether this type is available for use
      - `created_at` (timestamptz) - When created
      - `updated_at` (timestamptz) - When last updated

    - `assessment_types`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text, unique) - Assessment name (e.g., "DISC", "Enneagram")
      - `description` (text, nullable) - Description of the assessment
      - `icon` (text) - Icon identifier
      - `color` (text) - Color for styling
      - `is_active` (boolean) - Whether this type is available for use
      - `display_order` (integer) - Display order
      - `created_at` (timestamptz) - When created
      - `updated_at` (timestamptz) - When last updated

  2. Security
    - Enable RLS on both tables
    - Authenticated users can read all records
    - Authenticated users can insert, update, and delete records

  3. Seed Data
    - Insert default preference types
    - Insert default assessment types
*/

CREATE TABLE IF NOT EXISTS preference_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT '📝',
  color text NOT NULL DEFAULT 'from-slate-50 to-gray-50 border-slate-200',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '📊',
  color text NOT NULL DEFAULT 'from-slate-50 to-gray-50 border-slate-200',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE preference_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view preference types"
  ON preference_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert preference types"
  ON preference_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update preference types"
  ON preference_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete preference types"
  ON preference_types
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view assessment types"
  ON assessment_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert assessment types"
  ON assessment_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assessment types"
  ON assessment_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete assessment types"
  ON assessment_types
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO preference_types (name, icon, color, display_order) VALUES
  ('Drink', '☕', 'from-amber-50 to-orange-50 border-amber-200', 1),
  ('Color', '🎨', 'from-pink-50 to-rose-50 border-pink-200', 2),
  ('Restaurant', '🍽️', 'from-red-50 to-orange-50 border-red-200', 3),
  ('Book Genre', '📚', 'from-blue-50 to-sky-50 border-blue-200', 4),
  ('Music Genre', '🎵', 'from-cyan-50 to-sky-50 border-cyan-200', 5),
  ('Hobbies', '🎯', 'from-green-50 to-emerald-50 border-green-200', 6),
  ('Candy', '🍬', 'from-fuchsia-50 to-pink-50 border-fuchsia-200', 7),
  ('Animal', '🐾', 'from-teal-50 to-cyan-50 border-teal-200', 8),
  ('Movie', '🎬', 'from-slate-50 to-gray-50 border-slate-200', 9),
  ('Children', '👶', 'from-yellow-50 to-amber-50 border-yellow-200', 10),
  ('Spouse', '💑', 'from-rose-50 to-pink-50 border-rose-200', 11),
  ('Birthday', '🎂', 'from-orange-50 to-amber-50 border-orange-200', 12),
  ('Appreciation', '💝', 'from-red-50 to-pink-50 border-red-200', 13),
  ('Other Favorites', '⭐', 'from-yellow-50 to-orange-50 border-yellow-200', 14)
ON CONFLICT (name) DO NOTHING;

INSERT INTO assessment_types (name, description, icon, color, display_order) VALUES
  ('DISC', 'Behavioral assessment measuring Dominance, Influence, Steadiness, and Conscientiousness', '🎯', 'from-blue-50 to-cyan-50 border-blue-200', 1),
  ('Enneagram', 'Personality system identifying nine personality types', '⭕', 'from-green-50 to-emerald-50 border-green-200', 2),
  ('Working Genius', 'Assessment identifying six types of working genius', '💡', 'from-amber-50 to-yellow-50 border-amber-200', 3)
ON CONFLICT (name) DO NOTHING;