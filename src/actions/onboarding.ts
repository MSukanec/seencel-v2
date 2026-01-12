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
    theme: z.enum(["light", "dark", "system"]).optional(), // New theme field
    timezone: z.string().optional(), // New timezone field
    countryCode: z.string().length(2).optional(), // 2 letter country code
});

export async function submitOnboarding(prevState: any, formData: FormData) {
    const validatedFields = onboardingSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        birthdate: formData.get("birthdate"),
        country: formData.get("country"),
        orgName: formData.get("orgName"),
        theme: formData.get("theme"),
        timezone: formData.get("timezone"),
        countryCode: formData.get("countryCode"),
    });

    if (!validatedFields.success) {
        return { error: "validation_error", details: validatedFields.error.flatten().fieldErrors };
    }

    const { firstName, lastName, birthdate, country, orgName, theme, timezone, countryCode } = validatedFields.data;
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
        return { error: "update_failed" };
    }

    // 2. Update/Upsert User Data (user_data table)
    // First get the internal user id from users table using auth_id
    const { data: internalUser } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (!internalUser) return { error: "user_not_found" };

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
        return { error: "update_failed" };
    }

    // 3. Update Organization Name
    const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", internalUser.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

    if (org) {
        await supabase
            .from("organizations")
            .update({ name: orgName })
            .eq("id", org.id);
    }

    // 4. Update Organization Default Currency (Based on Country)
    if (org && countryCode) {
        // Map of common countries to their currency codes
        const countryToCurrencyMap: Record<string, string> = {
            'AR': 'ARS', // Argentina -> Peso Argentino
            'CL': 'CLP', // Chile -> Peso Chileno
            'MX': 'MXN', // Mexico -> Peso Mexicano
            'CO': 'COP', // Colombia -> Peso Colombiano
            'PE': 'PEN', // Peru -> Sol
            'UY': 'UYU', // Uruguay -> Peso Uruguayo
            'US': 'USD', // USA -> US Dollar
            'ES': 'EUR', // Spain -> Euro
            'BR': 'BRL', // Brazil -> Real
        };

        const targetCurrencyCode = countryToCurrencyMap[countryCode.toUpperCase()];

        if (targetCurrencyCode) {
            // Find the currency ID in the database
            const { data: currencyData } = await supabase
                .from("currencies")
                .select("id")
                .eq("code", targetCurrencyCode)
                .single();

            if (currencyData) {
                // A. Add to Organization Currencies (if not exists)
                // We use upsert to handle potential duplicates safely
                // Note: The unique constraint is (organization_id, currency_id)
                await supabase
                    .from("organization_currencies")
                    .upsert({
                        organization_id: org.id,
                        currency_id: currencyData.id,
                        is_active: true,
                        is_default: true
                    }, { onConflict: "organization_id, currency_id" });

                // B. Update Organization Preferences (Source of Truth for Default)
                await supabase
                    .from("organization_preferences")
                    .update({ default_currency_id: currencyData.id })
                    .eq("organization_id", org.id);

                // C. Unset other defaults in organization_currencies list
                await supabase
                    .from("organization_currencies")
                    .update({ is_default: false })
                    .eq("organization_id", org.id)
                    .neq("currency_id", currencyData.id);
            }
        }
    }

    // 5. Update Preferences (Theme & Onboarding Completion)
    const { error: prefError } = await supabase
        .from("user_preferences")
        .update({
            onboarding_completed: true,
            theme: theme || 'system',
            timezone: timezone || 'UTC'
        })
        .eq("user_id", internalUser.id);

    if (prefError) {
        console.error("Error updating preferences:", prefError);
        return { error: "update_failed" };
    }

    revalidatePath("/", "layout");

    return { success: true };
}
