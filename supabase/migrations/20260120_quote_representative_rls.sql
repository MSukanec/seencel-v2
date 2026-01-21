-- ============================================
-- RLS Policy: REPRESENTANTES EDITAN QUOTES
-- ============================================
-- Solo pueden editar quotes con status 'sent' si son representantes del proyecto

CREATE POLICY "REPRESENTANTES EDITAN QUOTES"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
    status = 'sent' AND is_project_representative(project_id)
)
WITH CHECK (
    is_project_representative(project_id)
);
