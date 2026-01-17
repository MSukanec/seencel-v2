-- 1. Configuration: Store thresholds per organization
-- This allows customizing sensitivity (e.g. 15% vs 20%) without deploying code.
ALTER TABLE organization_preferences 
ADD COLUMN IF NOT EXISTS insight_config JSONB DEFAULT '{}'::jsonb;

-- Example content for insight_config:
-- {
--   "thresholds": {
--     "growthSignificant": 15,
--     "trendStable": 4,
--     "concentrationPareto": 80
--   }
-- }

-- 2. Persistence: Track user interactions with insights
-- This allows "Dismissing" an insight so it doesn't reappear instantly.
CREATE TABLE IF NOT EXISTS user_insight_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_id TEXT NOT NULL, -- The string ID of the insight (e.g. 'growth-explained-increase')
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('dismissed', 'bookmarked', 'acted_upon')),
    metadata JSONB DEFAULT '{}'::jsonb, -- Store extra context if needed (e.g. valid_until timestamp)
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure a user only has one active state per insight? 
    -- Or just log history? For "Dismiss", we usually just check if a record exists.
    UNIQUE(user_id, insight_id, interaction_type)
);

-- RLS Policies
ALTER TABLE user_insight_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interactions" ON user_insight_interactions
    FOR ALL
    USING (auth.uid() = user_id);

-- 3. Helper Function to get effective configuration
-- Merges default config with org-specific config (optional, logic can be in App layer too)
