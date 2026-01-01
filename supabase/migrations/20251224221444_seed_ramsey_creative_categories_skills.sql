/*
  # Seed Ramsey Creative Categories and Skills

  1. New Categories
    - Coachability (Human Skills)
    - Professionalism (Human Skills)
    - Craft Excellence (Hard Skills)
    - Brand IQ (Hard Skills)
    - Technical Skill (Hard Skills)

  2. Skills for Each Category
    
    **Coachability:**
    - Applying advice from leaders
    - Applying learnings from training
    - Self-learning
    
    **Professionalism:**
    - Communicating clearly
    - Putting others first
    - Holding work with an open hand
    - Managing emotions
    
    **Craft Excellence:**
    - Designing for connection & trust
    - Choosing the right fidelity
    - Connecting work to an outcome
    - Thinking in systems
    - Applying design principles & heuristics
    - Expressing brand values & human feel
    
    **Brand IQ:**
    - Applying a brand narrative across the journey
    - Creating consistency
    - Creating lovable moments
    - Demonstrating subject matter expertise
    
    **Technical Skill:**
    - Product discovery (Strategy + Scope)
    - UX / Interaction design (Structure)
    - Visual design (Surface)
    - Iteration across the planes

  3. Skill Levels
    Each skill includes descriptions for all 5 levels: Associate, Level 1, Level 2, Senior, Lead

  4. Important Notes
    - Uses fixed UUIDs for categories to reference them in associations
    - Creates all skills with their level descriptions
    - Links skills to categories via category_skills junction table
*/

