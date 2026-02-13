"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Helper: map MIME type to DB-allowed file_type
function getDbFileType(mimeType: string): "image" | "video" | "pdf" | "doc" | "other" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "pdf";
    if (
        mimeType.includes("word") ||
        mimeType.includes("document") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("presentation")
    ) return "doc";
    return "other";
}

export interface ContactFile {
    id: string; // media_link id
    media_file_id: string;
    url: string;
    name: string;
    type: string; // 'image' | 'video' | 'pdf' | 'doc' | 'other'
    size: number;
    path: string;
    bucket: string;
    created_at: string;
}

/**
 * Fetch all files linked to a contact via media_links + media_files.
 */
export async function getContactFiles(
    contactId: string,
    organizationId: string
): Promise<ContactFile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("media_links")
        .select(`
            id,
            media_file_id,
            created_at,
            media_files!inner (
                id,
                bucket,
                file_path,
                file_name,
                file_type,
                file_size,
                is_public
            )
        `)
        .eq("contact_id", contactId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching contact files:", error);
        return [];
    }

    if (!data) return [];

    return data.map((link: any) => {
        const file = link.media_files;
        const bucket = file.bucket || "private-assets";
        const publicUrl = file.is_public
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${file.file_path}`
            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${file.file_path}`;

        return {
            id: link.id,
            media_file_id: file.id,
            url: publicUrl,
            name: file.file_name || "Archivo",
            type: file.file_type,
            size: file.file_size || 0,
            path: file.file_path,
            bucket,
            created_at: link.created_at,
        };
    });
}

/**
 * Link an uploaded file to a contact.
 * Inserts into media_files + media_links with contact_id.
 */
export async function linkContactFile(
    contactId: string,
    organizationId: string,
    fileData: {
        path: string;
        name: string;
        type: string; // raw MIME type
        size: number;
        bucket: string;
    }
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const dbType = getDbFileType(fileData.type);

    // 1. Insert media_files record
    const { data: mediaFile, error: fileError } = await supabase
        .from("media_files")
        .insert({
            organization_id: organizationId,
            bucket: fileData.bucket,
            file_path: fileData.path,
            file_name: fileData.name,
            file_type: dbType,
            file_size: fileData.size,
            created_by: user.id,
            is_public: false,
        })
        .select()
        .single();

    if (fileError || !mediaFile) {
        console.error("Error creating media file:", fileError);
        throw new Error("Error al registrar el archivo.");
    }

    // 2. Insert media_links record with contact_id
    const { error: linkError } = await supabase
        .from("media_links")
        .insert({
            media_file_id: mediaFile.id,
            contact_id: contactId,
            organization_id: organizationId,
            created_by: user.id,
            category: "document",
            visibility: "private",
        });

    if (linkError) {
        console.error("Error linking file to contact:", linkError);
        throw new Error("Error al vincular el archivo al contacto.");
    }

    revalidatePath("/organization/contacts");
    return { success: true, mediaFileId: mediaFile.id };
}

/**
 * Unlink a file from a contact (removes media_link, keeps the file in storage).
 */
export async function unlinkContactFile(mediaLinkId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("media_links")
        .delete()
        .eq("id", mediaLinkId);

    if (error) {
        console.error("Error unlinking file:", error);
        throw new Error("Error al eliminar el archivo.");
    }

    revalidatePath("/organization/contacts");
    return { success: true };
}
