-- Add 'custom_insight_thresholds' feature to all plans

-- For FREE plan (disable)
UPDATE public.plans
SET features = features || '{"custom_insight_thresholds": false}'::jsonb
WHERE slug = 'free';

-- For PRO plan (enable)
UPDATE public.plans
SET features = features || '{"custom_insight_thresholds": true}'::jsonb
WHERE slug = 'pro';

-- For TEAMS plan (enable)
UPDATE public.plans
SET features = features || '{"custom_insight_thresholds": true}'::jsonb
WHERE slug = 'teams';
