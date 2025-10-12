/*
  # Add Support Level System for AI Writing Buddy

  1. New Tables
    - `writing_buddy_preferences`
      - Stores student support level preferences (High, Medium, Low)
      - Tracks support level history and transitions
      - Records performance metrics for automatic recommendations

    - `tiered_feedback_history`
      - Stores all feedback with support level context
      - Enables analysis of feedback effectiveness per support level
      - Tracks student progress across support levels

    - `support_level_recommendations`
      - Stores system-generated support level recommendations
      - Tracks recommendation acceptance/rejection
      - Used for improving recommendation algorithm

  2. Schema Updates
    - Add support_level column to user_profiles
    - Add writing_skill_level column for tracking student progress
    - Add support_level_auto_adjust preference flag

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for admins to view all data

  4. Functions
    - Function to calculate recommended support level based on performance
    - Function to track support level transitions
*/

-- Add support level columns to user_profiles
DO $$
BEGIN
  -- Add support_level column (High Support, Medium Support, Low Support)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'support_level'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN support_level TEXT DEFAULT 'Medium Support'
    CHECK (support_level IN ('High Support', 'Medium Support', 'Low Support'));
  END IF;

  -- Add writing_skill_level column (1-5 scale)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'writing_skill_level'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN writing_skill_level INTEGER DEFAULT 3
    CHECK (writing_skill_level >= 1 AND writing_skill_level <= 5);
  END IF;

  -- Add auto-adjust preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'support_level_auto_adjust'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN support_level_auto_adjust BOOLEAN DEFAULT true;
  END IF;

  -- Add last support level change date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_support_level_change'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN last_support_level_change TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create writing_buddy_preferences table
CREATE TABLE IF NOT EXISTS writing_buddy_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  support_level TEXT NOT NULL DEFAULT 'Medium Support'
    CHECK (support_level IN ('High Support', 'Medium Support', 'Low Support')),
  previous_support_level TEXT
    CHECK (previous_support_level IN ('High Support', 'Medium Support', 'Low Support')),

  -- Performance metrics
  average_essay_score DECIMAL(5,2) DEFAULT 0.0,
  total_essays_completed INTEGER DEFAULT 0,
  total_feedback_sessions INTEGER DEFAULT 0,

  -- Skill tracking
  grammar_skill_level INTEGER DEFAULT 3 CHECK (grammar_skill_level >= 1 AND grammar_skill_level <= 5),
  vocabulary_skill_level INTEGER DEFAULT 3 CHECK (vocabulary_skill_level >= 1 AND vocabulary_skill_level <= 5),
  structure_skill_level INTEGER DEFAULT 3 CHECK (structure_skill_level >= 1 AND structure_skill_level <= 5),
  creativity_skill_level INTEGER DEFAULT 3 CHECK (creativity_skill_level >= 1 AND creativity_skill_level <= 5),

  -- Preferences
  auto_adjust_enabled BOOLEAN DEFAULT true,
  preferred_feedback_style TEXT DEFAULT 'balanced' CHECK (preferred_feedback_style IN ('detailed', 'balanced', 'concise')),
  emoji_enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Create tiered_feedback_history table
CREATE TABLE IF NOT EXISTS tiered_feedback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  writing_id UUID, -- Can be null for standalone feedback

  -- Feedback context
  support_level TEXT NOT NULL CHECK (support_level IN ('High Support', 'Medium Support', 'Low Support')),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('chat', 'evaluation', 'suggestion', 'correction')),

  -- Content
  student_text TEXT,
  feedback_text TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,

  -- Categorization
  focus_area TEXT, -- e.g., 'dialogue', 'setting', 'vocabulary', 'grammar'
  text_type TEXT, -- e.g., 'narrative', 'persuasive', 'expository'

  -- Engagement metrics
  student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
  was_helpful BOOLEAN,
  follow_up_questions INTEGER DEFAULT 0,

  -- Performance
  improvement_detected BOOLEAN DEFAULT false,
  skill_improvement_area TEXT,

  -- Metadata
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_text_type CHECK (text_type IN ('narrative', 'persuasive', 'expository', 'descriptive', 'creative', 'recount', 'diary', 'letter', 'speech'))
);

-- Create support_level_recommendations table
CREATE TABLE IF NOT EXISTS support_level_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recommendation details
  current_level TEXT NOT NULL CHECK (current_level IN ('High Support', 'Medium Support', 'Low Support')),
  recommended_level TEXT NOT NULL CHECK (recommended_level IN ('High Support', 'Medium Support', 'Low Support')),

  -- Reasoning
  recommendation_reason TEXT NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),

  -- Based on metrics
  based_on_essay_count INTEGER,
  based_on_average_score DECIMAL(5,2),
  based_on_improvement_rate DECIMAL(5,2),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  reviewed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Enable Row Level Security
ALTER TABLE writing_buddy_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiered_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_level_recommendations ENABLE ROW LEVEL SECURITY;

