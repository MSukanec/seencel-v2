"use server";

import { Resend } from "resend";
import { z } from "zod";
import { ContactEmailTemplate } from "../components/contact-email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

const formSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    country: z.string().min(1),
    subject: z.string().min(5),
    message: z.string().min(10).max(1000),
    _gotcha: z.string().optional(),
});

export type ContactFormState = {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
};

export async function sendContactEmail(formData: z.infer<typeof formSchema>): Promise<ContactFormState> {
    // 1. Validate Fields
    const validatedFields = formSchema.safeParse(formData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Error de validación",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    // 2. Honeypot Check (Redundant backing for Client check)
    if (data._gotcha) {
        return { success: true }; // Silent success
    }

    // 3. Send Email
    try {
        const { error } = await resend.emails.send({
            from: "Seencel Contact <onboarding@resend.dev>", // TODO: Update to noreply@seencel.com after domain verification
            to: ["contacto@seencel.com"], // Your verified email
            subject: `[Seencel Contacto] ${data.subject}`,
            react: ContactEmailTemplate({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || "",
                country: data.country,
                subject: data.subject,
                message: data.message,
            }),
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, message: "Error al enviar el email. Inténtalo más tarde." };
        }

        return { success: true, message: "Email enviado correctamente." };

    } catch (error) {
        console.error("Server Error:", error);
        return { success: false, message: "Error interno del servidor." };
    }
}
