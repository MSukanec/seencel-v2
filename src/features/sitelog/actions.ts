"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from "next/cache";

import { SiteLog, SiteLogType } from "./types";

// ── Helper: resolve member_id from auth user ──────────────────
async function resolveAuthMember(supabase: any, organizationId: string) {
    const user = await getAuthUser();
    if (!user) return null;

    const { data: userData } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
    if (!userData) return null;

    const { data: memberData } = await supabase
        .schema('iam').from('organization_members')
        .select('id')
        .eq('user_id', userData.id)
        .eq('organization_id', organizationId)
        .single();
    if (!memberData) return null;

    return { authId: user.id, userId: userData.id, memberId: memberData.id };
}

// ── SITE LOG SELECT FIELDS ────────────────────────────────────
const SITE_LOG_SELECT = `
    id, project_id, organization_id, log_date, comments,
    created_at, updated_at, is_public, status, is_favorite,
    weather, severity, entry_type_id, created_by, updated_by,
    ai_summary, ai_tags, ai_analyzed, is_deleted, deleted_at,
    entry_type:site_log_types(id, name, description, is_system)
`;

// --- SITE LOGS (ENTRIES) ---

export async function getSiteLogs(organizationId: string, projectId: string): Promise<SiteLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('construction').from('site_logs')
        .select(SITE_LOG_SELECT)
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching site logs:", error);
        return [];
    }

    return enrichSiteLogs(supabase, data);
}

/**
 * Get ALL site logs for the organization (org-wide view).
 * Includes project name for display in the unified list.
 */
export async function getSiteLogsForOrganization(organizationId: string): Promise<SiteLog[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('construction').from('site_logs')
        .select(SITE_LOG_SELECT)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching org site logs:", error);
        return [];
    }

    return enrichSiteLogs(supabase, data, { includeProjects: true });
}

/**
 * Enrich site logs with cross-schema data:
 * - Author info (iam.organization_members → iam.users)
 * - Project info (projects.projects) — only if includeProjects
 * - Media (public.media_links → public.media_files)
 */
