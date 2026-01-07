export interface ContactType {
    id: string;
    organization_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface ContactTypeLink {
    id: string;
    contact_id: string;
    contact_type_id: string;
    organization_id: string;
    type_name?: string; // from join
}

export interface Contact {
    id: string;
    organization_id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
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
    image_bucket: string | null;
    image_path: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface ContactWithRelations extends Contact {
    linked_user_full_name: string | null;
    linked_user_email: string | null;
    linked_user_avatar_url: string | null;
    contact_types: { id: string; name: string }[];
    is_organization_member: boolean;
}

export interface ContactSummary {
    organization_id: string;
    total_contacts: number;
    linked_contacts: number;
    member_contacts: number;
}

export interface ContactTypeCount {
    organization_id: string;
    contact_type_id: string;
    contact_type_name: string;
    total_contacts: number;
}
