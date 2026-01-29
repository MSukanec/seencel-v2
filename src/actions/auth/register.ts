"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { headers } from "next/headers";

const registerSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
    website_url: z.string().optional(), // Honeypot field
    // UTM acquisition fields (optional)
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    landing_page: z.string().optional(),
    referrer: z.string().optional(),
});

export async function registerUser(prevState: any, formData: FormData) {
    // Artificial delay to prevent timing attacks and slow down bots
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if registration is blocked
    const supabaseCheck = await createClient();
    const { data: regFlag } = await supabaseCheck
        .from('feature_flags')
        .select('status')
        .eq('key', 'auth_registration_enabled')
        .single();

    // If flag doesn't exist or status is not 'active', block registration
    if (!regFlag || regFlag.status !== 'active') {
        return { error: 'registration_blocked' };
    }

    const validatedFields = registerSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        website_url: formData.get("website_url"),
        // UTM params
        utm_source: formData.get("utm_source") || undefined,
        utm_medium: formData.get("utm_medium") || undefined,
        utm_campaign: formData.get("utm_campaign") || undefined,
        utm_content: formData.get("utm_content") || undefined,
        landing_page: formData.get("landing_page") || undefined,
        referrer: formData.get("referrer") || undefined,
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        if (errors.password) return { error: "weak_password" };
        if (errors.email) return { error: "invalid_email" };
        return { error: "validation_error" };
    }

    const {
        email,
        password,
        website_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        landing_page,
        referrer,
    } = validatedFields.data;

    // Honeypot check: If this field is filled, it's a bot.
    if (website_url) {
        // Return success to confuse the bot, but do nothing.
        return { success: true };
    }

    // Domain blacklisting (simple example)
    if (email.endsWith("@example.com")) {
        return { error: "invalid_domain" };
    }

    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            // Pass UTM acquisition data to be stored in raw_user_meta_data
            data: {
                utm_source: utm_source || null,
                utm_medium: utm_medium || null,
                utm_campaign: utm_campaign || null,
                utm_content: utm_content || null,
                landing_page: landing_page || null,
                referrer: referrer || null,
            },
        },
    });

    if (error) {
        console.error("Signup error:", error);
        if (error.code === "weak_password") return { error: "weak_password" };
        if (error.message.includes("already registered")) return { error: "email_taken" };
        return { error: "generic_error" };
    }

    return { success: true };
}

