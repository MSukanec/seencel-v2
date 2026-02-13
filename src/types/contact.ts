export interface ContactCategory {
    id: string;
    organization_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface ContactCategoryLink {
    id: string;
    contact_id: string;
    contact_category_id: string;
    organization_id: string;
    category_name?: string; // from join
}

export type ContactType = 'person' | 'company';

export interface Contact {
    id: string;
    organization_id: string;
    contact_type: ContactType;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    company_id: string | null;
    location: string | null;
    notes: string | null;
    national_id: string | null;
    linked_user_id: string | null;
    is_local: boolean;
    sync_status: string;
    display_name_override: string | null;
    linked_at: string | null;
    created_at: string;
    updated_at: string;
    image_url: string | null; // Public URL for avatar
    avatar_updated_at: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface ContactWithRelations extends Contact {
    linked_user_full_name: string | null;
    linked_user_email: string | null;
    linked_user_avatar_url: string | null;
    resolved_avatar_url: string | null; // Computed: COALESCE(linked_user.avatar, contact.image_url)
    contact_categories: { id: string; name: string }[];
    is_organization_member: boolean;
    linked_company_name: string | null;
    resolved_company_name: string | null;
}

export interface ContactSummary {
    organization_id: string;
    total_contacts: number;
    linked_contacts: number;
    member_contacts: number;
}

export interface ContactCategoryCount {
    organization_id: string;
    contact_category_id: string;
    contact_category_name: string;
    total_contacts: number;
}
