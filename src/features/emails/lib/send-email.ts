import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    from?: string;
}

export async function sendEmail({ to, subject, react, from }: SendEmailOptions): Promise<{
    success: boolean;
    error?: string;
    id?: string;
}> {
    try {
        const { data, error } = await resend.emails.send({
            from: from || "Seencel <noreply@seencel.com>",
            to: Array.isArray(to) ? to : [to],
            subject,
            react,
        });

        if (error) {
            console.error("Resend Error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error("Email Send Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
