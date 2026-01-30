import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/features/emails/lib/send-email";
import { PurchaseConfirmationEmail } from "@/features/emails/templates/purchase-confirmation-email";
import { AdminSaleNotificationEmail } from "@/features/emails/templates/admin-sale-notification-email";

// Max emails to process per run (avoid timeout)
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;

interface EmailQueueItem {
    id: string;
    recipient_email: string;
    recipient_name: string | null;
    template_type: string;
    subject: string;
    data: Record<string, unknown>;
    attempts: number;
}

export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow if: has valid cron secret OR is dev environment
    const isValidCron = authHeader === `Bearer ${cronSecret}`;
    const isDev = process.env.NODE_ENV === "development";

    if (!isValidCron && !isDev) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase client inside function to avoid build-time errors
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // Fetch pending emails
        const { data: pendingEmails, error: fetchError } = await supabase
            .from("email_queue")
            .select("*")
            .eq("status", "pending")
            .lt("attempts", MAX_ATTEMPTS)
            .order("created_at", { ascending: true })
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error("Error fetching email queue:", fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!pendingEmails || pendingEmails.length === 0) {
            return NextResponse.json({ message: "No pending emails", processed: 0 });
        }

        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const email of pendingEmails as EmailQueueItem[]) {
            results.processed++;

            try {
                // Build the React email component based on template_type
                const emailComponent = buildEmailComponent(email);

                if (!emailComponent) {
                    throw new Error(`Unknown template type: ${email.template_type}`);
                }

                // Send email via Resend
                const result = await sendEmail({
                    to: email.recipient_email,
                    subject: email.subject,
                    react: emailComponent,
                });

                if (result.success) {
                    // Mark as sent
                    await supabase
                        .from("email_queue")
                        .update({
                            status: "sent",
                            sent_at: new Date().toISOString(),
                        })
                        .eq("id", email.id);

                    results.sent++;
                } else {
                    throw new Error(result.error || "Unknown send error");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                results.failed++;
                results.errors.push(`${email.id}: ${errorMessage}`);

                // Update attempts and last_error
                const newAttempts = email.attempts + 1;
                await supabase
                    .from("email_queue")
                    .update({
                        attempts: newAttempts,
                        last_error: errorMessage,
                        status: newAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
                    })
                    .eq("id", email.id);
            }
        }

        return NextResponse.json({
            message: "Email queue processed",
            ...results,
        });
    } catch (error) {
        console.error("Email queue processing error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

function buildEmailComponent(email: EmailQueueItem): React.ReactElement | null {
    const data = email.data;
    const purchaseDate = new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    switch (email.template_type) {
        case "purchase_confirmation": {
            // Extract billing cycle from product_name (e.g., "Pro (annual)" -> "annual")
            const productName = String(data.product_name || "");
            const billingCycle = productName.includes("annual") ? "annual" : "monthly";
            const planName = productName.replace(/\s*\((monthly|annual)\)/i, "");

            return (
                <PurchaseConfirmationEmail
                    firstName={String(data.user_name || "Usuario")}
                    planName={planName}
                    billingCycle={billingCycle as "monthly" | "annual"}
                    amount={String(data.amount || "0")}
                    currency={String(data.currency || "USD")}
                    paymentMethod="mercadopago"
                    transactionId={String(data.payment_id || "")}
                    purchaseDate={purchaseDate}
                />
            );
        }

        case "admin_sale_notification": {
            return (
                <AdminSaleNotificationEmail
                    buyerName={String(data.buyer_name || "Usuario")}
                    buyerEmail={String(data.buyer_email || "")}
                    productType={data.product_type as "subscription" | "course"}
                    productName={String(data.product_name || "")}
                    amount={String(data.amount || "0")}
                    currency={String(data.currency || "USD")}
                    paymentId={String(data.payment_id || "")}
                    purchaseDate={purchaseDate}
                />
            );
        }

        default:
            return null;
    }
}
