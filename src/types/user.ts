export type AvatarSource = 'email' | 'upload' | 'google' | 'microsoft';

export interface User {
    id: string;
    auth_id: string;
    email: string;
    avatar_url: string | null;
    avatar_source: AvatarSource | null;
    full_name: string | null;
    role_id: string;
    is_active: boolean;
    signup_completed: boolean;
    created_at: string;
    updated_at: string | null;
}

export interface UserData {
    id: string;
    user_id: string;
    country: string | null;
    birthdate: string | null; // Date string YYYY-MM-DD
    first_name: string | null;
    last_name: string | null;
    phone_e164: string | null;
    created_at: string | null;
    updated_at: string | null;
}

// Combined interface for UI consumption
export interface UserProfile extends User {
    // Flattened user_data properties
    country: string | null;
    birthdate: string | null;
    first_name: string | null;
    last_name: string | null;
    phone_e164: string | null;
    user_data_id: string | null; // To track if user_data record exists
}

