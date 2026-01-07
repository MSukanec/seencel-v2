'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateOrganization(orgId: string, formData: FormData) {
    const supabase = await createClient();

    // Core Organization Fields
    const name = formData.get("name") as string;

    // Organization Data Fields
    const description = formData.get("description") as string;
    const tax_id = formData.get("tax_id") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const website = formData.get("website") as string;

    // Address Fields
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const country = formData.get("country") as string;
    const postal_code = formData.get("postal_code") as string;

    // Coords
    const lat = formData.get("lat") as string;
    const lng = formData.get("lng") as string;

    try {
        // 1. Update Core Organization Table (only if name provided)
        if (name) {
            const { error: orgError } = await supabase
                .from('organizations')
                .update({ name: name })
                .eq('id', orgId);

            if (orgError) {
                console.error("Error updating organization:", orgError);
                return { error: `Organization Update Failed: ${orgError.message}` };
            }
        }

        // 2. Upsert Organization Data Table
        const dataUpdate: any = { organization_id: orgId };

        if (description !== null) dataUpdate.description = description;
        if (tax_id !== null) dataUpdate.tax_id = tax_id;
        if (email !== null) dataUpdate.email = email;
        if (phone !== null) dataUpdate.phone = phone;
        if (website !== null) dataUpdate.website = website;

        if (address !== null) dataUpdate.address = address;
        if (city !== null) dataUpdate.city = city;
        if (state !== null) dataUpdate.state = state;
        if (country !== null) dataUpdate.country = country;
        if (postal_code !== null) dataUpdate.postal_code = postal_code;

        if (lat) dataUpdate.lat = parseFloat(lat);
        if (lng) dataUpdate.lng = parseFloat(lng);

        // If dataUpdate only has organization_id, skip upsert
        if (Object.keys(dataUpdate).length > 1) {
            const { error: dataError } = await supabase
                .from('organization_data')
                .upsert(dataUpdate, {
                    onConflict: 'organization_id'
                });

            if (dataError) {
                console.error("Error updating organization data:", dataError);
                return { error: `Data Update Failed: ${dataError.message}` };
            }
        }

        revalidatePath('/organization');
        revalidatePath('/organization/details');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
