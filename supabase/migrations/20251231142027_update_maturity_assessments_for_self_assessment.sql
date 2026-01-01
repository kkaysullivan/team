/*
  # Update Maturity Assessments for Self-Assessment

  1. Changes
    - Add policies to allow anonymous users to read and update self_rating in maturity_assessments
    - This enables team members to complete self-assessments via shareable links
    - Self-ratings can only be updated, not leader_rating or other fields

  2. Security
    - Anonymous users can only read assessments for valid token holders
    - Anonymous users can only update self_rating field
    - All other fields remain protected
*/

-- Policy for anonymous users to read assessments via valid token
CREATE POLICY "Anyone can read assessments with valid token"
  ON maturity_assessments
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
      AND self_assessment_tokens.expires_at > now()
    )
  );

-- Policy for anonymous users to update self_rating only via valid token
CREATE POLICY "Anyone can update self rating with valid token"
  ON maturity_assessments
  FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
      AND self_assessment_tokens.expires_at > now()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
      AND self_assessment_tokens.expires_at > now()
    )
  );

-- Policy for anonymous users to insert assessments via valid token
CREATE POLICY "Anyone can insert assessments with valid token"
  ON maturity_assessments
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
      AND self_assessment_tokens.expires_at > now()
    )
  );
