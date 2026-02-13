// ============================================
// ORGANIZATION DASHBOARD TYPES
// Enterprise-grade typing for dashboard data
// ============================================

import type { User } from "@supabase/supabase-js";

// ----------------------------------------------------------------------------
// ORGANIZATION TYPE
// ----------------------------------------------------------------------------

export interface OrganizationData {
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    tax_id: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    lat: number | null;
    lng: number | null;
}

export interface Organization {
    id: string;
    name: string;
    logo_url: string | null;
    settings: Record<string, unknown> | null;
    organization_data: OrganizationData | null;
}

// ----------------------------------------------------------------------------
// DASHBOARD STATS TYPE
// ----------------------------------------------------------------------------

export interface DashboardStats {
    activeProjects: number;
    documentsLast30Days: number;
    totalTasks: number;
    teamSize: number;
}

// ----------------------------------------------------------------------------
// PROJECT TYPE (from projects_view)
// ----------------------------------------------------------------------------

export interface DashboardProject {
    id: string;
    name: string;
    status: string;
    progress: number | null;
    image_url: string | null;
    updated_at: string;
    organization_id: string;
    is_active: boolean;
}

// ----------------------------------------------------------------------------
// ACTIVITY TYPE (from organization_activity_logs_view)
// ----------------------------------------------------------------------------

export interface DashboardActivity {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_name: string | null;
    created_at: string;
    user_name: string | null;
    user_avatar: string | null;
    metadata: Record<string, unknown> | null;
}

// ----------------------------------------------------------------------------
// FINANCIAL MOVEMENT TYPE (from unified_financial_movements_view)
// ----------------------------------------------------------------------------

export interface DashboardMovement {
    id: string;
    type: string;
    amount: number;
    currency_code: string;
    payment_date: string;
    description: string | null;
    entity_name: string | null;
}

// ----------------------------------------------------------------------------
// VIEW PROPS INTERFACE
// ----------------------------------------------------------------------------

export interface OrganizationOverviewData {
    user: User;
    organization: Organization;
    stats: DashboardStats;
    projects: DashboardProject[];
    movements: DashboardMovement[];
    activity: DashboardActivity[];
}

// Type for getDashboardData return (includes error handling)
export type DashboardDataResult =
    | OrganizationOverviewData
    | { error: string };

