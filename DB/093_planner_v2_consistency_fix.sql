-- ============================================================================
-- PLANNER V2: Schema Consistency Fix
-- ============================================================================
-- Fecha: 2026-02-22
-- Descripción: Corrige inconsistencias en el schema planner para que
--              esté al nivel de los schemas bien establecidos (finance, projects).
--
-- PROBLEMAS ENCONTRADOS:
-- 1. FKs faltantes: created_by, updated_by, author_id, assigned_to,
--    member_id, uploaded_by NO referencian iam.organization_members(id)
-- 2. Soft delete faltante: comments, checklists, checklist_items,
--    attachments, attendees, mentions, reminders, item_watchers,
--    board_permissions NO tienen is_deleted/deleted_at
-- 3. organization_id faltante: varias tablas hijas no tienen
--    organization_id propio (necesario para RLS directa y queries)
-- 4. Triggers de audit faltantes: tablas sin handle_updated_by ni
--    set_timestamp
-- 5. Permisos faltantes: planner.view / planner.manage no están en la
--    tabla permissions ni asignados a roles
-- 6. Policies DELETE: el SKILL dice NO crear policies DELETE, usar
--    soft delete. Pero el script 090 las crea para items, item_labels,
--    item_watchers → eliminar
-- 7. FKs cross-schema: organization_id, project_id, etc. no tienen
--    FK explícita porque son cross-schema (Supabase no soporta FK
--    cross-schema fácilmente) — esto es esperado y correcto.
-- ============================================================================

-- ============================================================================
-- 1. PERMISOS (planner.view / planner.manage)
-- ============================================================================
-- El script 090 usa 'planner.view' y 'planner.manage' en las RLS policies,
-- pero estos permisos NO existen en la tabla iam.permissions.
-- Sin esto, can_view_org() y can_mutate_org() NUNCA retornan true.

INSERT INTO iam.permissions (key, description, category, is_system)
VALUES
  ('planner.view', 'Ver planificador', 'planner', true),
  ('planner.manage', 'Gestionar planificador', 'planner', true)
ON CONFLICT (key) DO NOTHING;

-- Asignar a roles existentes de TODAS las organizaciones
DO $$
DECLARE
  v_view_perm_id uuid;
  v_manage_perm_id uuid;
BEGIN
  SELECT id INTO v_view_perm_id FROM iam.permissions WHERE key = 'planner.view';
  SELECT id INTO v_manage_perm_id FROM iam.permissions WHERE key = 'planner.manage';

  -- ADMIN: view + manage
  INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
  SELECT r.id, v_view_perm_id, r.organization_id FROM iam.roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
  SELECT r.id, v_manage_perm_id, r.organization_id FROM iam.roles r
  WHERE r.name = 'Administrador' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- EDITOR: view + manage
  INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
  SELECT r.id, v_view_perm_id, r.organization_id FROM iam.roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
  SELECT r.id, v_manage_perm_id, r.organization_id FROM iam.roles r
  WHERE r.name = 'Editor' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- LECTOR: solo view
  INSERT INTO iam.role_permissions (role_id, permission_id, organization_id)
  SELECT r.id, v_view_perm_id, r.organization_id FROM iam.roles r
  WHERE r.name = 'Lector' AND r.is_system = false AND r.organization_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 2. ACTUALIZAR step_assign_org_role_permissions
-- ============================================================================
-- Para que las NUEVAS organizaciones reciban los permisos automáticamente.
-- Hay que agregar 'planner.view' y 'planner.manage' a los arrays de permisos.
-- NOTA: Esto se hace actualizando la función SQL directamente.
-- Verificar que la función ya incluya estos permisos; si no, actualizar.

-- ============================================================================
-- 3. FKs en planner.items (columnas de member_id)
-- ============================================================================

