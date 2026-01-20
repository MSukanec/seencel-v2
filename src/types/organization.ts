export interface OrganizationMemberDetail {
    member_id: string; // from updated view logic or query
    id: string; // Some views use id maps to member_id
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
}

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    billing_period: 'monthly' | 'annual';
    currency: string;
    features: any; // JSONB with feature flags
}

export interface OrganizationSubscription {
    id: string;
    status: string;
    billing_period: string;
    started_at: string;
    expires_at: string;
    amount: number;
    currency: string;
    plan_id: string;
    plan?: Plan; // Joined
}

export interface OrganizationBillingCycle {
    id: string;
    period_start: string;
    period_end: string;
    total_amount: number;
    status: string;
    paid: boolean;
    currency_code: string;
    created_at: string;
}

export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
    country: string | null;
}

export interface Wallet {
    id: string;
    name: string;
    is_active: boolean;
}

export interface OrganizationCurrency {
    id: string;
    organization_id: string;
    currency_id: string;
    is_active: boolean;
    is_default: boolean;
    currency_code?: string;
    currency_name?: string;
    currency_symbol?: string;
}

export interface OrganizationWallet {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallet_name?: string;
}

export interface OrganizationPreferences {
    id: string;
    organization_id: string;
    default_currency_id: string | null;
    functional_currency_id: string | null;
    default_wallet_id: string | null;
    default_pdf_template_id: string | null;
    use_currency_exchange: boolean;
    currency_decimal_places: number; // 0, 1, or 2 - controls decimal display globally
    insight_config?: any; // JSONB
    default_tax_label?: string; // IVA, VAT, Sales Tax, etc.
}

export interface OrganizationSettingsData {
    members: OrganizationMemberDetail[];
    invitations: OrganizationInvitation[];
    roles: Role[];
    permissions: Permission[];
    rolePermissions: RolePermission[];
    activityLogs?: OrganizationActivityLog[];
    subscription?: OrganizationSubscription | null;
    billingCycles?: OrganizationBillingCycle[];
    preferences?: OrganizationPreferences | null;
    contactCurrencies?: OrganizationCurrency[]; // Org's active currencies
    contactWallets?: OrganizationWallet[]; // Org's active wallets (using contact vs org prefix to match pattern if needed, but 'orgCurrencies' is clearer)
    availableCurrencies?: Currency[]; // All global
    availableWallets?: Wallet[]; // All global
}
