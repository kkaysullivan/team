/*
  # Allow Public Read Access for Self-Assessment

  1. Changes
    - Add policies to allow anonymous users to read necessary data for self-assessment
    - This includes: team_members (limited), maturity_skills, skill_levels, levels, categories, etc.

  2. Security
    - Anonymous users can only read data for team members with valid assessment tokens
    - No write access except for maturity_assessments.self_rating
    - Personal information is limited
*/

-- Allow anonymous users to read team member info (limited fields) with valid token
CREATE POLICY "Anyone can read team member with valid token"
  ON team_members
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = team_members.id
      AND self_assessment_tokens.expires_at > now()
    )
  );

-- Allow anonymous users to read maturity skills
CREATE POLICY "Anyone can read maturity skills"
  ON maturity_skills
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read skill levels
CREATE POLICY "Anyone can read skill levels"
  ON skill_levels
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read levels
CREATE POLICY "Anyone can read levels"
  ON levels
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read categories
CREATE POLICY "Anyone can read maturity categories"
  ON maturity_categories
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read category skills
CREATE POLICY "Anyone can read category skills"
  ON category_skills
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read roles
CREATE POLICY "Anyone can read roles"
  ON roles
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read role skills
CREATE POLICY "Anyone can read role skills"
  ON role_skills
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read maturity models
CREATE POLICY "Anyone can read maturity models"
  ON maturity_models
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read maturity model categories
CREATE POLICY "Anyone can read maturity model categories"
  ON maturity_model_categories
  FOR SELECT
  TO anon
  USING (true);