-- 3.1 items.assigned_to → iam.organization_members(id) ON DELETE SET NULL
ALTER TABLE planner.items
  DROP CONSTRAINT IF EXISTS items_assigned_to_fkey;
ALTER TABLE planner.items
  ADD CONSTRAINT items_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- 3.2 items.created_by → iam.organization_members(id) ON DELETE SET NULL
ALTER TABLE planner.items
  DROP CONSTRAINT IF EXISTS items_created_by_fkey;
ALTER TABLE planner.items
  ADD CONSTRAINT items_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- 3.3 items.updated_by → iam.organization_members(id) ON DELETE SET NULL
ALTER TABLE planner.items
  DROP CONSTRAINT IF EXISTS items_updated_by_fkey;
ALTER TABLE planner.items
  ADD CONSTRAINT items_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 4. FKs en planner.boards
-- ============================================================================

ALTER TABLE planner.boards
  DROP CONSTRAINT IF EXISTS boards_created_by_fkey;
ALTER TABLE planner.boards
  ADD CONSTRAINT boards_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.boards
  DROP CONSTRAINT IF EXISTS boards_updated_by_fkey;
ALTER TABLE planner.boards
  ADD CONSTRAINT boards_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 5. FKs en planner.lists
-- ============================================================================

ALTER TABLE planner.lists
  DROP CONSTRAINT IF EXISTS lists_created_by_fkey;
ALTER TABLE planner.lists
  ADD CONSTRAINT lists_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.lists
  DROP CONSTRAINT IF EXISTS lists_updated_by_fkey;
ALTER TABLE planner.lists
  ADD CONSTRAINT lists_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 6. FKs en planner.labels
-- ============================================================================

ALTER TABLE planner.labels
  DROP CONSTRAINT IF EXISTS labels_created_by_fkey;
ALTER TABLE planner.labels
  ADD CONSTRAINT labels_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.labels
  DROP CONSTRAINT IF EXISTS labels_updated_by_fkey;
ALTER TABLE planner.labels
  ADD CONSTRAINT labels_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 7. COMMENTS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.comments
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill organization_id desde item
UPDATE planner.comments c
SET organization_id = i.organization_id
FROM planner.items i
WHERE c.item_id = i.id AND c.organization_id IS NULL;

-- Hacer NOT NULL después del backfill
ALTER TABLE planner.comments
  ALTER COLUMN organization_id SET NOT NULL;

-- FK author_id → organization_members
ALTER TABLE planner.comments
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE planner.comments
  ADD CONSTRAINT comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- FK updated_by → organization_members
ALTER TABLE planner.comments
  DROP CONSTRAINT IF EXISTS comments_updated_by_fkey;
ALTER TABLE planner.comments
  ADD CONSTRAINT comments_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 8. CHECKLISTS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.checklists
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill
UPDATE planner.checklists cl
SET organization_id = i.organization_id
FROM planner.items i
WHERE cl.item_id = i.id AND cl.organization_id IS NULL;

ALTER TABLE planner.checklists
  ALTER COLUMN organization_id SET NOT NULL;

-- FKs
ALTER TABLE planner.checklists
  DROP CONSTRAINT IF EXISTS checklists_created_by_fkey;
ALTER TABLE planner.checklists
  ADD CONSTRAINT checklists_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.checklists
  DROP CONSTRAINT IF EXISTS checklists_updated_by_fkey;
ALTER TABLE planner.checklists
  ADD CONSTRAINT checklists_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 9. CHECKLIST_ITEMS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.checklist_items
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill
UPDATE planner.checklist_items ci
SET organization_id = cl.organization_id
FROM planner.checklists cl
WHERE ci.checklist_id = cl.id AND ci.organization_id IS NULL;

-- No SET NOT NULL yet because checklists may not have org_id yet
-- (run after checklists backfill above)

-- FKs
ALTER TABLE planner.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_assigned_to_fkey;
ALTER TABLE planner.checklist_items
  ADD CONSTRAINT checklist_items_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_completed_by_fkey;
