"use server";

import { createClient } from "@/lib/supabase/server";
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
        const supabase = await createClient();

        const { error } = await supabase
            .from("media_links")
            .delete()
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
    folderId?: string | null,
    projectId?: string | null
) {
    try {
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
                    folder_id: folderId || null,
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
// FOLDER CRUD
// ============================================================================

/**
 * Create a new folder
 */
export async function createFolder(
    organizationId: string,
    name: string,
    parentId?: string | null,
    projectId?: string | null
) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("media_file_folders")
            .insert({
                organization_id: organizationId,
                name: name.trim(),
                parent_id: parentId || null,
                project_id: projectId || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating folder:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error creating folder:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

/**
 * Rename a folder
 */
export async function renameFolder(folderId: string, newName: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("media_file_folders")
            .update({ name: newName.trim() })
            .eq("id", folderId);

        if (error) {
            console.error("Error renaming folder:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error renaming folder:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

/**
 * Soft delete a folder. Files inside will have folder_id set to NULL via trigger.
 */
export async function deleteFolder(folderId: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("media_file_folders")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            })
            .eq("id", folderId);

        if (error) {
            console.error("Error deleting folder:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error deleting folder:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

// ============================================================================
// MOVE FILE TO FOLDER
// ============================================================================

/**
 * Move a file (media_link) to a folder, or remove from folder (folderId = null)
 */
export async function moveFileToFolder(mediaLinkId: string, folderId: string | null) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("media_links")
            .update({ folder_id: folderId })
            .eq("id", mediaLinkId);

        if (error) {
            console.error("Error moving file:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error moving file:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}

/**
 * Move multiple files to a folder at once
 */
export async function moveFilesToFolder(mediaLinkIds: string[], folderId: string | null) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from("media_links")
            .update({ folder_id: folderId })
            .in("id", mediaLinkIds);

        if (error) {
            console.error("Error moving files:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/organization/files", "page");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error moving files:", err);
        return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
    }
}
