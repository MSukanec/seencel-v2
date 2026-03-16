"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ============================================================================
// DELETE FILE (media_link)
// ============================================================================

/**
 * Deletes a media_link record. 
 * The DB trigger `trigger_cleanup_media_file_hard_delete` on media_files
 * handles storage cleanup if no other links reference the same file.
 */
export async function deleteFile(mediaLinkId: string) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "No autorizado" };

        const supabase = await createClient();

        const { error } = await supabase
            .from("media_links")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            })
            .eq("id", mediaLinkId);

        if (error) {
            console.error("Error deleting media_link:", error);
            return { success: false, error: error.message };
        }

        // Revalidate the files page so server data refreshes
        revalidatePath("/organization/files", "page");

        return { success: true };
    } catch (err) {
        console.error("Unexpected error deleting file:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Error desconocido",
        };
    }
}

// ============================================================================
// UPLOAD FILES (manual upload from gallery)
// ============================================================================

interface UploadFileData {
    bucket: string;
    path: string;
    name: string;
    type: string; // raw MIME type
    size: number;
}

/**
 * Maps raw MIME type to DB-allowed file_type value.
 */
function mapMimeToFileType(mime: string): string {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "pdf";
    if (
        mime === "application/msword" ||
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mime === "application/vnd.ms-excel" ||
        mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) return "doc";
    return "other";
}

/**
 * Creates media_files + media_links records for files already uploaded to Storage.
 * Used by the manual upload form in the files gallery.
 */
export async function uploadFiles(
    organizationId: string,
    files: UploadFileData[],
    projectId?: string | null
) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "No autorizado" };

        const supabase = await createClient();

        const results: { success: boolean; fileName: string; error?: string }[] = [];

        for (const file of files) {
            // 1. Create media_file record
            const { data: mediaFile, error: fileError } = await supabase
                .from("media_files")
                .insert({
                    organization_id: organizationId,
                    bucket: file.bucket,
                    file_path: file.path,
                    file_name: file.name,
                    file_type: mapMimeToFileType(file.type),
                    file_size: file.size,
                    is_public: false,
                })
                .select()
                .single();

            if (fileError || !mediaFile) {
                console.error("Error creating media_file:", fileError);
                results.push({ success: false, fileName: file.name, error: fileError?.message });
                continue;
            }

            // 2. Create media_link (no module FK — general file)
            const { error: linkError } = await supabase
                .from("media_links")
                .insert({
                    media_file_id: mediaFile.id,
                    organization_id: organizationId,
                    project_id: projectId || null,
                    category: "general",
                    visibility: "private",
                });

            if (linkError) {
                console.error("Error creating media_link:", linkError);
                results.push({ success: false, fileName: file.name, error: linkError.message });
                continue;
            }

            results.push({ success: true, fileName: file.name });
        }

        revalidatePath("/organization/files", "page");

        const allSuccess = results.every((r) => r.success);
        return {
            success: allSuccess,
            results,
            error: allSuccess ? undefined : "Algunos archivos no se pudieron registrar",
        };
    } catch (err) {
        console.error("Unexpected error uploading files:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Error desconocido",
        };
    }
}


// ============================================================================
// SAVED VIEWS CRUD
// ============================================================================

interface CreateSavedViewInput {
    organizationId: string;
    name: string;
    entityType: string;
    viewMode?: string | null;
    filters?: Record<string, unknown>;
}

/**
 * Create a new saved view
 */
export async function createSavedView(input: CreateSavedViewInput) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "No autorizado" };

        const supabase = await createClient();

        // Get next position
        const { count } = await supabase
            .from("saved_views")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", input.organizationId)
            .eq("entity_type", input.entityType)
            .eq("is_deleted", false);

        const { data, error } = await supabase
            .from("saved_views")
            .insert({
                organization_id: input.organizationId,
                name: input.name.trim(),
                entity_type: input.entityType,
                view_mode: input.viewMode || null,
                filters: input.filters || {},
                position: (count || 0),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating saved view:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error creating saved view:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

/**
 * Update a saved view (name, filters, view_mode)
 */
export async function updateSavedView(
    viewId: string,
    updates: { name?: string; filters?: Record<string, unknown>; viewMode?: string | null }
) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "No autorizado" };

        const supabase = await createClient();

        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name.trim();
        if (updates.filters !== undefined) updateData.filters = updates.filters;
        if (updates.viewMode !== undefined) updateData.view_mode = updates.viewMode;

        const { error } = await supabase
            .from("saved_views")
            .update(updateData)
            .eq("id", viewId);

        if (error) {
            console.error("Error updating saved view:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error updating saved view:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

/**
 * Soft delete a saved view
 */
export async function deleteSavedView(viewId: string) {
    try {
        const user = await getAuthUser();
        if (!user) return { success: false, error: "No autorizado" };

        const supabase = await createClient();

        const { error } = await supabase
            .from("saved_views")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            })
            .eq("id", viewId);

        if (error) {
            console.error("Error deleting saved view:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error deleting saved view:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}
