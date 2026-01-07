"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBillingProfile(formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    const isCompany = formData.get("is_company") === "true";
    const fullName = formData.get("full_name") as string || null;
    const companyName = formData.get("company_name") as string || null;
    const taxId = formData.get("tax_id") as string || null;
    const countryId = formData.get("country_id") as string || null;
    const addressLine1 = formData.get("address_line1") as string || null;
    const city = formData.get("city") as string || null;
    const postcode = formData.get("postcode") as string || null;

    const billingData = {
        user_id: userData.id,
        is_company: isCompany,
        full_name: fullName,
        company_name: companyName,
        tax_id: taxId,
        country_id: countryId || null,
        address_line1: addressLine1,
        city: city,
        postcode: postcode,
        updated_at: new Date().toISOString(),
    };

    // Check if billing profile exists
    const { data: existingProfile } = await supabase
        .from('billing_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .single();

    let result;
    if (existingProfile) {
        // Update existing
        result = await supabase
            .from('billing_profiles')
            .update(billingData)
            .eq('id', existingProfile.id);
    } else {
        // Insert new
        result = await supabase
            .from('billing_profiles')
            .insert(billingData);
    }

    if (result.error) {
        console.error("Error updating billing profile:", result.error);
        return { success: false, error: result.error.message };
    }

    revalidatePath('/[locale]/settings', 'page');
    return { success: true };
}
