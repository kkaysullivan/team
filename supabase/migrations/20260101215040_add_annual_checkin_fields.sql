/*
  # Add Annual Check-in Fields

  1. New Columns
    - `reflection_questions` (jsonb) - Stores team member and leader responses for 7 reflection questions
    - `peer_feedback` (jsonb) - Stores array of peer feedback entries with name and 3 response fields
    - `maturity_snapshot` (jsonb) - Stores maturity model snapshot data (expectations, scores, comments)
    - `growth_areas` (jsonb) - Stores 3 growth areas with skill info, quarterly rankings (Q1-Q4), and leader comments

  2. Structure
    - reflection_questions: { 
        wins: { team_member: "", leader: "" },
        learnings: { team_member: "", leader: "" },
        fail_forward: { team_member: "", leader: "" },
        level_up: { team_member: "", leader: "" },
        steps_taking: { team_member: "", leader: "" },
        next_year_goals: { team_member: "", leader: "" },
        impact_areas: { team_member: "", leader: "" }
      }
    - peer_feedback: [{ peer_name: "", crushing_it: "", growth_areas: "", other: "" }]
    - maturity_snapshot: [{ expectation: "", leader_score: number, leader_comments: "" }]
    - growth_areas: [{ skill_name: "", skill_id: "", q1: number, q2: number, q3: number, q4: number, leader_comments: "" }]

  3. Notes
    - These fields are optional and only used for annual check-ins
    - All fields default to null for quarterly check-ins
*/

-- Add reflection_questions column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'reflection_questions'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN reflection_questions jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add peer_feedback column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'peer_feedback'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN peer_feedback jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add maturity_snapshot column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'maturity_snapshot'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN maturity_snapshot jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add growth_areas column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_reviews' AND column_name = 'growth_areas'
  ) THEN
    ALTER TABLE performance_reviews ADD COLUMN growth_areas jsonb DEFAULT NULL;
  END IF;
END $$;