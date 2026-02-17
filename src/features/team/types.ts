// ============================================
// TEAM TYPES
// Types for members, roles, permissions, invitations
// ============================================

export interface OrganizationMemberDetail {
    member_id: string;
    id: string;
    organization_id: string;
    user_id: string;
    role_id: string;
    is_active: boolean;
    joined_at: string;
    invited_by: string | null;
    user_full_name: string | null;
    user_email: string | null;
    user_avatar_url: string | null;
    role_name: string | null;
    role_type: string | null;
    is_billable: boolean;
    last_active_at: string | null;
}

export interface OrganizationInvitation {
    id: string;
    organization_id: string;
    email: string;
    status: 'pending' | 'registered' | 'accepted' | 'rejected';
    role_id: string;
    invited_by: string;
    created_at: string;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
    type: string | null;
    organization_id: string | null;
    is_system: boolean;
}

export interface Permission {
    id: string;
    key: string;
    description: string;
    category: string;
    is_system: boolean;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
}

export interface OrganizationActivityLog {
    id: string;
    organization_id: string;
    user_id: string | null;
    action: string;
    target_table: string;
    target_id: string | null;
    metadata: any;
    created_at: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    role_name: string | null;
}

export interface SeatStatus {
    seats_included: number;
    max_members: number;
    purchased: number;
    total_capacity: number;
    used: number;
    pending_invitations: number;
    available: number;
    can_invite: boolean;
    can_buy_more: boolean;
    seat_price_monthly: number;
    seat_price_annual: number;
    plan_slug: string | null;
    billing_period: 'monthly' | 'annual' | null;
    expires_at: string | null;
    days_remaining: number;
    prorated_price: number;
}

export interface PurchaseSeatsInput {
    organizationId: string;
    planId: string;
    seatsCount: number;
    billingPeriod: 'monthly' | 'annual';
}

// ============================================
// EXTERNAL ACTORS
// ============================================

export interface ExternalActorDetail {
    id: string;
    organization_id: string;
    user_id: string;
    actor_type: string;
    is_active: boolean;
    created_at: string;
    // Joined from users
    user_full_name: string | null;
    user_email: string | null;
    user_avatar_url: string | null;
}

/** Labels for external actor types */
export const EXTERNAL_ACTOR_TYPE_LABELS: Record<string, { label: string; description: string }> = {
    client: {
        label: 'Cliente',
        description: 'Tu cliente puede seguir el avance de su obra, ver documentos y consultar estados de cuenta desde su propio portal.',
    },
    accountant: {
        label: 'Contador',
        description: 'Acceso a reportes financieros y datos contables de la organización.',
    },
    field_worker: {
        label: 'Trabajador de campo',
        description: 'Acceso a tareas asignadas, bitácora y carga de fotos en obra.',
    },
    external_site_manager: {
        label: 'Director de obra externo',
        description: 'Acceso a planificación, avance y bitácora de obras asignadas.',
    },
    subcontractor_portal_user: {
        label: 'Subcontratista',
        description: 'Acceso a contratos, certificaciones y pagos de subcontratos.',
    },
};

/** Actor types that are "clients" — unlimited, separate section */
export const CLIENT_ACTOR_TYPES = ['client'] as const;

/** Actor types that are "advisors/collaborators" — limited by plan */
export const ADVISOR_ACTOR_TYPES = ['accountant', 'field_worker', 'external_site_manager', 'subcontractor_portal_user'] as const;

/** Labels only for advisor types (used in the advisor form) */
export const ADVISOR_ACTOR_TYPE_LABELS: Record<string, { label: string; description: string }> = Object.fromEntries(
    ADVISOR_ACTOR_TYPES.map(key => [key, EXTERNAL_ACTOR_TYPE_LABELS[key]])
);