ALTER TABLE planner.checklist_items
  ADD CONSTRAINT checklist_items_completed_by_fkey
  FOREIGN KEY (completed_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_updated_by_fkey;
ALTER TABLE planner.checklist_items
  ADD CONSTRAINT checklist_items_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.checklist_items
  DROP CONSTRAINT IF EXISTS checklist_items_created_by_fkey;
ALTER TABLE planner.checklist_items
  ADD CONSTRAINT checklist_items_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 10. ATTACHMENTS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.attachments
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill
UPDATE planner.attachments a
SET organization_id = i.organization_id
FROM planner.items i
WHERE a.item_id = i.id AND a.organization_id IS NULL;

ALTER TABLE planner.attachments
  ALTER COLUMN organization_id SET NOT NULL;

-- FKs
ALTER TABLE planner.attachments
  DROP CONSTRAINT IF EXISTS attachments_uploaded_by_fkey;
ALTER TABLE planner.attachments
  ADD CONSTRAINT attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.attachments
  DROP CONSTRAINT IF EXISTS attachments_updated_by_fkey;
ALTER TABLE planner.attachments
  ADD CONSTRAINT attachments_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.attachments
  DROP CONSTRAINT IF EXISTS attachments_created_by_fkey;
ALTER TABLE planner.attachments
  ADD CONSTRAINT attachments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 11. MENTIONS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.mentions
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill
UPDATE planner.mentions m
SET organization_id = c.organization_id
FROM planner.comments c
WHERE m.comment_id = c.id AND m.organization_id IS NULL;

-- FK
ALTER TABLE planner.mentions
  DROP CONSTRAINT IF EXISTS mentions_mentioned_member_id_fkey;
ALTER TABLE planner.mentions
  ADD CONSTRAINT mentions_mentioned_member_id_fkey
  FOREIGN KEY (mentioned_member_id) REFERENCES iam.organization_members(id) ON DELETE CASCADE;

-- ============================================================================
-- 12. ITEM_WATCHERS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.item_watchers
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill
UPDATE planner.item_watchers iw
SET organization_id = i.organization_id
FROM planner.items i
WHERE iw.item_id = i.id AND iw.organization_id IS NULL;

-- FK
ALTER TABLE planner.item_watchers
  DROP CONSTRAINT IF EXISTS item_watchers_member_id_fkey;
ALTER TABLE planner.item_watchers
  ADD CONSTRAINT item_watchers_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES iam.organization_members(id) ON DELETE CASCADE;

-- ============================================================================
-- 13. ATTENDEES: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.attendees
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Backfill
UPDATE planner.attendees a
SET organization_id = i.organization_id
FROM planner.items i
WHERE a.item_id = i.id AND a.organization_id IS NULL;

-- FKs
ALTER TABLE planner.attendees
  DROP CONSTRAINT IF EXISTS attendees_member_id_fkey;
ALTER TABLE planner.attendees
  ADD CONSTRAINT attendees_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES iam.organization_members(id) ON DELETE CASCADE;

ALTER TABLE planner.attendees
  DROP CONSTRAINT IF EXISTS attendees_updated_by_fkey;
ALTER TABLE planner.attendees
  ADD CONSTRAINT attendees_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.attendees
  DROP CONSTRAINT IF EXISTS attendees_created_by_fkey;
ALTER TABLE planner.attendees
  ADD CONSTRAINT attendees_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 14. REMINDERS: agregar organization_id, soft delete, created_by, FKs
-- ============================================================================

ALTER TABLE planner.reminders
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Backfill
UPDATE planner.reminders r
SET organization_id = i.organization_id
FROM planner.items i
WHERE r.item_id = i.id AND r.organization_id IS NULL;

-- FKs
ALTER TABLE planner.reminders
  DROP CONSTRAINT IF EXISTS reminders_created_by_fkey;
ALTER TABLE planner.reminders
  ADD CONSTRAINT reminders_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.reminders
  DROP CONSTRAINT IF EXISTS reminders_updated_by_fkey;
ALTER TABLE planner.reminders
  ADD CONSTRAINT reminders_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 15. BOARD_PERMISSIONS: agregar organization_id, soft delete, FKs
-- ============================================================================

ALTER TABLE planner.board_permissions
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS is_deleted bool NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Backfill
UPDATE planner.board_permissions bp
SET organization_id = b.organization_id
FROM planner.boards b
WHERE bp.board_id = b.id AND bp.organization_id IS NULL;

-- FKs
ALTER TABLE planner.board_permissions
  DROP CONSTRAINT IF EXISTS board_permissions_member_id_fkey;
ALTER TABLE planner.board_permissions
  ADD CONSTRAINT board_permissions_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES iam.organization_members(id) ON DELETE CASCADE;

ALTER TABLE planner.board_permissions
  DROP CONSTRAINT IF EXISTS board_permissions_role_id_fkey;
ALTER TABLE planner.board_permissions
  ADD CONSTRAINT board_permissions_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES iam.roles(id) ON DELETE CASCADE;

ALTER TABLE planner.board_permissions
  DROP CONSTRAINT IF EXISTS board_permissions_created_by_fkey;
ALTER TABLE planner.board_permissions
  ADD CONSTRAINT board_permissions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

ALTER TABLE planner.board_permissions
  DROP CONSTRAINT IF EXISTS board_permissions_updated_by_fkey;
ALTER TABLE planner.board_permissions
  ADD CONSTRAINT board_permissions_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 16. ITEM_LABELS: agregar organization_id, FKs
-- ============================================================================

ALTER TABLE planner.item_labels
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Backfill
UPDATE planner.item_labels il
SET organization_id = i.organization_id
FROM planner.items i
WHERE il.item_id = i.id AND il.organization_id IS NULL;

-- FK created_by
ALTER TABLE planner.item_labels
  DROP CONSTRAINT IF EXISTS item_labels_created_by_fkey;
ALTER TABLE planner.item_labels
  ADD CONSTRAINT item_labels_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES iam.organization_members(id) ON DELETE SET NULL;

-- ============================================================================
-- 17. ELIMINAR POLICIES DELETE (usar soft delete según el SKILL)
-- ============================================================================

DROP POLICY IF EXISTS "MIEMBROS BORRAN ITEMS" ON planner.items;
DROP POLICY IF EXISTS "MIEMBROS BORRAN ITEM_LABELS" ON planner.item_labels;
DROP POLICY IF EXISTS "MIEMBROS BORRAN ITEM_WATCHERS" ON planner.item_watchers;

-- ============================================================================
-- 18. TRIGGERS set_timestamp FALTANTES
-- ============================================================================

-- Comments ya tiene updated_at pero le falta trigger
CREATE TRIGGER comments_set_updated_at BEFORE UPDATE ON planner.comments
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Attendees (nuevo updated_at)
CREATE TRIGGER attendees_set_updated_at BEFORE UPDATE ON planner.attendees
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Board Permissions (nuevo updated_at)
CREATE TRIGGER board_permissions_set_updated_at BEFORE UPDATE ON planner.board_permissions
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- Reminders (nuevo updated_at)
CREATE TRIGGER reminders_set_updated_at BEFORE UPDATE ON planner.reminders
  FOR EACH ROW EXECUTE FUNCTION set_timestamp();

-- ============================================================================
-- 19. TRIGGERS handle_updated_by FALTANTES
-- ============================================================================
-- PROBLEMA: handle_updated_by() necesita NEW.organization_id para resolver
-- el member_id. Las tablas hijas vía item_id NO tenían organization_id.
-- Ahora que lo agregamos, podemos crear los triggers.

-- Attachments
DROP TRIGGER IF EXISTS set_updated_by_attachments ON planner.attachments;
CREATE TRIGGER set_updated_by_attachments BEFORE INSERT OR UPDATE ON planner.attachments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- Comments
DROP TRIGGER IF EXISTS set_updated_by_comments ON planner.comments;
CREATE TRIGGER set_updated_by_comments BEFORE INSERT OR UPDATE ON planner.comments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- Attendees
CREATE TRIGGER set_updated_by_attendees BEFORE INSERT OR UPDATE ON planner.attendees
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- Board Permissions
CREATE TRIGGER set_updated_by_board_permissions BEFORE INSERT OR UPDATE ON planner.board_permissions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- Reminders
CREATE TRIGGER set_updated_by_reminders BEFORE INSERT OR UPDATE ON planner.reminders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- Checklist Items (ya existía updated_by pero necesita trigger con org_id)
DROP TRIGGER IF EXISTS set_updated_by_checklist_items ON planner.checklist_items;
CREATE TRIGGER set_updated_by_checklist_items BEFORE INSERT OR UPDATE ON planner.checklist_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_by();

-- ============================================================================
-- 20. SET NOT NULL en organization_id después de todos los backfills
-- ============================================================================

-- Solo si las tablas tienen datos:
DO $$
BEGIN
  -- checklist_items puede tener org_id NULL si no hubo checklists
  IF NOT EXISTS (SELECT 1 FROM planner.checklist_items WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.checklist_items ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.mentions WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.mentions ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.item_watchers WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.item_watchers ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.attendees WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.attendees ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.reminders WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.reminders ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.board_permissions WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.board_permissions ALTER COLUMN organization_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM planner.item_labels WHERE organization_id IS NULL) THEN
    ALTER TABLE planner.item_labels ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 21. RECREAR RLS POLICIES PARA TABLAS CON org_id DIRECTO
-- ============================================================================
-- Ahora que las tablas hijas tienen organization_id propio, podemos
-- simplificar las RLS policies (no necesitan JOIN al parent).

-- Comments (ahora con organization_id directo)
DROP POLICY IF EXISTS "MIEMBROS VEN COMMENTS" ON planner.comments;
CREATE POLICY "MIEMBROS VEN COMMENTS"
  ON planner.comments FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN COMMENTS" ON planner.comments;
CREATE POLICY "MIEMBROS CREAN COMMENTS"
  ON planner.comments FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN COMMENTS" ON planner.comments;
CREATE POLICY "MIEMBROS EDITAN COMMENTS"
  ON planner.comments FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'planner.manage'));