async function enrichSiteLogs(
    supabase: any,
    data: any[],
    opts?: { includeProjects?: boolean }
): Promise<SiteLog[]> {
    if (!data.length) return [];

    // Collect unique IDs for batch lookups
    const logIds = data.map(l => l.id);
    const memberIds = [...new Set(data.map(l => l.created_by).filter(Boolean))];
    const projectIds = opts?.includeProjects
        ? [...new Set(data.map(l => l.project_id).filter(Boolean))]
        : [];

    // 2. Batch fetch authors (iam schema)
    const membersMap: Record<string, any> = {};
    if (memberIds.length) {
        const { data: members } = await supabase
            .schema('iam').from('organization_members')
            .select('id, user:users(full_name, email, avatar_url)')
            .in('id', memberIds);
        if (members) {
            for (const m of members) membersMap[m.id] = m;
        }
    }

    // 3. Batch fetch projects (projects schema)
    const projectsMap: Record<string, any> = {};
    if (projectIds.length) {
        const { data: projects } = await supabase
            .schema('projects').from('projects')
            .select('id, name, color, image_url')
            .in('id', projectIds);
        if (projects) {
            for (const p of projects) projectsMap[p.id] = p;
        }
    }

    // 4. Batch fetch media links + files (public schema)
    const mediaByLog: Record<string, any[]> = {};
    if (logIds.length) {
        const { data: links } = await supabase
            .from('media_links')
            .select(`
                site_log_id,
                media_file:media_files!inner(
                    id, is_public, file_type, file_name, bucket, file_path, is_deleted
                )
            `)
            .in('site_log_id', logIds)
            .eq('is_deleted', false)
            .eq('media_files.is_deleted', false);
        if (links) {
            for (const link of links) {
                if (!link.media_file) continue;
                if (!mediaByLog[link.site_log_id]) mediaByLog[link.site_log_id] = [];
                mediaByLog[link.site_log_id].push(link.media_file);
            }
        }
    }

    // 5. Assemble enriched logs + sign URLs
    const enriched = await Promise.all(data.map(async (log: any) => {
        // Sign media URLs
        const rawMedia = mediaByLog[log.id] || [];
        const mediaItems = await Promise.all(rawMedia.map(async (file: any) => {
            let finalUrl: string | null = null;
            if (file.bucket && file.file_path) {
                if (file.is_public) {
                    const { data } = supabase.storage.from(file.bucket).getPublicUrl(file.file_path);
                    finalUrl = data.publicUrl;
                } else {
                    try {
                        const { data: signedData } = await supabase.storage
                            .from(file.bucket)
                            .createSignedUrl(file.file_path, 3600);
                        if (signedData?.signedUrl) finalUrl = signedData.signedUrl;
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
            author: membersMap[log.created_by] || null,
            project: projectsMap[log.project_id] || null,
            media: mediaItems.filter((m: any) => m !== null)
        };
    }));

    return enriched as SiteLog[];
}

// --- SITE LOG TYPES ---

export async function getSiteLogTypes(organizationId: string): Promise<SiteLogType[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('construction').from('site_log_types')
        .select('id, name, description, is_system, organization_id, created_at, updated_at, is_deleted, deleted_at')
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

    const auth = await resolveAuthMember(supabase, organizationId);
    if (!auth) throw new Error("Authentication failed or not a member");

    const { data, error } = await supabase
        .schema('construction').from('site_log_types')
        .insert({
            organization_id: organizationId,
            name,
            description,
            is_system: false,
            created_by: auth.memberId,
            updated_by: auth.memberId
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

export async function updateSiteLogType(organizationId: string, id: string, name: string, description?: string) {
    const supabase = await createClient();

    const auth = await resolveAuthMember(supabase, organizationId);
    if (!auth) throw new Error("Authentication failed or not a member");

    const { error } = await supabase
        .schema('construction').from('site_log_types')
        .update({
            name,
            description,
            updated_by: auth.memberId
        })
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) {
        console.error("Error updating site log type:", error);
        throw new Error("Failed to update type");
    }

    revalidatePath(`/organization/sitelog`, 'page');
}

export async function deleteSiteLogType(organizationId: string, id: string, replacementId?: string) {
    const supabase = await createClient();

    const auth = await resolveAuthMember(supabase, organizationId);
    if (!auth) throw new Error("Authentication failed or not a member");

    // 1. Reassign logs to replacement type
    if (replacementId) {
        const { error: moveError } = await supabase
            .schema('construction').from('site_logs')
            .update({ entry_type_id: replacementId })
            .eq('entry_type_id', id);

        if (moveError) {
            console.error("Error migrating logs:", moveError);
        }
    }

    // 2. Soft Delete
    const { error } = await supabase
        .schema('construction').from('site_log_types')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: auth.memberId
        })
        .eq('id', id)
        .eq('organization_id', organizationId);

    if (error) {
        console.error("Error deleting site log type:", error);
        throw new Error("Failed to delete type");
    }

    revalidatePath(`/organization/sitelog`, 'page');
}

// --- CREATE / UPDATE SITE LOG ---

interface CreateSiteLogInput {
    id?: string;
    projectId: string;
    organizationId: string;
    comments: string;
    logDate: string;
    entryTypeId?: string | null;
    weather?: string | null;
    severity: string | null;
    isPublic: boolean;
    media?: Array<{
        id?: string;
        name: string;
        type: string;
        url?: string;
        path?: string;
        bucket?: string;
    }>;
}

export async function createSiteLog(input: CreateSiteLogInput) {
    const supabase = await createClient();

    const auth = await resolveAuthMember(supabase, input.organizationId);
    if (!auth) return { error: "No autorizado" };

    let currentLogId = input.id;

    if (input.id) {
        // UPDATE Existing Log
        const { error } = await supabase
            .schema('construction').from('site_logs')
            .update({
                comments: input.comments,
                log_date: input.logDate,
                entry_type_id: input.entryTypeId,
                weather: input.weather,
                severity: input.severity === "none" ? null : (input.severity || null),
                is_public: input.isPublic,
                updated_by: auth.memberId
            })
            .eq('id', input.id)
            .eq('organization_id', input.organizationId);

        if (error) {
            console.error("Update log error:", error);
            return { error: error.message };
        }
    } else {
        // CREATE New Log
        const { data: logData, error } = await supabase
            .schema('construction').from('site_logs')
            .insert({
                project_id: input.projectId,
                organization_id: input.organizationId,
                comments: input.comments,
                log_date: input.logDate,
                entry_type_id: input.entryTypeId,
                weather: input.weather,
                severity: input.severity === "none" ? null : (input.severity || null),
                is_public: input.isPublic,
                created_by: auth.memberId,
                updated_by: auth.memberId
            })
            .select('id')
            .single();

        if (error) {
            console.error("Create log error:", error);
            return { error: error.message };
        }
        currentLogId = logData.id;
    }

    if (!currentLogId) return { error: "Error de ID de registro" };

    // Process Media
    if (input.media && input.media.length > 0) {
        try {
            // 1. Identify valid media files to be linked
            const validMediaFileIds: string[] = [];

            for (const item of input.media) {
                let fileId = item.id;

                // Map MIME type to DB Enum
                let dbFileType = 'other';
                if (item.type && item.type.startsWith('image/')) dbFileType = 'image';
                else if (item.type && item.type.startsWith('video/')) dbFileType = 'video';
                else if (item.type === 'application/pdf') dbFileType = 'pdf';

                // Check if this file already exists in DB (by ID)
                if (fileId) {
                    const { data: existingFile } = await supabase
                        .from('media_files')
                        .select('id')
                        .eq('id', fileId)
                        .single();

                    if (existingFile) {
                        validMediaFileIds.push(existingFile.id);
                        continue;
                    }
                }

                // File does not exist, create it
                const { data: fileData, error: fileError } = await supabase
                    .from('media_files')
                    .insert({
                        organization_id: input.organizationId,
                        bucket: item.bucket || 'sitelogs',
                        file_path: item.path || item.url,
                        file_name: item.name,
                        file_type: dbFileType,
                        created_by: auth.memberId
                    })
                    .select('id')
                    .single();

                if (fileError) {
                    console.error("Error creating media file record:", fileError);
                    continue;
                }
                validMediaFileIds.push(fileData.id);
            }

            // 2. Sync Links — Soft delete old, Insert new
            // Soft delete existing links for this log
            await supabase
                .from('media_links')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('site_log_id', currentLogId);

            // Insert new links
            if (validMediaFileIds.length > 0) {
                const linksToInsert = validMediaFileIds.map(fileId => ({
                    site_log_id: currentLogId,
                    media_file_id: fileId,
                    organization_id: input.organizationId,
                    project_id: input.projectId
                }));

                const { error: linkError } = await supabase
                    .from('media_links')
                    .insert(linksToInsert);

                if (linkError) {
                    console.error("Error linking media:", linkError);
                }
            }
        } catch (e) {
            console.error("Error processing media:", e);
        }
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return { success: true };
}

export async function deleteSiteLog(organizationId: string, logId: string) {
    const supabase = await createClient();

    const auth = await resolveAuthMember(supabase, organizationId);
    if (!auth) return { error: "No autorizado" };

    // Soft Delete
    const { error } = await supabase
        .schema('construction').from('site_logs')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            updated_by: auth.memberId
        })
        .eq('id', logId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error("Error deleting log:", error);
        return { error: "Error al eliminar el registro" };
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return { success: true };
}

// --- INLINE UPDATE (single field) ---

type SiteLogUpdatableField = 'comments' | 'severity' | 'weather' | 'is_public' | 'is_favorite' | 'entry_type_id' | 'log_date';

export async function updateSiteLogField(
    organizationId: string,
    logId: string,
    field: SiteLogUpdatableField,
    value: string | boolean | null
) {
    const supabase = await createClient();
    const auth = await resolveAuthMember(supabase, organizationId);
    if (!auth) return { error: "No autorizado" };

    const { error } = await supabase
        .schema('construction').from('site_logs')
        .update({
            [field]: value,
            updated_by: auth.memberId,
        })
        .eq('id', logId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error(`Error updating site log field ${field}:`, error);
        return { error: error.message };
    }

    revalidatePath(`/organization/sitelog`, 'page');
    return { success: true };
}