-- Insert Categories
INSERT INTO maturity_categories (id, name, description) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000001', 'Coachability', 'A Ramsey Creative is eager to grow, apply learning, and multiply others.'),
  ('c0ac4ab1-0000-0000-0000-000000000002', 'Professionalism', 'A Ramsey Creative acts as an owner — dependable, respectful, and consistent in execution and collaboration.'),
  ('c0ac4ab1-0000-0000-0000-000000000003', 'Craft Excellence', 'A Ramsey Creative connects design to emotion and business impact—creating work customers love and that drives results.'),
  ('c0ac4ab1-0000-0000-0000-000000000004', 'Brand IQ', 'A Ramsey Creative expresses the brand''s heart consistently and creatively across the customer journey.'),
  ('c0ac4ab1-0000-0000-0000-000000000005', 'Technical Skill', 'A Ramsey Creative is a master at the technical skills of their craft. They understand the fundamentals deeply, make sound creative decisions quickly, and can execute those decisions efficiently.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COACHABILITY SKILLS
-- ============================================================

-- Skill: Applying advice from leaders
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000001', 'Applying advice from leaders', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000001', '5c111001-0000-0000-0000-000000000001', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Seeks advice and is open to feedback.', 1),
  ('5c111001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Articulates advice received and how it applies to their role.', 2),
  ('5c111001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Applies advice consistently and promptly.', 3),
  ('5c111001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Demonstrates sustained behavior change from coaching.', 4),
  ('5c111001-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Coaches others and models healthy feedback loops.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Applying learnings from training
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000002', 'Applying learnings from training', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000001', '5c111001-0000-0000-0000-000000000002', 2)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Participates in required trainings.', 1),
  ('5c111001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Shares takeaways and applies learnings with guidance.', 2),
  ('5c111001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Actively seeks training and applies learnings immediately.', 3),
  ('5c111001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Holds self and others accountable to applying training.', 4),
  ('5c111001-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'Trains and mentors others using structured approaches.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Self-learning
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000003', 'Self-learning', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000001', '5c111001-0000-0000-0000-000000000003', 3)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Seeks guidance on how and where to learn.', 1),
  ('5c111001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Articulates current trends and industry knowledge.', 2),
  ('5c111001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Applies industry knowledge appropriately within Ramsey standards.', 3),
  ('5c111001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Balances industry best practices with Ramsey context and constraints.', 4),
  ('5c111001-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Coaches others on trends and raises learning maturity across the org.', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROFESSIONALISM SKILLS
-- ============================================================

-- Skill: Communicating clearly
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000004', 'Communicating clearly', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000002', '5c111001-0000-0000-0000-000000000004', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Learns to articulate thoughts and ideas.', 1),
  ('5c111001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Communicates ideas in terms others understand.', 2),
  ('5c111001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Clearly explains decisions and can defend them with rationale.', 3),
  ('5c111001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Communicates clearly and simply across written, verbal, and visual formats.', 4),
  ('5c111001-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 'Coaches others on clear communication and storytelling.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Putting others first
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000005', 'Putting others first', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000002', '5c111001-0000-0000-0000-000000000005', 2)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Learns to listen more than talk.', 1),
  ('5c111001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Actively listens and considers other viewpoints.', 2),
  ('5c111001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Maintains a posture of curiosity and respect in collaboration.', 3),
  ('5c111001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'Lets go of personal ideas in favor of what''s best for the user or business.', 4),
  ('5c111001-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Coaches others to advocate for shared wins and team success.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Holding work with an open hand
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000006', 'Holding work with an open hand', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000002', '5c111001-0000-0000-0000-000000000006', 3)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Learns Ramsey style and standards.', 1),
  ('5c111001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Articulates how their work aligns with or differs from standards.', 2),
  ('5c111001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Puts business needs ahead of personal preference.', 3),
  ('5c111001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'Humbly invites critique and adapts work quickly.', 4),
  ('5c111001-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'Coaches others to approach work objectively and openly.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Managing emotions
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000007', 'Managing emotions', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000002', '5c111001-0000-0000-0000-000000000007', 4)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Learns to remain calm in challenging situations.', 1),
  ('5c111001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Responds to disagreement with composure.', 2),
  ('5c111001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', 'Initiates and engages in healthy conflict constructively.', 3),
  ('5c111001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'Diffuses conflict and restores alignment and trust.', 4),
  ('5c111001-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'Coaches others on healthy conflict and emotional regulation.', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CRAFT EXCELLENCE SKILLS
-- ============================================================

-- Skill: Designing for connection & trust
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000008', 'Designing for connection & trust', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-000000000008', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Learns who the audience is and why familiarity builds trust.', 1),
  ('5c111001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'Creates usable, on-brand solutions that feel familiar and human.', 2),
  ('5c111001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'Ties designs to customer needs and delivers predictable experiences.', 3),
  ('5c111001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'Deepens emotional resonance within brand guardrails.', 4),
  ('5c111001-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 'Coaches others to design trust-building experiences across journeys.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Choosing the right fidelity
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000009', 'Choosing the right fidelity', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-000000000009', 2)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Learns differences between low-, mid-, and high-fidelity.', 1),
  ('5c111001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'Selects appropriate fidelity for early learning with guidance.', 2),
  ('5c111001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'Uses fidelity that matches stage and risk, reducing rework.', 3),
  ('5c111001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000004', 'Guides teams to learn early without over-polish.', 4),
  ('5c111001-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'Sets org-wide fidelity norms balancing speed and quality.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Connecting work to an outcome
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000a', 'Connecting work to an outcome', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-00000000000a', 3)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'Learns what outcomes are and why they matter.', 1),
  ('5c111001-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002', 'Articulates intended outcomes for their work.', 2),
  ('5c111001-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000003', 'Produces work that achieves intended outcomes.', 3),
  ('5c111001-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000004', 'Holds teams accountable to outcomes, not output.', 4),
  ('5c111001-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000005', 'Coaches others to tie design to measurable impact.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Thinking in systems
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000b', 'Thinking in systems', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-00000000000b', 4)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', 'Learns what a design system is and why consistency matters.', 1),
  ('5c111001-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000002', 'Uses system components and tokens correctly.', 2),
  ('5c111001-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000003', 'Designs scalable patterns and proposes reusable components.', 3),
  ('5c111001-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000004', 'Partners with engineers to evolve systems and prevent design debt.', 4),
  ('5c111001-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000005', 'Leads system evolution and enforces cohesion across the org.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Applying design principles & heuristics
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000c', 'Applying design principles & heuristics', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-00000000000c', 5)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000001', 'Learns usability heuristics and core Laws of UX.', 1),
  ('5c111001-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000002', 'Applies principles to improve usability and consistency.', 2),
  ('5c111001-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000003', 'Audits designs using principles and proposes improvements.', 3),
  ('5c111001-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000004', 'Leads heuristic evaluations before launch.', 4),
  ('5c111001-0000-0000-0000-00000000000c', '10000000-0000-0000-0000-000000000005', 'Coaches others and curates shared principle guidance.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Expressing brand values & human feel
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000d', 'Expressing brand values & human feel', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000003', '5c111001-0000-0000-0000-00000000000d', 6)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000001', 'Learns to apply brand standards and human-centered voice.', 1),
  ('5c111001-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000002', 'Applies brand tone and components consistently.', 2),
  ('5c111001-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000003', 'Holds self accountable for brand consistency across journeys.', 3),
  ('5c111001-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000004', 'Leads brand fidelity reviews as products evolve.', 4),
  ('5c111001-0000-0000-0000-00000000000d', '10000000-0000-0000-0000-000000000005', 'Defines guardrails for brand iteration and mentors others.', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- BRAND IQ SKILLS
-- ============================================================

-- Skill: Applying a brand narrative across the journey
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000e', 'Applying a brand narrative across the journey', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000004', '5c111001-0000-0000-0000-00000000000e', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000001', 'Learns the Ramsey brand and core teachings.', 1),
  ('5c111001-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000002', 'Applies brand narrative within individual experiences.', 2),
  ('5c111001-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000003', 'Reinforces narrative across key flows and stages.', 3),
  ('5c111001-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000004', 'Maintains a coherent narrative across full journeys.', 4),
  ('5c111001-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-000000000005', 'Coaches others on sustaining narrative consistency.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Creating consistency
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-00000000000f', 'Creating consistency', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000004', '5c111001-0000-0000-0000-00000000000f', 2)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000001', 'Learns to design within Ramsey standards.', 1),
  ('5c111001-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000002', 'Expresses the brand appropriately and consistently.', 2),
  ('5c111001-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000003', 'Repeats brand threads across touchpoints.', 3),
  ('5c111001-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000004', 'Holds teams accountable to brand consistency.', 4),
  ('5c111001-0000-0000-0000-00000000000f', '10000000-0000-0000-0000-000000000005', 'Coaches the org on consistency at scale.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Creating lovable moments
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000010', 'Creating lovable moments', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000004', '5c111001-0000-0000-0000-000000000010', 3)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Learns what "lovable" means at Ramsey and why it matters.', 1),
  ('5c111001-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'Adds simple, thoughtful delight under guidance.', 2),
  ('5c111001-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'Integrates insight-driven micro-moments that reduce friction or celebrate progress.', 3),
  ('5c111001-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'Turns key flows from functional to lovable, creating remarkable, validating emotional impact.', 4),
  ('5c111001-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', 'Builds a culture of remarkable work through coaching, playbooks, and showcases.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Demonstrating subject matter expertise
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000011', 'Demonstrating subject matter expertise', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000004', '5c111001-0000-0000-0000-000000000011', 4)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Learns core business topics and offerings.', 1),
  ('5c111001-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'Articulates major content pillars accurately.', 2),
  ('5c111001-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'Advocates for subject matter expertise in the work.', 3),
  ('5c111001-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'Applies domain expertise in new, meaningful ways.', 4),
  ('5c111001-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005', 'Coaches others and raises domain fluency across the org.', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TECHNICAL SKILL SKILLS
-- ============================================================

-- Skill: Product discovery (Strategy + Scope)
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000012', 'Product discovery (Strategy + Scope)', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000005', '5c111001-0000-0000-0000-000000000012', 1)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'Learns business goals, customer needs, and discovery basics.', 1),
  ('5c111001-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Gathers insights and supports early problem framing.', 2),
  ('5c111001-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'Defines opportunities, scope, and success criteria.', 3),
  ('5c111001-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'Leads discovery and ensures trio alignment on what to solve.', 4),
  ('5c111001-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000005', 'Coaches squads on discovery habits and strategy alignment.', 5)
ON CONFLICT DO NOTHING;

-- Skill: UX / Interaction design (Structure)
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000013', 'UX / Interaction design (Structure)', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000005', '5c111001-0000-0000-0000-000000000013', 2)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'Learns IA, flows, and interaction basics.', 1),
  ('5c111001-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'Designs clear flows and validates assumptions with guidance.', 2),
  ('5c111001-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003', 'Designs robust IA and interaction models, validated by testing.', 3),
  ('5c111001-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 'Leads structural decisions and ensures journey consistency.', 4),
  ('5c111001-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'Coaches others and prevents structural drift across products.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Visual design (Surface)
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000014', 'Visual design (Surface)', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000005', '5c111001-0000-0000-0000-000000000014', 3)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'Learns visual fundamentals and design system components.', 1),
  ('5c111001-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'Applies visual hierarchy and tokens consistently.', 2),
  ('5c111001-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', 'Crafts polished visuals and micro-interactions validated with users.', 3),
  ('5c111001-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 'Evolves visual patterns while staying on brand.', 4),
  ('5c111001-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'Defines visual guardrails and ensures consistency at scale.', 5)
ON CONFLICT DO NOTHING;

-- Skill: Iteration across the planes
INSERT INTO maturity_skills (id, name, description) VALUES
  ('5c111001-0000-0000-0000-000000000015', 'Iteration across the planes', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category_skills (category_id, skill_id, display_order) VALUES
  ('c0ac4ab1-0000-0000-0000-000000000005', '5c111001-0000-0000-0000-000000000015', 4)
ON CONFLICT DO NOTHING;

INSERT INTO skill_levels (skill_id, level_id, description, display_order) VALUES
  ('5c111001-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'Learns how iteration supports learning.', 1),
  ('5c111001-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 'Iterates appropriately within each plane with guidance.', 2),
  ('5c111001-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003', 'Iterates across discovery, structure, and surface using evidence.', 3),
  ('5c111001-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', 'Guides teams to balance speed, learning, and quality.', 4),
  ('5c111001-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 'Coaches org-wide iteration habits across the product lifecycle.', 5)
ON CONFLICT DO NOTHING;
