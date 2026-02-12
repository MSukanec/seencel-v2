"use server";

import { createClient } from "@/lib/supabase/server";
import type { Folder } from "./types";

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
            *,
            media_files (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    // Filter by project if provided
    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching files:', error);
        return [];
    }

    // Generate signed URLs for private files
    const filesWithUrls = await Promise.all(data!.map(async (item: any) => {
        if (!item.media_files) return item;

        try {
            const { data: signedData } = await supabase
                .storage
                .from(item.media_files.bucket)
                .createSignedUrl(item.media_files.file_path, 3600); // 1 hour expiry

            if (signedData) {
                item.media_files.signed_url = signedData.signedUrl;
            }
        } catch (e) {
            console.error("Error signing url for", item.media_files.file_name, e);
        }
        return item;
    }));

    return filesWithUrls;
}

// ============================================================================
// FOLDER QUERIES
// ============================================================================

/**
 * Get all folders for an organization, optionally filtered by project.
 * Includes file count per folder.
 */
export async function getFolders(organizationId: string, projectId?: string | null): Promise<Folder[]> {
    const supabase = await createClient();

    let query = supabase
        .from('media_file_folders')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

    if (projectId) {
        query = query.eq('project_id', projectId);
    } else {
        query = query.is('project_id', null);
    }

    const { data: folders, error } = await query;

    if (error) {
        console.error('Error fetching folders:', error);
        return [];
    }

    if (!folders || folders.length === 0) return [];

    // Get file counts per folder in a single query
    const folderIds = folders.map(f => f.id);
    const { data: counts } = await supabase
        .from('media_links')
        .select('folder_id')
        .eq('organization_id', organizationId)
        .in('folder_id', folderIds);

    const countMap: Record<string, number> = {};
    (counts || []).forEach((item: any) => {
        if (item.folder_id) {
            countMap[item.folder_id] = (countMap[item.folder_id] || 0) + 1;
        }
    });

    return folders.map(folder => ({
        ...folder,
        file_count: countMap[folder.id] || 0,
    }));
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
