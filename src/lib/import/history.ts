"use server";

import { createClient } from "@/lib/supabase/server";
import type { ImportBatch } from "./types";

/**
 * Get import history for an organization
 * Returns last 20 imports, optionally filtered by entity type
 */
export async function getImportHistory(
    organizationId: string,
    entityType?: string
): Promise<ImportBatch[]> {
    const supabase = await createClient();

    // Query with join to get member info
    let query = supabase
        .from('import_batches')
        .select(`
            id,
            organization_id,
            entity_type,
            record_count,
            status,
            created_at,
            member_id,
            organization_members (
                users (
                    full_name,
                    avatar_url
                )
            )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (entityType) {
        query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching import history:", error);
        return [];
    }

    // Transform data with member info
    return (data || []).map((batch: any) => ({
        id: batch.id,
        organization_id: batch.organization_id,
        entity_type: batch.entity_type,
        record_count: batch.record_count,
        status: batch.status,
        created_at: batch.created_at,
        member_id: batch.member_id,
        user_full_name: batch.organization_members?.users?.full_name || 'Usuario',
        user_avatar_url: batch.organization_members?.users?.avatar_url,
    }));
}
