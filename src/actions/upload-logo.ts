"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { optimizeImage } from "@/lib/image-optimizer";

export async function uploadOrganizationLogo(formData: FormData) {
    const supabase = await createClient();

    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;

    if (!file || !organizationId) {
        return { error: "Missing file or organization ID" };
    }

    try {
        // 1. Authenticate
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // 2. Optimize Image
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { buffer: optimizedBuffer, mimeType, extension } = await optimizeImage(buffer, {
            maxWidth: 500, // Logo doesn't need to be huge
            quality: 85,
            format: 'webp'
        });

        // 3. Upload to 'public-assets' bucket
        // Path format: 'organizations/org-uuid-timestamp.webp'
        // Note: The bucket is 'public-assets'.
        // Inside it, we want 'organizations/' folder usually.
        // But some implementations might put 'organizations/' in the path.
        // Based on SettingsPage logic: `organizations/${org.logo_path}` implies logo_path is just the filename usually?
        // Wait, line 216 queries.ts: `logo_path`. 
        // Line 168 SettingsPage: `logoPath.startsWith('organizations/') ? ...`
        // So let's store it as 'organizations/filename.webp' in the bucket, and save 'organizations/filename.webp' to DB.

        const fileName = `logo-${Date.now()}.${extension}`;
        const filePath = `organizations/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, optimizedBuffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // 4. Update Organization Record with logo_path
        // We store the path relative to the bucket? Or just the filename?
        // Looking at SettingsPage again: `const logoPath = org.logo_path ? (org.logo_path.startsWith('organizations/') ? ...`
        // It seems flexible. Let's store the full path inside the bucket: 'organizations/filename.webp'

        const { error: updateError } = await supabase
            .from('organizations')
            .update({ logo_path: filePath }) // CHANGED: logo_url -> logo_path
            .eq('id', organizationId);

        if (updateError) throw updateError;

        // 5. Return Success
        // Use getStorageUrl logic to return the full URL for immediate UI update
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${filePath}`;

        revalidatePath('/organization/identity');
        return { success: true, logoUrl: publicUrl };

    } catch (error: any) {
        console.error("Upload Logo Error:", error);
        return { error: error.message };
    }
}

