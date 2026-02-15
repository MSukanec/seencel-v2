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
        const fileName = `logo-${Date.now()}.${extension}`;
        const filePath = `organizations/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(filePath, optimizedBuffer, {
                contentType: mimeType,
                upsert: true,
            });

        if (uploadError) throw uploadError;

        // 4. Build full public URL and save directly to DB
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/${filePath}`;

        const { error: updateError } = await supabase
            .from('organizations')
            .update({ logo_url: publicUrl })
            .eq('id', organizationId);

        if (updateError) throw updateError;

        // 5. Return Success
        revalidatePath('/organization/settings');
        revalidatePath('/hub');
        revalidatePath('/', 'layout');
        return { success: true, logoUrl: publicUrl };

    } catch (error: any) {
        console.error("Upload Logo Error:", error);
        return { error: error.message };
    }
}

