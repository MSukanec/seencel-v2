import { createClient } from "@/lib/supabase/server";

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
