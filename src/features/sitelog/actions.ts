"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { SiteLog, SiteLogType } from "./types";

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
                    is_public,
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

    return transformSiteLogs(supabase, data);
}

/**
 * Get ALL site logs for the organization (org-wide view).
 * Includes project name for display in the unified list.
 */
export async function getSiteLogsForOrganization(organizationId: string): Promise<SiteLog[]> {
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
            project:projects!project_id(id, name),
            media_links(
                media_file:media_files(
                    id,
                    is_public,
                    file_type,
                    file_name,
                    bucket,
                    file_path
                )
            )
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching org site logs:", error);
        return [];
    }

    return transformSiteLogs(supabase, data);
}

/**
 * Shared transform: flatten media_links → media AND sign URLs
 */
async function transformSiteLogs(supabase: any, data: any[]): Promise<SiteLog[]> {
    const formattedData = await Promise.all(data.map(async (log: any) => {
        const mediaItems = await Promise.all((log.media_links || []).map(async (link: any) => {
            const file = link.media_file;
            if (!file) return null;

            let finalUrl: string | null = null;

            // Generate URL based on privacy
            if (file.bucket && file.file_path) {
                if (file.is_public) {
                    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.file_path);
                    finalUrl = data.publicUrl;
                } else {
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
            }

            if (!finalUrl) return null;

            return {
                id: file.id,
                url: finalUrl,
                type: file.file_type,
                name: file.file_name,
                bucket: file.bucket,
                path: file.file_path
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
            is_system: false,
            created_by: memberData.id,
            updated_by: memberData.id
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating site log type:", error);
        throw new Error("Failed to create type");
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return data;
}

export async function updateSiteLogType(id: string, name: string, description?: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('site_log_types')
        .update({
            name,
            description,
            updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

    if (error) {
        console.error("Error updating site log type:", error);
        throw new Error("Failed to update type");
    }

    revalidatePath(`/organization/sitelog`, 'page');
}

export async function deleteSiteLogType(id: string, replacementId?: string) {
    const supabase = await createClient();

    // 1. Reassign
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

    revalidatePath(`/organization/sitelog`, 'page');
}

// --- CREATE / UPDATE SITE LOG ---

export async function createSiteLog(formData: FormData) {
    const supabase = await createClient();

    const id = formData.get('id') as string | null;
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

    let currentLogId = id;

    if (id) {
        // UPDATE Existing Log
        const { error } = await supabase
            .from('site_logs')
            .update({
                comments: comments,
                log_date: logDate,
                entry_type_id: entryTypeId,
                weather: weather,
                severity: severity,
                is_public: isPublic,
                updated_by: user.id
            })
            .eq('id', id);

        if (error) {
            console.error("Update log error:", error);
            return { error: error.message };
        }
    } else {
        // CREATE New Log
        const { data: logData, error } = await supabase
            .from('site_logs')
            .insert({
                project_id: projectId,
                organization_id: organizationId,
                comments: comments,
                log_date: logDate,
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
        currentLogId = logData.id;
    }

    if (!currentLogId) return { error: "Error de ID de registro" };

    // Process Media
    const mediaJson = formData.get('media') as string | null;
    if (mediaJson) {
        try {
            const mediaItems = JSON.parse(mediaJson);
            if (Array.isArray(mediaItems)) {

                // 1. Identify valid media files to be linked
                const validMediaFileIds: string[] = [];

                for (const item of mediaItems) {
                    let fileId = item.id;

                    // Map MIME type to DB Enum
                    let dbFileType = 'other';
                    if (item.type && item.type.startsWith('image/')) dbFileType = 'image';
                    else if (item.type && item.type.startsWith('video/')) dbFileType = 'video';
                    else if (item.type === 'application/pdf') dbFileType = 'pdf';

                    // Check if this file already exists in DB (by ID)
                    const { data: existingFile } = await supabase
                        .from('media_files')
                        .select('id')
                        .eq('id', fileId)
                        .single();

                    if (existingFile) {
                        validMediaFileIds.push(existingFile.id);
                    } else {
                        // File does not exist, create it
                        console.log("Creating new media_file", item.name);
                        const { data: fileData, error: fileError } = await supabase
                            .from('media_files')
                            .insert({
                                organization_id: organizationId,
                                bucket: item.bucket || 'sitelogs',
                                file_path: item.path || item.url,
                                file_name: item.name,
                                file_type: dbFileType,
                                created_by: user.id
                            })
                            .select()
                            .single();

                        if (fileError) {
                            console.error("Error creating media file record:", fileError);
                            continue;
                        }
                        validMediaFileIds.push(fileData.id);
                    }
                }

                // 2. Sync Links (Delete old, Insert new)

                // First delete existing links for this log
                await supabase
                    .from('media_links')
                    .delete()
                    .eq('site_log_id', currentLogId);

                // Then insert new links
                if (validMediaFileIds.length > 0) {
                    const linksToInsert = validMediaFileIds.map(fileId => ({
                        site_log_id: currentLogId,
                        media_file_id: fileId,
                        organization_id: organizationId,
                        project_id: projectId
                    }));

                    const { error: linkError } = await supabase
                        .from('media_links')
                        .insert(linksToInsert);

                    if (linkError) {
                        console.error("Error linking media:", linkError);
                    }
                }
            }
        } catch (e) {
            console.error("Error parsing media JSON:", e);
        }
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return { success: true };
}

export async function deleteSiteLog(logId: string, projectId: string) {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    // 2. Soft Delete
    const { error } = await supabase
        .from('site_logs')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: user.id
        })
        .eq('id', logId);

    if (error) {
        console.error("Error deleting log:", error);
        return { error: "Error al eliminar el registro" };
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return { success: true };
}
