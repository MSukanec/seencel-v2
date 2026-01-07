
export type SidebarMode = 'collapsed' | 'expanded_hover' | 'docked';

export interface UserPreferences {
    id: string;
    user_id: string;
    last_organization_id: string | null;
    theme: 'light' | 'dark';
    onboarding_completed: boolean;
    created_at: string | null;
    sidebar_mode: SidebarMode; // Replaces sidebar_docked
    updated_at: string | null;
    last_user_type: string | null; // public.user_type enum string
    home_checklist: Record<string, boolean>;
    home_banner_dismissed: boolean;
    last_home_seen_at: string;
    layout: string;
    language: string;
}
