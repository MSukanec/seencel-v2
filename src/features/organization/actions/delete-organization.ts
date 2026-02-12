'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sanitizeError } from '@/lib/error-utils';

/**
 * Soft-deletes an organization.
 * 
 * Rules:
 * - Only the organization owner can delete it
 * - Cannot delete the currently active organization
 * - Soft delete: sets is_deleted = true, deleted_at = now()
 */
export async function deleteOrganization(
    organizationId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: "No autenticado" };
    }

    // 2. Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // 3. Verify ownership
    const { data: org } = await supabase
        .from('organizations')
        .select('id, owner_id, name')
        .eq('id', organizationId)
        .single();

    if (!org) {
        return { success: false, error: "Organización no encontrada" };
    }

    if (org.owner_id !== userData.id) {
        return { success: false, error: "Solo el dueño puede eliminar la organización" };
    }

    // 4. Verify it's not the active organization
    const { data: prefs } = await supabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userData.id)
        .single();

    if (prefs?.last_organization_id === organizationId) {
        return { success: false, error: "No puedes eliminar tu organización activa. Cambiá a otra primero." };
    }

    // 5. Soft delete
    const { error } = await supabase
        .from('organizations')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

    if (error) {
        console.error("Error deleting organization:", error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
