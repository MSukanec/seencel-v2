-- Add sidebar_project_avatars column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN sidebar_project_avatars boolean NOT NULL DEFAULT true;

-- Update the check constraint if needed (none needed for boolean)

-- Comment on column
COMMENT ON COLUMN public.user_preferences.sidebar_project_avatars IS 'If true, shows project cover image in sidebar selector. If false, always shows initials.';
