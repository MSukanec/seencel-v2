-- DB/025_add_invitation_id_to_clients_view.sql
-- Agrega invitation_id e invitation_sent_at a project_clients_view
-- para soportar acciones de Reenviar / Revocar desde el frontend.

-- 1. DROP vistas dependientes
DROP VIEW IF EXISTS public.client_payments_view;
DROP VIEW IF EXISTS public.project_clients_view;

-- 2. RECREAR project_clients_view con invitation_id e invitation_sent_at
CREATE OR REPLACE VIEW public.project_clients_view AS
SELECT
    pc.id,
    pc.project_id,
    pc.organization_id,
    pc.contact_id,
    pc.client_role_id,
    pc.is_primary,
    pc.status,
    pc.notes,
    pc.created_at,
    pc.updated_at,
    pc.is_deleted,
    c.full_name          AS contact_full_name,
    c.first_name         AS contact_first_name,
    c.last_name          AS contact_last_name,
    c.email              AS contact_email,
    c.phone              AS contact_phone,
    c.company_name       AS contact_company_name,
    c.image_url          AS contact_image_url,
    c.linked_user_id,
    u.avatar_url         AS linked_user_avatar_url,
    COALESCE(u.avatar_url, c.image_url) AS contact_avatar_url,
    cr.name              AS role_name,
    -- Invitation status (solo si hay una pendiente)
    (
        SELECT inv.status
        FROM iam.organization_invitations inv
        WHERE inv.client_id = pc.id
          AND inv.organization_id = pc.organization_id
          AND inv.status = 'pending'
        ORDER BY inv.created_at DESC
        LIMIT 1
    ) AS invitation_status,
    -- Invitation ID (para poder llamar Reenviar / Revocar)
    (
        SELECT inv.id
        FROM iam.organization_invitations inv
        WHERE inv.client_id = pc.id
          AND inv.organization_id = pc.organization_id
          AND inv.status = 'pending'
        ORDER BY inv.created_at DESC
        LIMIT 1
    ) AS invitation_id,
    -- Fecha de envío (para mostrar "Enviado el X")
    (
        SELECT inv.created_at
        FROM iam.organization_invitations inv
        WHERE inv.client_id = pc.id
          AND inv.organization_id = pc.organization_id
          AND inv.status = 'pending'
        ORDER BY inv.created_at DESC
        LIMIT 1
    ) AS invitation_sent_at
FROM public.project_clients pc
LEFT JOIN public.contacts c       ON c.id = pc.contact_id
LEFT JOIN public.users u          ON u.id = c.linked_user_id
LEFT JOIN public.client_roles cr  ON cr.id = pc.client_role_id
WHERE pc.is_deleted = false;

-- 3. RECREAR client_payments_view (sin joins anidados, SQL estándar)
CREATE OR REPLACE VIEW public.client_payments_view AS
SELECT
    cp.id,
    cp.organization_id,
    cp.project_id,
    cp.client_id,
    cp.commitment_id,
    cp.amount,
    cp.currency_id,
    cp.exchange_rate,
    cp.payment_date,
    cp.status,
    cp.wallet_id,
    cp.reference,
    cp.notes,
    cp.created_at,
    cp.created_by,
    cp.schedule_id,
    cp.updated_at,
    cp.is_deleted,
    date_trunc('month', cp.payment_date::timestamptz) AS payment_month,
    -- Datos del cliente
    c.full_name          AS client_name,
    c.first_name         AS client_first_name,
    c.last_name          AS client_last_name,
    c.company_name       AS client_company_name,
    c.email              AS client_email,
    c.phone              AS client_phone,
    cr.name              AS client_role_name,
    c.image_url          AS client_image_url,
    u_client.avatar_url  AS client_linked_user_avatar_url,
    COALESCE(u_client.avatar_url, c.image_url) AS client_avatar_url,
    -- Wallet
    w.name               AS wallet_name,
    -- Moneda
    cur.symbol           AS currency_symbol,
    cur.code             AS currency_code,
    -- Compromiso y schedule
    cc.concept           AS commitment_concept,
    cps.notes            AS schedule_notes,
    -- Creador
    u_creator.full_name  AS creator_full_name,
    u_creator.avatar_url AS creator_avatar_url,
    -- Proyecto
    p.name               AS project_name,
    p.image_url          AS project_image_url,
    p.color              AS project_color
FROM public.client_payments cp
LEFT JOIN public.project_clients        pc         ON pc.id = cp.client_id
LEFT JOIN public.contacts               c          ON c.id = pc.contact_id
LEFT JOIN public.users                  u_client   ON u_client.id = c.linked_user_id
LEFT JOIN public.client_roles           cr         ON cr.id = pc.client_role_id
LEFT JOIN public.organization_wallets   ow         ON ow.id = cp.wallet_id
LEFT JOIN public.wallets                w          ON w.id = ow.wallet_id
LEFT JOIN public.currencies             cur        ON cur.id = cp.currency_id
LEFT JOIN public.client_commitments     cc         ON cc.id = cp.commitment_id
LEFT JOIN public.client_payment_schedule cps       ON cps.id = cp.schedule_id
LEFT JOIN public.organization_members   om         ON om.id = cp.created_by
LEFT JOIN public.users                  u_creator  ON u_creator.id = om.user_id
LEFT JOIN public.projects               p          ON p.id = cp.project_id
WHERE cp.is_deleted = false;