-- Checklists (ahora con organization_id directo)
DROP POLICY IF EXISTS "MIEMBROS VEN CHECKLISTS" ON planner.checklists;
CREATE POLICY "MIEMBROS VEN CHECKLISTS"
  ON planner.checklists FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN CHECKLISTS" ON planner.checklists;
CREATE POLICY "MIEMBROS CREAN CHECKLISTS"
  ON planner.checklists FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CHECKLISTS" ON planner.checklists;
CREATE POLICY "MIEMBROS EDITAN CHECKLISTS"
  ON planner.checklists FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'planner.manage'));

-- Checklist Items  
DROP POLICY IF EXISTS "MIEMBROS VEN CHECKLIST_ITEMS" ON planner.checklist_items;
CREATE POLICY "MIEMBROS VEN CHECKLIST_ITEMS"
  ON planner.checklist_items FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN CHECKLIST_ITEMS" ON planner.checklist_items;
CREATE POLICY "MIEMBROS CREAN CHECKLIST_ITEMS"
  ON planner.checklist_items FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN CHECKLIST_ITEMS" ON planner.checklist_items;
CREATE POLICY "MIEMBROS EDITAN CHECKLIST_ITEMS"
  ON planner.checklist_items FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'planner.manage'));

-- Attachments
DROP POLICY IF EXISTS "MIEMBROS VEN ATTACHMENTS" ON planner.attachments;
CREATE POLICY "MIEMBROS VEN ATTACHMENTS"
  ON planner.attachments FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN ATTACHMENTS" ON planner.attachments;
