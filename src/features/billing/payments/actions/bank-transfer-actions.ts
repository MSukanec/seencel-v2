"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreateBankTransferPaymentInput {
    // For course purchases
    courseId?: string;
    // For plan/subscription purchases  
    planId?: string;
    organizationId?: string;
    billingPeriod?: "monthly" | "annual";
    // For seat purchases
    seatsQuantity?: number;
    // Common fields
    amount: number;
    currency: string;
    payerName: string;
    payerNote?: string;
    receiptUrl: string;
    // Exchange rate at time of transfer (for ARS payments)
    exchangeRate?: number;
}

/**
 * Creates a bank transfer payment record AND activates the subscription/enrollment immediately.
 * Admin can later verify the receipt and revoke access if fraudulent.
 * This is an "optimistic" approach - trust first, verify later.
 */
export async function createBankTransferPayment(input: CreateBankTransferPaymentInput) {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "No autenticado" };
    }

    // Get internal user ID
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

    if (userError || !userData) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // Generate order ID (used as provider_payment_id for bank transfers)
    const orderId = crypto.randomUUID();

    // Insert bank transfer payment record
    const { data, error } = await supabase
        .from("bank_transfer_payments")
        .insert({
            order_id: orderId,
            user_id: userData.id,
            course_id: input.courseId || null,
            plan_id: input.planId || null,
            organization_id: input.organizationId || null,
            billing_period: input.billingPeriod || null,
            amount: input.amount,
            currency: input.currency,
            payer_name: input.payerName,
            payer_note: input.payerNote || null,
            receipt_url: input.receiptUrl,
            exchange_rate: input.exchangeRate || null,
            status: "pending", // Pending admin verification
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating bank transfer payment:", error);
        return { success: false, error: sanitizeError(error) };
    }

    // ============================================================
    // OPTIMISTIC ACTIVATION: Grant access immediately
    // NOTE: Payment record in `payments` table is NOT created here.
    //       It will be created when admin approves the transfer.
    // ============================================================

    try {
        if (input.courseId) {
            // Course purchase → only create enrollment (no payment record)
            const { error: enrollError } = await supabase.rpc(
                "step_course_enrollment_annual",
                {
                    p_user_id: userData.id,
                    p_course_id: input.courseId
                }
            );

            if (enrollError) {
                console.error("Error activating course enrollment:", enrollError);
                // Don't fail - payment is recorded, admin can fix enrollment
            }
        } else if (input.planId && input.organizationId) {
            // Plan/subscription purchase → create subscription without payment record
            // Step 1: Expire previous subscription
            await supabase.rpc("step_subscription_expire_previous", {
                p_organization_id: input.organizationId
            });

            // Step 2: Create active subscription (without linking to a payment yet)
            const { error: subError } = await supabase.rpc(
                "step_subscription_create_active",
                {
                    p_organization_id: input.organizationId,
                    p_plan_id: input.planId,
                    p_billing_period: input.billingPeriod || "annual",
                    p_payment_id: null, // No payment record yet
                    p_amount: input.amount,
                    p_currency: input.currency
                }
            );

            if (subError) {
                console.error("Error creating subscription:", subError);
            }

            // Step 3: Update organization's active plan
            await supabase.rpc("step_organization_set_plan", {
                p_organization_id: input.organizationId,
                p_plan_id: input.planId
            });

            // Step 4: Apply founders program if annual
            if (input.billingPeriod === "annual") {
                await supabase.rpc("step_apply_founders_program", {
                    p_user_id: userData.id,
                    p_organization_id: input.organizationId
                });
            }
        } else if (input.seatsQuantity && input.organizationId && !input.planId) {
            // Seat purchase → register additional seats
            // Get the current plan_id of the org
            const { data: orgData } = await supabase
                .from("organizations")
                .select("plan_id")
                .eq("id", input.organizationId)
                .single();

            if (orgData?.plan_id) {
                const { error: seatError } = await supabase.rpc('handle_member_seat_purchase', {
                    p_provider: 'bank_transfer',
                    p_provider_payment_id: orderId,
                    p_user_id: userData.id,
                    p_organization_id: input.organizationId,
                    p_plan_id: orgData.plan_id,
                    p_seats_purchased: input.seatsQuantity,
                    p_amount: input.amount,
                    p_currency: input.currency,
                    p_metadata: {
                        billing_period: input.billingPeriod || 'annual',
                        seats_count: input.seatsQuantity,
                        payment_method: 'bank_transfer'
                    }
                });

                if (seatError) {
                    console.error("Error purchasing seats:", seatError);
                }
            } else {
                console.error("No active plan found for seat purchase");
            }
        }
    } catch (activationError) {
        console.error("Error in optimistic activation:", activationError);
        // Payment is still recorded successfully
    }

    // ============================================================
    // SEND EMAILS (User + Admin)
    // ============================================================
    try {
        let productName = "Producto";
        if (input.courseId) productName = "Curso"; // Idealmente buscar nombre real, pero por ahora genérico o pasar como prop
        if (input.planId) productName = "Suscripción " + (input.billingPeriod === 'annual' ? 'Anual' : 'Mensual');
        if (input.seatsQuantity) productName = `Paquete de ${input.seatsQuantity} asientos`;

        // Obtener email y nombre del usuario de Auth
        const userEmail = user.email;
        const userFirstName = user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || input.payerName.split(' ')[0];

        console.log("Queueing bank transfer email for:", userEmail);

        const { data: rpcData, error: rpcError } = await supabase.rpc('queue_email_bank_transfer', {
            p_user_id: userData.id, // Se mantiene por si acaso, pero ya no es crítico para el email d usuario
            p_transfer_id: orderId,
            p_product_name: productName,
            p_amount: input.amount,
            p_currency: input.currency,
            p_payer_name: input.payerName,
            p_receipt_url: input.receiptUrl,
            p_user_email: userEmail,
            p_user_first_name: userFirstName
        });

        if (rpcError) {
            console.error("RPC Error queueing emails:", rpcError);
        } else {
            console.log("RPC Success queueing emails:", rpcData);
        }

    } catch (emailError) {
        console.error("Error queueing bank transfer emails:", emailError);
        // Don't fail the action
    }

    revalidatePath("/checkout");
    revalidatePath("/");
    revalidatePath("/[locale]/organization/settings", "page");
    revalidatePath("/[locale]/(dashboard)/organization/settings", "page");
    return { success: true, data };
}

/**
 * Uploads a transfer receipt (image or PDF) to the private-assets bucket.
 * Returns the public URL to be stored in receipt_url column.
 */
export async function uploadTransferReceipt(formData: FormData) {
    const supabase = await createClient();

    const file = formData.get("file") as File;
    if (!file) {
        return { success: false, error: "No file provided" };
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "No autenticado" };
    }

    // Generate unique path in payment-receipts bucket
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to payment-receipts bucket
    const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (uploadError) {
        console.error("Error uploading transfer receipt:", uploadError);
        return { success: false, error: sanitizeError(uploadError) };
    }

    // Get signed URL (valid for 10 years for admin review)
    const { data: signedData } = await supabase.storage
        .from("payment-receipts")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years

    const url = signedData?.signedUrl || `payment-receipts/${filePath}`;

    return {
        success: true,
        data: {
            bucket: "payment-receipts",
            path: filePath,
            url,
        },
    };
}
