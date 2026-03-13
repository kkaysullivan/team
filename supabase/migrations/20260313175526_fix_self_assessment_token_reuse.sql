/*
  # Fix Self-Assessment Token Reuse Vulnerability

  ## Security Issue
  Self-assessment token validation did not check whether the token had already
  been used. This allowed the same token link to be used multiple times to
  re-submit or overwrite a self-assessment.

  ## Changes
  - Update "Anyone can read valid tokens" policy to also require completed_at IS NULL
  - Update "Anyone can update token completion" policy to also require completed_at IS NULL
  - Update "Anyone can insert assessments with valid token" policy to require completed_at IS NULL
  - Update "Anyone can read assessments with valid token" policy to require completed_at IS NULL
  - Update "Anyone can update self rating with valid token" policy to require completed_at IS NULL

  This ensures each token is strictly one-time use.
*/

-- Fix token read policy to block completed tokens
DROP POLICY IF EXISTS "Anyone can read valid tokens" ON self_assessment_tokens;
CREATE POLICY "Anyone can read valid unused tokens"
  ON self_assessment_tokens FOR SELECT
  USING (expires_at > now() AND completed_at IS NULL);

-- Fix token update policy to block re-completion
DROP POLICY IF EXISTS "Anyone can update token completion" ON self_assessment_tokens;
CREATE POLICY "Anyone can complete unused tokens"
  ON self_assessment_tokens FOR UPDATE
  USING (expires_at > now() AND completed_at IS NULL)
  WITH CHECK (expires_at > now());

-- Fix maturity_assessments insert policy for self-assessment
DROP POLICY IF EXISTS "Anyone can insert assessments with valid token" ON maturity_assessments;
CREATE POLICY "Anyone can insert assessments with valid unused token"
  ON maturity_assessments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );

-- Fix maturity_assessments read policy for self-assessment
DROP POLICY IF EXISTS "Anyone can read assessments with valid token" ON maturity_assessments;
CREATE POLICY "Anyone can read assessments with valid unused token"
  ON maturity_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );

-- Fix maturity_assessments update policy for self-assessment
DROP POLICY IF EXISTS "Anyone can update self rating with valid token" ON maturity_assessments;
CREATE POLICY "Anyone can update self rating with valid unused token"
  ON maturity_assessments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM self_assessment_tokens
      WHERE self_assessment_tokens.team_member_id = maturity_assessments.team_member_id
        AND self_assessment_tokens.expires_at > now()
        AND self_assessment_tokens.completed_at IS NULL
    )
  );
