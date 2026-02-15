"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const onboardingSchema = z.object({
    firstName: z.string().min(2, "Min 2 chars"),
    lastName: z.string().min(2, "Min 2 chars"),
    orgName: z.string().min(2, "Min 2 chars"),
    timezone: z.string().optional(),
});

/**
 * Onboarding unificado: nombre/apellido + creación de organización.
 * 
 * 1. Actualiza users.full_name + signup_completed
 * 2. Upsert user_data (first_name, last_name)
 * 3. Guarda timezone en user_preferences
 * 4. Crea la organización via handle_new_organization RPC
 */
export async function submitOnboarding(prevState: any, formData: FormData) {
    const validatedFields = onboardingSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        orgName: formData.get("orgName"),
        timezone: formData.get("timezone") || undefined,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const errorMessage = Object.entries(fieldErrors)
            .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
            .join("; ");
        console.error("Validation errors:", errorMessage);
        return { error: "validation_error", message: `Validation failed: ${errorMessage}`, details: fieldErrors };
    }

    const { firstName, lastName, orgName, timezone } = validatedFields.data;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "unauthorized" };
    }

    // 1. Get internal user id
    const { data: internalUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!internalUser) {
        console.error("Internal user not found for auth_id:", user.id);
        return { error: "user_not_found", message: "Internal user record not found" };
    }

    // 2. Update User Profile (full_name + signup_completed)
    const { error: userError } = await supabase
        .from("users")
        .update({
            full_name: `${firstName} ${lastName}`,
            signup_completed: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", internalUser.id);

    if (userError) {
        console.error("Error updating users:", userError);
        return { error: "update_failed", message: `Users update failed: ${userError.message}` };
    }

    // 3. Upsert User Data (first_name, last_name)
    const { error: userDataError } = await supabase
        .from("user_data")
        .upsert({
            user_id: internalUser.id,
            first_name: firstName,
            last_name: lastName,
        }, { onConflict: "user_id" });

    if (userDataError) {
        console.error("Error updating user_data:", userDataError);
        return { error: "update_failed", message: `User Data update failed: ${userDataError.message}` };
    }

    // 4. Save timezone in user preferences (if detected)
    if (timezone) {
        const { error: prefError } = await supabase
            .from("user_preferences")
            .update({ timezone })
            .eq("user_id", internalUser.id);

        if (prefError) {
            console.error("Error updating timezone:", prefError);
            // Non-critical, don't fail
        }
    }

    // 5. Create organization via RPC (handle_new_organization)
    // This creates org, roles, member, currencies, wallets, preferences
    // and sets it as the active organization in user_preferences
    const { data: newOrgId, error: rpcError } = await supabase.rpc('handle_new_organization', {
        p_user_id: internalUser.id,
        p_organization_name: orgName.trim(),
    });

    if (rpcError) {
        console.error("Error creating organization:", rpcError);
        return { error: "org_creation_failed", message: `Organization creation failed: ${rpcError.message}` };
    }

    if (!newOrgId) {
        return { error: "org_creation_failed", message: "No organization ID returned" };
    }

    // 6. Upsert Org-Specific Preferences (Last Access Timestamp)
    await supabase
        .from('user_organization_preferences')
        .upsert({
            user_id: internalUser.id,
            organization_id: newOrgId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, organization_id'
        });

    revalidatePath("/", "layout");

    return { success: true };
}
