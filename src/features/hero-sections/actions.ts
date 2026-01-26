"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateHeroSectionInput {
    section_type?: string;
    order_index?: number;
    title?: string;
    description?: string;
    media_url?: string;
    media_type?: string;
    primary_button_text?: string;
    primary_button_action?: string;
    primary_button_action_type?: string;
    secondary_button_text?: string;
    secondary_button_action?: string;
    secondary_button_action_type?: string;
    is_active?: boolean;
}

export interface UpdateHeroSectionInput extends CreateHeroSectionInput {
    id: string;
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Create a new hero section
 */
export async function createHeroSection(input: CreateHeroSectionInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('hero_sections')
        .insert({
            section_type: input.section_type || 'hub_hero',
            order_index: input.order_index || 0,
            title: input.title || null,
            description: input.description || null,
            media_url: input.media_url || null,
            media_type: input.media_type || 'image',
            primary_button_text: input.primary_button_text || null,
            primary_button_action: input.primary_button_action || null,
            primary_button_action_type: input.primary_button_action_type || 'url',
            secondary_button_text: input.secondary_button_text || null,
            secondary_button_action: input.secondary_button_action || null,
            secondary_button_action_type: input.secondary_button_action_type || 'url',
            is_active: input.is_active ?? true,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating hero section:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/hub-content');
    revalidatePath('/hub');

    return { success: true, data };
}

/**
 * Update an existing hero section
 */
export async function updateHeroSection(input: UpdateHeroSectionInput) {
    const supabase = await createClient();

    const { id, ...updates } = input;

    const { data, error } = await supabase
        .from('hero_sections')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error("Error updating hero section:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/hub-content');
    revalidatePath('/hub');

    return { success: true, data };
}

/**
 * Toggle hero section active status
 */
export async function toggleHeroSectionActive(id: string, isActive: boolean) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('hero_sections')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error("Error toggling hero section:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/hub-content');
    revalidatePath('/hub');

    return { success: true };
}

/**
 * Delete a hero section (soft delete)
 */
export async function deleteHeroSection(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('hero_sections')
        .update({
            is_deleted: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error("Error deleting hero section:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/hub-content');
    revalidatePath('/hub');

    return { success: true };
}

/**
 * Reorder hero sections
 */
export async function reorderHeroSections(orderedIds: string[]) {
    const supabase = await createClient();

    const updates = orderedIds.map((id, index) => ({
        id,
        order_index: index,
        updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
        const { error } = await supabase
            .from('hero_sections')
            .update({ order_index: update.order_index, updated_at: update.updated_at })
            .eq('id', update.id);

        if (error) {
            console.error("Error reordering hero section:", error);
            return { success: false, error: error.message };
        }
    }

    revalidatePath('/admin/hub-content');
    revalidatePath('/hub');

    return { success: true };
}
