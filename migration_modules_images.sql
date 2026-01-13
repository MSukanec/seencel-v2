-- 1. Add the column if it doesn't exist
ALTER TABLE course_modules 
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- 2. Migrate data
-- We use a CTE to select ONE media file URL per module to avoid duplicates.
-- We prioritize by created_at (most recent) or just pick any using ROW_NUMBER() if no timestamp is clear.
WITH UniqueImages AS (
    SELECT 
        ml.course_module_id,
        mf.file_path, -- or file_url, verify column name in media_files
        ROW_NUMBER() OVER (
            PARTITION BY ml.course_module_id 
            ORDER BY ml.created_at DESC -- Assuming created_at exists, prioritizing recent
        ) as rn
    FROM 
        media_links ml
    JOIN 
        media_files mf ON ml.media_file_id = mf.id -- Verify join column
    WHERE 
        ml.course_module_id IS NOT NULL
        AND mf.file_type = 'image' -- Only migrate images
)
UPDATE course_modules cm
SET image_path = ui.file_path
FROM UniqueImages ui
WHERE cm.id = ui.course_module_id
AND ui.rn = 1;

-- 3. Verification (Optional - select to see what happened)
-- SELECT id, title, image_path FROM course_modules WHERE image_path IS NOT NULL;
