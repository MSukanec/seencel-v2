"use server";

import { Resend } from "resend";
import { z } from "zod";

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

// Generate HTML email template
function getEmailHtml(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    subject: string;
    message: string;
}) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; padding: 20px; color: #333;">
    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">
        Nuevo Mensaje de Contacto
    </h1>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>De:</strong> ${data.firstName} ${data.lastName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p style="margin: 5px 0;"><strong>Teléfono:</strong> ${data.phone}</p>` : ''}
        <p style="margin: 5px 0;"><strong>País:</strong> ${data.country}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold;">Asunto: ${data.subject}</h2>
    </div>
    
    <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fff;">
        <h3 style="margin-top: 0; font-size: 16px;">Mensaje:</h3>
        <p style="white-space: pre-wrap; line-height: 1.5;">${data.message}</p>
    </div>
    
    <p style="font-size: 12px; color: #666; margin-top: 30px;">
        Este email fue enviado desde el formulario de contacto de Seencel.
    </p>
</body>
</html>
    `.trim();
}

export async function sendContactEmail(formData: z.infer<typeof formSchema>): Promise<ContactFormState> {
    // Check for API key
    if (!process.env.RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not configured");
        return { success: false, message: "Error de configuración del servidor." };
    }

    // 1. Validate Fields
    const validatedFields = formSchema.safeParse(formData);

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            message: "Error de validación",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;

    // 2. Honeypot Check
    if (data._gotcha) {
        return { success: true }; // Silent success
    }

    // 3. Send Email - Using verified domain seencel.com
    const toEmail = "contacto@seencel.com";

    console.log("=== CONTACT EMAIL ===");
    console.log("To:", toEmail);
    console.log("From:", data.firstName, data.lastName, "-", data.email);
    console.log("Subject:", data.subject);

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: "Seencel Contacto <noreply@seencel.com>",
            to: [toEmail],
            replyTo: data.email,
            subject: `[Contacto Web] ${data.subject}`,
            html: getEmailHtml({
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
            console.error("Resend API Error:", JSON.stringify(error, null, 2));
            return { success: false, message: `Error de Resend: ${error.message || 'Error desconocido'}` };
        }

        console.log("Email sent successfully! ID:", emailData?.id);
        return { success: true, message: "Email enviado correctamente." };

    } catch (err: unknown) {
        const error = err as Error;
        console.error("=== SEND EMAIL EXCEPTION ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return { success: false, message: `Error: ${error.message}` };
    }
}

