-- ============================================
-- RLS Policies para COURSES y COURSE_DETAILS
-- ============================================

-- 1. COURSES - Admins pueden todo
CREATE POLICY "ADMINS READ COURSES"
ON public.courses
FOR SELECT
TO authenticated
USING (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
);

CREATE POLICY "ADMINS WRITE COURSES"
ON public.courses
FOR ALL
TO authenticated
USING (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
)
WITH CHECK (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
);

-- 2. COURSE_DETAILS - Admins pueden todo
CREATE POLICY "ADMINS READ COURSE_DETAILS"
ON public.course_details
FOR SELECT
TO authenticated
USING (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
);

CREATE POLICY "ADMINS WRITE COURSE_DETAILS"
ON public.course_details
FOR ALL
TO authenticated
USING (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
)
WITH CHECK (
    is_system_admin() OR 
    EXISTS (
        SELECT 1 FROM organization_members om 
        WHERE om.user_id = auth.uid() 
        AND om.role IN ('admin', 'owner')
    )
);

-- 3. Public SELECT para cursos activos (landing pages)
CREATE POLICY "PUBLIC READ ACTIVE COURSES"
ON public.courses
FOR SELECT
TO anon, authenticated
USING (
    is_active = true AND 
    visibility = 'public' AND 
    is_deleted = false
);

CREATE POLICY "PUBLIC READ COURSE_DETAILS"
ON public.course_details
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses c 
        WHERE c.id = course_id 
        AND c.is_active = true 
        AND c.visibility = 'public' 
        AND c.is_deleted = false
    )
);
