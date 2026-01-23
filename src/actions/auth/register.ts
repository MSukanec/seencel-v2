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
});

export async function registerUser(prevState: any, formData: FormData) {
    // Artificial delay to prevent timing attacks and slow down bots
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const validatedFields = registerSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        website_url: formData.get("website_url"),
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        if (errors.password) return { error: "weak_password" };
        if (errors.email) return { error: "invalid_email" };
        return { error: "validation_error" };
    }

    const { email, password, website_url } = validatedFields.data;

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

