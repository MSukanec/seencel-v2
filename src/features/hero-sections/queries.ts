import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface HeroSection {
    id: string;
    section_type: string;
    order_index: number;
    title: string | null;
    description: string | null;
    media_url: string | null;
    media_type: string | null;
    primary_button_text: string | null;
    primary_button_action: string | null;
    primary_button_action_type: string | null;
    secondary_button_text: string | null;
    secondary_button_action: string | null;
    secondary_button_action_type: string | null;
    is_active: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all hero sections for a specific section type
 */
export async function getHeroSections(sectionType: string = 'hub_hero'): Promise<HeroSection[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .eq('section_type', sectionType)
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

    if (error) {
        console.error("Error fetching hero sections:", error);
        return [];
    }

    return data || [];
}

/**
 * Get active hero sections for display (only is_active = true)
 */
export async function getActiveHeroSections(sectionType: string = 'hub_hero'): Promise<HeroSection[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .eq('section_type', sectionType)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

    if (error) {
        console.error("Error fetching active hero sections:", error);
        return [];
    }

    return data || [];
}

/**
 * Get a single hero section by ID
 */
export async function getHeroSectionById(id: string): Promise<HeroSection | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching hero section:", error);
        return null;
    }

    return data;
}