CREATE POLICY "MIEMBROS CREAN ATTACHMENTS"
  ON planner.attachments FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN ATTACHMENTS" ON planner.attachments;
CREATE POLICY "MIEMBROS EDITAN ATTACHMENTS"
  ON planner.attachments FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'planner.manage'));

-- Mentions
DROP POLICY IF EXISTS "MIEMBROS VEN MENTIONS" ON planner.mentions;
CREATE POLICY "MIEMBROS VEN MENTIONS"
  ON planner.mentions FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN MENTIONS" ON planner.mentions;
CREATE POLICY "MIEMBROS CREAN MENTIONS"
  ON planner.mentions FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

-- Item Watchers
DROP POLICY IF EXISTS "MIEMBROS VEN ITEM_WATCHERS" ON planner.item_watchers;
CREATE POLICY "MIEMBROS VEN ITEM_WATCHERS"
  ON planner.item_watchers FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN ITEM_WATCHERS" ON planner.item_watchers;
CREATE POLICY "MIEMBROS CREAN ITEM_WATCHERS"
  ON planner.item_watchers FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

-- Attendees
DROP POLICY IF EXISTS "MIEMBROS VEN ATTENDEES" ON planner.attendees;
CREATE POLICY "MIEMBROS VEN ATTENDEES"
  ON planner.attendees FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN ATTENDEES" ON planner.attendees;