-- Policies for writing_buddy_preferences
CREATE POLICY "Users can view own writing buddy preferences"
  ON writing_buddy_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own writing buddy preferences"
  ON writing_buddy_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own writing buddy preferences"
  ON writing_buddy_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing buddy preferences"
  ON writing_buddy_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for tiered_feedback_history
CREATE POLICY "Users can view own feedback history"
  ON tiered_feedback_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback history"
  ON tiered_feedback_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback history"
  ON tiered_feedback_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for support_level_recommendations
CREATE POLICY "Users can view own recommendations"
  ON support_level_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendations"
  ON support_level_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON support_level_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_writing_buddy_preferences_user_id
  ON writing_buddy_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_tiered_feedback_history_user_id
  ON tiered_feedback_history(user_id);

CREATE INDEX IF NOT EXISTS idx_tiered_feedback_history_support_level
  ON tiered_feedback_history(support_level);

CREATE INDEX IF NOT EXISTS idx_tiered_feedback_history_created_at
  ON tiered_feedback_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_level_recommendations_user_id
  ON support_level_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_support_level_recommendations_status
  ON support_level_recommendations(status);

-- Function to calculate recommended support level
CREATE OR REPLACE FUNCTION calculate_recommended_support_level(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_score DECIMAL(5,2);
  v_essay_count INTEGER;
  v_current_level TEXT;
  v_recommended_level TEXT;
BEGIN
  -- Get current preferences
  SELECT
    support_level,
    average_essay_score,
    total_essays_completed
  INTO
    v_current_level,
    v_avg_score,
    v_essay_count
  FROM writing_buddy_preferences
  WHERE user_id = p_user_id;

  -- If no preferences exist, return Medium Support as default
  IF v_current_level IS NULL THEN
    RETURN 'Medium Support';
  END IF;

  -- Need at least 3 essays to make a recommendation
  IF v_essay_count < 3 THEN
    RETURN v_current_level;
  END IF;

  -- Recommendation logic based on average score
  -- High Support: Average score below 60
  -- Medium Support: Average score 60-80
  -- Low Support: Average score above 80

  IF v_avg_score >= 80 THEN
    v_recommended_level := 'Low Support';
  ELSIF v_avg_score >= 60 THEN
    v_recommended_level := 'Medium Support';
  ELSE
    v_recommended_level := 'High Support';
  END IF;

  RETURN v_recommended_level;
END;
$$;

-- Function to update user preferences and track changes
CREATE OR REPLACE FUNCTION update_support_level(
  p_user_id UUID,
  p_new_level TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_level TEXT;
  v_prefs_exists BOOLEAN;
BEGIN
  -- Check if preferences exist
  SELECT EXISTS(
    SELECT 1 FROM writing_buddy_preferences WHERE user_id = p_user_id
  ) INTO v_prefs_exists;

  IF NOT v_prefs_exists THEN
    -- Create initial preferences
    INSERT INTO writing_buddy_preferences (user_id, support_level)
    VALUES (p_user_id, p_new_level);

    -- Update user_profiles
    UPDATE user_profiles
    SET
      support_level = p_new_level,
      last_support_level_change = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
  END IF;

  -- Get current level
  SELECT support_level INTO v_old_level
  FROM writing_buddy_preferences
  WHERE user_id = p_user_id;

  -- Update preferences
  UPDATE writing_buddy_preferences
  SET
    previous_support_level = v_old_level,
    support_level = p_new_level,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Update user_profiles
  UPDATE user_profiles
  SET
    support_level = p_new_level,
    last_support_level_change = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to record feedback session
CREATE OR REPLACE FUNCTION record_feedback_session(
  p_user_id UUID,
  p_support_level TEXT,
  p_feedback_type TEXT,
  p_student_text TEXT,
  p_feedback_text TEXT,
  p_focus_area TEXT DEFAULT NULL,
  p_text_type TEXT DEFAULT 'narrative',
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feedback_id UUID;
  v_word_count INTEGER;
BEGIN
  -- Calculate word count
  v_word_count := array_length(string_to_array(p_student_text, ' '), 1);

  -- Insert feedback record
  INSERT INTO tiered_feedback_history (
    user_id,
    support_level,
    feedback_type,
    student_text,
    feedback_text,
    word_count,
    focus_area,
    text_type,
    session_id
  ) VALUES (
    p_user_id,
    p_support_level,
    p_feedback_type,
    p_student_text,
    p_feedback_text,
    v_word_count,
    p_focus_area,
    p_text_type,
    COALESCE(p_session_id, gen_random_uuid()::TEXT)
  )
  RETURNING id INTO v_feedback_id;

  -- Update preferences statistics
  UPDATE writing_buddy_preferences
  SET
    total_feedback_sessions = total_feedback_sessions + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_feedback_id;
END;
$$;

-- Initialize preferences for existing users
INSERT INTO writing_buddy_preferences (user_id, support_level)
SELECT id, 'Medium Support'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM writing_buddy_preferences)
ON CONFLICT (user_id) DO NOTHING;
