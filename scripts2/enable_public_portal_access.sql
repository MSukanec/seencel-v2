-- Enable public read access to site_logs for public entries
-- Policy Name: TODOS VEN SITE_LOGS (Siguiendo guía RLS: TODOS VEN {TABLA})
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_logs' AND policyname = 'TODOS VEN SITE_LOGS'
    ) THEN
        CREATE POLICY "TODOS VEN SITE_LOGS" ON site_logs
        FOR SELECT
        TO public
        USING (is_public = true AND is_deleted = false);
    END IF;
END $$;

-- Enable public read access to media_links for public logs
-- Policy Name: TODOS VEN MEDIA_LINKS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'media_links' AND policyname = 'TODOS VEN MEDIA_LINKS'
    ) THEN
        CREATE POLICY "TODOS VEN MEDIA_LINKS" ON media_links
        FOR SELECT
        TO public
        USING (
            EXISTS (
                SELECT 1 FROM site_logs
                WHERE site_logs.id = media_links.site_log_id
                AND site_logs.is_public = true
                AND site_logs.is_deleted = false
            )
        );
    END IF;
END $$;

-- Enable public read access to media_files for public logs
-- Policy Name: TODOS VEN MEDIA_FILES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'media_files' AND policyname = 'TODOS VEN MEDIA_FILES'
    ) THEN
        CREATE POLICY "TODOS VEN MEDIA_FILES" ON media_files
        FOR SELECT
        TO public
        USING (
            EXISTS (
                SELECT 1 FROM media_links
                JOIN site_logs ON site_logs.id = media_links.site_log_id
                WHERE media_links.media_file_id = media_files.id
                AND site_logs.is_public = true
                AND site_logs.is_deleted = false
            )
        );
    END IF;
END $$;