CREATE POLICY "MIEMBROS CREAN ATTENDEES"
  ON planner.attendees FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

DROP POLICY IF EXISTS "MIEMBROS EDITAN ATTENDEES" ON planner.attendees;
CREATE POLICY "MIEMBROS EDITAN ATTENDEES"
  ON planner.attendees FOR UPDATE TO public
  USING (can_mutate_org(organization_id, 'planner.manage'));

-- Reminders
DROP POLICY IF EXISTS "MIEMBROS VEN REMINDERS" ON planner.reminders;
CREATE POLICY "MIEMBROS VEN REMINDERS"
  ON planner.reminders FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN REMINDERS" ON planner.reminders;
CREATE POLICY "MIEMBROS CREAN REMINDERS"
  ON planner.reminders FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

-- Board Permissions
DROP POLICY IF EXISTS "MIEMBROS VEN BOARD_PERMISSIONS" ON planner.board_permissions;
CREATE POLICY "MIEMBROS VEN BOARD_PERMISSIONS"
  ON planner.board_permissions FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view') AND is_deleted = false);

DROP POLICY IF EXISTS "MIEMBROS CREAN BOARD_PERMISSIONS" ON planner.board_permissions;
CREATE POLICY "MIEMBROS CREAN BOARD_PERMISSIONS"
  ON planner.board_permissions FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

-- Item Labels
DROP POLICY IF EXISTS "MIEMBROS VEN ITEM_LABELS" ON planner.item_labels;
CREATE POLICY "MIEMBROS VEN ITEM_LABELS"
  ON planner.item_labels FOR SELECT TO public
  USING (can_view_org(organization_id, 'planner.view'));

DROP POLICY IF EXISTS "MIEMBROS CREAN ITEM_LABELS" ON planner.item_labels;
CREATE POLICY "MIEMBROS CREAN ITEM_LABELS"
  ON planner.item_labels FOR INSERT TO public
  WITH CHECK (can_mutate_org(organization_id, 'planner.manage'));

-- ============================================================================
-- 22. INDEXES para las nuevas columnas organization_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_org ON planner.comments (organization_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_checklists_org ON planner.checklists (organization_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_attachments_org ON planner.attachments (organization_id) WHERE is_deleted = false;

-- ============================================================================
-- FIN
-- ============================================================================
