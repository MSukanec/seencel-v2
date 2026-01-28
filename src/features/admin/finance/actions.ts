"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CreatePaymentInput {
    provider: string;
    provider_payment_id?: string;
    user_id: string;
    course_id?: string;
    amount: number;
    currency: string;
    status: string;
    product_type?: string;
    product_id?: string;
    organization_id?: string;
    gateway?: string;
}

interface UpdatePaymentInput {
    id: string;
    provider?: string;
    amount?: number;
    currency?: string;
    status?: string;
    gateway?: string;
}

/**
 * Create a new payment record
 */
export async function createPayment(input: CreatePaymentInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("payments")
        .insert({
            provider: input.provider,
            provider_payment_id: input.provider_payment_id || null,
            user_id: input.user_id,
            course_id: input.course_id || null,
            amount: input.amount,
            currency: input.currency,
            status: input.status,
            product_type: input.product_type || null,
            product_id: input.product_id || null,
            organization_id: input.organization_id || null,
            gateway: input.gateway || null,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating payment:", error);
        throw new Error("Error al crear pago");
    }

    revalidatePath("/admin/finance");
    return data;
}

/**
 * Update an existing payment
 */
export async function updatePayment(input: UpdatePaymentInput) {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.gateway !== undefined) updateData.gateway = input.gateway;

    const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating payment:", error);
        throw new Error("Error al actualizar pago");
    }

    revalidatePath("/admin/finance");
    return data;
}

/**
 * Delete a payment record
 */
export async function deletePayment(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting payment:", error);
        throw new Error("Error al eliminar pago");
    }

    revalidatePath("/admin/finance");
    return { success: true };
}

// ============================================================================
// BANK TRANSFERS
// ============================================================================

interface UpdateBankTransferInput {
    id: string;
    status?: "pending" | "approved" | "rejected";
    review_reason?: string | null;
    payer_name?: string | null;
    payer_note?: string | null;
    discount_percent?: number | null;
    discount_amount?: number | null;
}

/**
 * Update a bank transfer record
 * When approved, creates the payment record and activates enrollment/subscription
 */
export async function updateBankTransfer(input: UpdateBankTransferInput) {
    const supabase = await createClient();

    // Get current user (reviewer) - need internal user ID
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Get internal user ID for reviewer
    let reviewerId: string | null = null;
    if (authUser) {
        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", authUser.id)
            .single();
        reviewerId = userData?.id || null;
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.status !== undefined) {
        updateData.status = input.status;
        // If status changed to approved or rejected, set reviewer info
        if (input.status === "approved" || input.status === "rejected") {
            updateData.reviewed_by = reviewerId;
            updateData.reviewed_at = new Date().toISOString();
        }
    }
    if (input.review_reason !== undefined) updateData.review_reason = input.review_reason;
    if (input.payer_name !== undefined) updateData.payer_name = input.payer_name;
    if (input.payer_note !== undefined) updateData.payer_note = input.payer_note;
    if (input.discount_percent !== undefined) updateData.discount_percent = input.discount_percent;
    if (input.discount_amount !== undefined) updateData.discount_amount = input.discount_amount;

    // First, get the current bank transfer data (we need it for creating payment)
    const { data: transferData, error: fetchError } = await supabase
        .from("bank_transfer_payments")
        .select("*")
        .eq("id", input.id)
        .single();

    if (fetchError || !transferData) {
        console.error("Error fetching bank transfer:", fetchError);
        return { success: false, error: fetchError?.message || "Transfer not found" };
    }

    // If already approved/rejected and trying to change again, prevent it
    if (transferData.status !== "pending" && input.status !== undefined) {
        return { success: false, error: "Esta transferencia ya fue procesada" };
    }

    // Update the bank transfer status
    const { data, error } = await supabase
        .from("bank_transfer_payments")
        .update(updateData)
        .eq("id", input.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating bank transfer:", error);
        return { success: false, error: error.message };
    }

    // If status changed to APPROVED, create the payment record and activate enrollment/subscription
    if (input.status === "approved") {
        try {
            const isCourse = !!transferData.course_id;
            const isSubscription = !!transferData.plan_id && !!transferData.organization_id;

            if (isCourse) {
                // Call the SQL function to handle course payment
                const { data: handleResult, error: handleError } = await supabase.rpc(
                    "handle_payment_course_success",
                    {
                        p_provider: "bank_transfer",
                        p_provider_payment_id: input.id, // Use transfer ID as payment ID
                        p_user_id: transferData.user_id,
                        p_course_id: transferData.course_id,
                        p_amount: transferData.amount,
                        p_currency: transferData.currency,
                        p_metadata: JSON.stringify({
                            transfer_id: input.id,
                            exchange_rate: transferData.exchange_rate || null,
                            payer_name: transferData.payer_name,
                            discount_percent: transferData.discount_percent,
                            approved_by: reviewerId
                        })
                    }
                );

                if (handleError) {
                    console.error("Error calling handle_payment_course_success:", handleError);
                    // Don't fail - the status was already updated
                } else {
                    // Update the bank_transfer with the payment_id if returned
                    const paymentId = (handleResult as { payment_id?: string })?.payment_id;
                    if (paymentId) {
                        await supabase
                            .from("bank_transfer_payments")
                            .update({ payment_id: paymentId })
                            .eq("id", input.id);
                    }
                }
            } else if (isSubscription) {
                // Call the SQL function to handle subscription payment
                const { data: handleResult, error: handleError } = await supabase.rpc(
                    "handle_payment_subscription_success",
                    {
                        p_provider: "bank_transfer",
                        p_provider_payment_id: input.id,
                        p_user_id: transferData.user_id,
                        p_organization_id: transferData.organization_id,
                        p_plan_id: transferData.plan_id,
                        p_billing_period: transferData.billing_period || "monthly",
                        p_amount: transferData.amount,
                        p_currency: transferData.currency,
                        p_metadata: JSON.stringify({
                            transfer_id: input.id,
                            exchange_rate: transferData.exchange_rate || null,
                            payer_name: transferData.payer_name,
                            discount_percent: transferData.discount_percent,
                            approved_by: reviewerId
                        })
                    }
                );

                if (handleError) {
                    console.error("Error calling handle_payment_subscription_success:", handleError);
                } else {
                    const paymentId = (handleResult as { payment_id?: string })?.payment_id;
                    if (paymentId) {
                        await supabase
                            .from("bank_transfer_payments")
                            .update({ payment_id: paymentId })
                            .eq("id", input.id);
                    }
                }
            }
        } catch (err) {
            console.error("Error processing approval:", err);
            // Don't fail the update - approval status is already set
        }
    }

    revalidatePath("/admin/finance");
    return { success: true, data };
}

/**
 * Delete a bank transfer record
 */
export async function deleteBankTransfer(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("bank_transfer_payments")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting bank transfer:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/finance");
    return { success: true };
}

