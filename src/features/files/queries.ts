"use server";

import { createClient } from "@/lib/supabase/server";
import type { SavedView } from "./types";

// ============================================================================
// FILES QUERIES
// ============================================================================

/**
 * Get files for an organization, optionally filtered by project
 * @param organizationId - The organization ID
 * @param projectId - Optional project ID to filter by (null = all org files)
 */
export async function getFiles(organizationId: string, projectId?: string | null) {
    const supabase = await createClient();

    let query = supabase
        .from('media_links')
        .select(`
            id, category, project_id, organization_id,
            site_log_id, client_payment_id, material_payment_id, material_purchase_id,
            subcontract_payment_id, general_cost_payment_id, labor_payment_id,
            partner_contribution_id, partner_withdrawal_id, pin_id, forum_thread_id,
            course_id, testimonial_id,
            media_files!inner (
                id, file_name, file_type, file_size, bucket, file_path, created_at
            )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .eq('media_files.is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(500);

    // Filter by project if provided
    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching files:', error);
        return [];
    }

    if (!data || data.length === 0) return [];

    // Batch signed URLs — group files by bucket, then one call per bucket
    const bucketGroups: Record<string, { index: number; path: string }[]> = {};
    data.forEach((item: any, index: number) => {
        if (!item.media_files?.bucket || !item.media_files?.file_path) return;
        const bucket = item.media_files.bucket;
        if (!bucketGroups[bucket]) bucketGroups[bucket] = [];
        bucketGroups[bucket].push({ index, path: item.media_files.file_path });
    });

    // One createSignedUrls call per bucket (instead of N individual calls)
    await Promise.all(
        Object.entries(bucketGroups).map(async ([bucket, files]) => {
            try {
                const paths = files.map(f => f.path);
                const { data: signedData } = await supabase
                    .storage
                    .from(bucket)
                    .createSignedUrls(paths, 3600); // 1 hour expiry

                if (signedData) {
                    signedData.forEach((signed, i) => {
                        if (signed.signedUrl) {
                            (data[files[i].index] as any).media_files.signed_url = signed.signedUrl;
                        }
                    });
                }
            } catch (e) {
                console.error(`Error batch signing URLs for bucket ${bucket}:`, e);
            }
        })
    );

    return data as any;
}

// ============================================================================
// STORAGE STATS
// ============================================================================

export interface StorageStats {
    /** Total bytes used */
    totalBytes: number;
    /** Number of files */
    fileCount: number;
    /** Breakdown by file type */
    byType: { type: string; count: number; bytes: number }[];
}

/**
 * Get storage statistics for an organization.
 * Calculates total space used, file count, and distribution by type.
 */
export async function getStorageStats(organizationId: string): Promise<StorageStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('media_files')
        .select('file_type, file_size')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false);

    if (error) {
        console.error('Error fetching storage stats:', error);
        return { totalBytes: 0, fileCount: 0, byType: [] };
    }

    if (!data || data.length === 0) {
        return { totalBytes: 0, fileCount: 0, byType: [] };
    }

    let totalBytes = 0;
    const typeAgg: Record<string, { count: number; bytes: number }> = {};

    for (const row of data) {
        const size = Number(row.file_size) || 0;
        totalBytes += size;

        const type = row.file_type || 'other';
        if (!typeAgg[type]) typeAgg[type] = { count: 0, bytes: 0 };
        typeAgg[type].count++;
        typeAgg[type].bytes += size;
    }

    const byType = Object.entries(typeAgg)
        .map(([type, agg]) => ({ type, ...agg }))
        .sort((a, b) => b.bytes - a.bytes);

    return { totalBytes, fileCount: data.length, byType };
}

// ============================================================================
// SAVED VIEWS
// ============================================================================

/**
 * Get saved views for an organization filtered by entity type.
 */
export async function getSavedViews(
    organizationId: string,
    entityType: string
): Promise<SavedView[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('saved_views')
        .select('id, organization_id, name, entity_type, view_mode, filters, is_default, position, created_at, updated_at')
        .eq('organization_id', organizationId)
        .eq('entity_type', entityType)
        .eq('is_deleted', false)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error fetching saved views:', error);
        return [];
    }

    return (data || []) as SavedView[];
}
