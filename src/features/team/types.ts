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
