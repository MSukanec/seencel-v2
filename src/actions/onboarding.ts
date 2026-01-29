"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const onboardingSchema = z.object({
    firstName: z.string().min(2, "Min 2 chars"),
    lastName: z.string().min(2, "Min 2 chars"),
    birthdate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
    country: z.string().uuid("Invalid country").optional(),
    orgName: z.string().min(1, "Organization name is required"), // Strict min 1 char
    countryCode: z.string().length(2).optional(), // 2 letter country code
    baseCurrency: z.string().min(3).max(3).optional(), // Currency code (e.g., ARS, USD)
    timezone: z.string().optional(), // IANA timezone (e.g., America/Argentina/Buenos_Aires)
    taxLabel: z.string().optional(), // Tax label (IVA, VAT, Sales Tax, etc.)
});

export async function submitOnboarding(prevState: any, formData: FormData) {
    const validatedFields = onboardingSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthdate: formData.get("birthdate") || undefined, // Convert null/empty to undefined
        country: formData.get("country") || undefined,
        orgName: formData.get("orgName"),
        countryCode: formData.get("countryCode") || undefined,
        baseCurrency: formData.get("baseCurrency") || undefined,
        timezone: formData.get("timezone") || undefined,
        taxLabel: formData.get("taxLabel") || undefined,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const errorMessage = Object.entries(fieldErrors)
            .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
            .join("; ");
        console.error("Validation errors:", errorMessage);
        return { error: "validation_error", message: `Validation failed: ${errorMessage}`, details: fieldErrors };
    }

    const { firstName, lastName, birthdate, country, orgName, baseCurrency, timezone, taxLabel } = validatedFields.data;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "unauthorized" };
    }

    // 1. Update User Profile (users table)
    const { error: userError } = await supabase
        .from("users")
        .update({
            full_name: `${firstName} ${lastName}`,
        })
        .eq("auth_id", user.id);

    if (userError) {
        console.error("Error updating users:", userError);
        return { error: "update_failed", message: `Users update failed: ${userError.message}` };
    }

    // 2. Update/Upsert User Data (user_data table)
    // First get the internal user id from users table using auth_id
    const { data: internalUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!internalUser) {
        console.error("Internal user not found for auth_id:", user.id);
        return { error: "user_not_found", message: "Internal user record not found" };
    }

    const { error: userDataError } = await supabase
        .from("user_data")
        .upsert({
            user_id: internalUser.id,
            first_name: firstName,
            last_name: lastName,
            ...(birthdate && { birthdate }), // Only include if present
            ...(country && { country }),     // Only include if present
        }, { onConflict: "user_id" });

    if (userDataError) {
        console.error("Error updating user_data:", userDataError);
        return { error: "update_failed", message: `User Data update failed: ${userDataError.message}` };
    }

    // 3. Update Organization Name
    const { data: org, error: orgFetchError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", internalUser.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    if (orgFetchError) {
        console.error("Error fetching organization:", orgFetchError);
        // Don't fail hard here yet, but log it.
    }

    if (org) {
        const { error: orgUpdateError } = await supabase
            .from("organizations")
            .update({ name: orgName })
            .eq("id", org.id);

        if (orgUpdateError) {
            console.error("Error updating organization:", orgUpdateError);
            return { error: "update_failed", message: `Org update failed: ${orgUpdateError.message}` };
        }
    } else {
        console.warn("No organization found for user:", internalUser.id);
    }

    // 4. Update Organization Default Currency (Based on User Selection)
    if (org && baseCurrency) {
        console.log("Setting currency:", baseCurrency);
        // Find the currency ID in the database by code
        const { data: currencyData, error: currencyFetchError } = await supabase
            .from("currencies")
            .select("id")
            .eq("code", baseCurrency)
            .single();

        if (currencyFetchError) {
            console.error("Error fetching currency:", currencyFetchError);
            return { error: "update_failed", message: `Currency fetch failed: ${currencyFetchError.message}` };
        }

        if (currencyData) {
            // A. Add to Organization Currencies (if not exists)
            // We use upsert to handle potential duplicates safely
            // Note: The unique constraint is (organization_id, currency_id)
            const { error: orgCurrError } = await supabase
                .from("organization_currencies")
                .upsert({
                    organization_id: org.id,
                    currency_id: currencyData.id,
                    is_active: true,
                    is_default: true
                }, { onConflict: "organization_id, currency_id" });

            if (orgCurrError) {
                console.error("Error upserting org currency:", orgCurrError);
                return { error: "update_failed", message: `Org Currency upsert failed: ${orgCurrError.message}` };
            }

            // B. Update Organization Preferences (Source of Truth for Default)
            // Also find and set the tax_label based on country
            let taxLabelId: string | null = null;
            if (validatedFields.data.countryCode) {
                const { data: taxLabelData } = await supabase
                    .from("tax_labels")
                    .select("id")
                    .contains("country_codes", [validatedFields.data.countryCode.toUpperCase()])
                    .single();

                if (taxLabelData) {
                    taxLabelId = taxLabelData.id;
                } else {
                    // Fallback to generic TAX label
                    const { data: fallbackLabel } = await supabase
                        .from("tax_labels")
                        .select("id")
                        .eq("code", "TAX")
                        .single();
                    taxLabelId = fallbackLabel?.id || null;
                }
            }

            const { error: prefUpdateError } = await supabase
                .from("organization_preferences")
                .update({
                    default_currency_id: currencyData.id,
                    ...(taxLabelId && { default_tax_label_id: taxLabelId })
                })
                .eq("organization_id", org.id);

            if (prefUpdateError) {
                console.error("Error updating org preferences:", prefUpdateError);
                return { error: "update_failed", message: `Org Prefs update failed: ${prefUpdateError.message}` };
            }

            // C. Unset other defaults in organization_currencies list
            const { error: unsetError } = await supabase
                .from("organization_currencies")
                .update({ is_default: false })
                .eq("organization_id", org.id)
                .neq("currency_id", currencyData.id);

            if (unsetError) {
                console.error("Error unsetting defaults:", unsetError);
                // Warning only
            }
        }
    }

    // 5. Update Preferences (Onboarding Completion + Timezone)
    const { error: prefError } = await supabase
        .from("user_preferences")
        .update({
            onboarding_completed: true,
            ...(timezone && { timezone }), // Save detected timezone
        })
        .eq("user_id", internalUser.id);

    if (prefError) {
        console.error("Error updating preferences:", prefError);
        return { error: "update_failed", message: `User Prefs update failed: ${prefError.message}` };
    }

    revalidatePath("/", "layout");

    return { success: true };
}

