import { createClient } from "@/lib/supabase/server";

// Fetches media files associated with a project via media_links
export async function getProjectFiles(projectId: string) {
    const supabase = await createClient();



    const { data, error } = await supabase
        .from('media_links')
        .select(`
            *,
            media_files (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching project files:', error);
        return [];
    }



    // Generate signed URLs for private files
    const filesWithUrls = await Promise.all(data!.map(async (item: any) => {
        if (!item.media_files) return item;

        try {
            const { data: signedData, error: signedError } = await supabase
                .storage
                .from(item.media_files.bucket)
                .createSignedUrl(item.media_files.file_path, 3600); // 1 hour expiry

            if (signedData) {
                // Attach the signed URL to the media_file object
                item.media_files.signed_url = signedData.signedUrl;
            }
        } catch (e) {
            console.error("Error signing url for", item.media_files.file_name, e);
        }
        return item;
    }));

    return filesWithUrls;
}

