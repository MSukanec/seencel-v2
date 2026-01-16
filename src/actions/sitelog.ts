"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { SiteLog, SiteLogType } from "@/types/sitelog";

// --- SITE LOGS (ENTRIES) ---

export async function getSiteLogs(projectId: string): Promise<SiteLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_logs')
        .select(`
            *,
            entry_type:site_log_types(*),
            author:created_by(
                id,
                user:users(full_name, email, avatar_url)
            ),
            media_links(
                media_file:media_files(
                    id,
                    file_url,
                    file_type,
                    file_name,
                    bucket,
                    file_path
                )
            )
        `)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching site logs:", error);
        return [];
    }

    // Transform logic to flatten media_links -> media AND Sign URLs
    const formattedData = await Promise.all(data.map(async (log: any) => {
        const mediaItems = await Promise.all((log.media_links || []).map(async (link: any) => {
            const file = link.media_file;
            if (!file) return null;

            let finalUrl = file.file_url;

            // If it's a private bucket or missing URL, try to sign it
            // common private buckets: 'private-assets', 'secure-files', etc.
            // checking 'private' in name or just if bucket exists
            if (file.bucket && file.file_path) {
                // We prefer signing for consistency if it's in a bucket
                // especially private-assets
                try {
                    // 1 hour expiry
                    const { data: signedData } = await supabase.storage
                        .from(file.bucket)
                        .createSignedUrl(file.file_path, 3600);

                    if (signedData?.signedUrl) {
                        finalUrl = signedData.signedUrl;
                    }
                } catch (e) {
                    console.error("Failed to sign url for", file.id, e);
                }
            }

            if (!finalUrl) return null;

            return {
                id: file.id,
                url: finalUrl,
                type: file.file_type,
                name: file.file_name
            };
        }));

        return {
            ...log,
            media: mediaItems.filter((m: any) => m !== null)
        };
    }));

    return formattedData as SiteLog[];
}

// --- SITE LOG TYPES ---

export async function getSiteLogTypes(organizationId: string): Promise<SiteLogType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('site_log_types')
        .select('*')
        .or(`organization_id.eq.${organizationId},organization_id.is.null`)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error("Error fetching site log types:", error);
        return [];
    }

    return data as SiteLogType[];
}

export async function createSiteLogType(organizationId: string, name: string, description?: string) {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Authentication failed");
    }

    // 2. Get Public User/Member data
    const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
    if (!userData) throw new Error("User profile not found");

    const { data: memberData } = await supabase.from('organization_members')
        .select('id').eq('user_id', userData.id).eq('organization_id', organizationId).single();
    if (!memberData) throw new Error("Not a member");

    const { data, error } = await supabase
        .from('site_log_types')
        .insert({
            organization_id: organizationId,
            name,
            description,
            is_system: false, // Start as custom type
            created_by: memberData.id,
            updated_by: memberData.id
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating site log type:", error);
        throw new Error("Failed to create type");
    }

    revalidatePath(`/project/[projectId]/sitelog`, 'page');
    return data;
}

export async function updateSiteLogType(id: string, name: string, description?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('site_log_types')
        .update({
            name,
            description,
            updated_by: (await supabase.auth.getUser()).data.user?.id // This will trigger trigger to map to member
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating site log type:", error);
        throw new Error("Failed to update type");
    }

    revalidatePath(`/project/[projectId]/sitelog`, 'page');
}

export async function deleteSiteLogType(id: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. Reassign (if we had site_logs table, we would update them here)
    if (replacementId) {
        const { error: moveError } = await supabase
            .from('site_logs')
            .update({ entry_type_id: replacementId })
            .eq('entry_type_id', id);

        if (moveError) {
            console.error("Error migrating logs:", moveError);
        }
    }

    // 2. Soft Delete
    const { error } = await supabase
        .from('site_log_types')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

    if (error) {
        console.error("Error deleting site log type:", error);
        throw new Error("Failed to delete type");
    }

    revalidatePath(`/project/[projectId]/sitelog`, 'page');
}

// --- CREATE ACTION ---

export async function createSiteLog(formData: FormData) {
    const supabase = await createClient();

    const projectId = formData.get('project_id') as string;
    const organizationId = formData.get('organization_id') as string;
    const comments = formData.get('comments') as string;
    const logDate = formData.get('log_date') as string;
    const entryTypeId = formData.get('entry_type_id') as string | null;
    const weather = formData.get('weather') as string | null;
    const severity = formData.get('severity') as string;
    const isPublic = formData.get('is_public') === 'true';

    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { data: logData, error } = await supabase
        .from('site_logs')
        .insert({
            project_id: projectId,
            organization_id: organizationId,
            comments: comments,
            log_date: logDate, // Timestamptz or date string
            entry_type_id: entryTypeId,
            weather: weather,
            severity: severity,
            is_public: isPublic,
            created_by: user.id,
            updated_by: user.id
        })
        .select()
        .single();

    if (error) {
        console.error("Create log error:", error);
        return { error: error.message };
    }

    // Process Media
    const mediaJson = formData.get('media') as string | null;
    if (mediaJson) {
        try {
            const mediaItems = JSON.parse(mediaJson);
            if (Array.isArray(mediaItems)) {
                for (const item of mediaItems) {
                    // 1. Create Media File Record
                    const { data: fileData, error: fileError } = await supabase
                        .from('media_files')
                        .insert({
                            bucket: item.bucket,
                            file_path: item.path,
                            file_name: item.name,
                            file_type: item.type,
                            file_url: item.url,
                            created_by: user.id
                        })
                        .select()
                        .single();

                    if (fileError) {
                        console.error("Error creating media file record:", fileError);
                        continue;
                    }

                    // 2. Link to Site Log
                    const { error: linkError } = await supabase
                        .from('media_links')
                        .insert({
                            site_log_id: logData.id, // Ensure column name is correct (log_id vs site_log_id)
                            media_file_id: fileData.id
                        });

                    if (linkError) {
                        // Try fallback column name just in case, typically it's site_log_id based on table name but check schema if possible
                        // Based on 'media_links' usually linking 'site_log_id' and 'media_file_id'
                        console.error("Error linking media:", linkError);
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing media JSON:", e);
        }
    }

    revalidatePath(`/project/${projectId}/sitelog`);
    return { success: true };
}
