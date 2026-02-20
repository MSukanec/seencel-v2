"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminPayment = {
    id: string;
    provider: string;
    provider_payment_id: string | null;
    user_id: string;
    course_id: string | null;
    amount: number | null;
    currency: string | null;
    status: string;
    created_at: string;
    product_type: string | null;
    product_id: string | null;
    organization_id: string | null;
    approved_at: string | null;
    gateway: string | null;
    metadata: Record<string, unknown> | null;
    // Joined data
    user: {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    course: {
        id: string;
        title: string;
    } | null;
    organization: {
        id: string;
        name: string;
    } | null;
};

/**
 * Get all payments for admin dashboard
 */
export async function getAdminPayments(): Promise<AdminPayment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('billing').from("payments")
        .select(`
            id,
            provider,
            provider_payment_id,
            user_id,
            course_id,
            amount,
            currency,
            status,
            created_at,
            product_type,
            product_id,
            organization_id,
            approved_at,
            gateway,
            metadata,
            user:users!payments_user_id_fkey (
                id,
                email,
                full_name,
                avatar_url
            ),
            course:courses!payments_course_id_fkey (
                id,
                title
            ),
            organization:organizations!payments_organization_id_fkey (
                id,
                name
            )
        `)
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching payments:", error);
        throw new Error("Error al obtener pagos");
    }

    // Map array relations to single objects
    return (data || []).map((row) => ({
        ...row,
        user: Array.isArray(row.user) ? row.user[0] || null : row.user,
        course: Array.isArray(row.course) ? row.course[0] || null : row.course,
        organization: Array.isArray(row.organization) ? row.organization[0] || null : row.organization,
    })) as AdminPayment[];
}

// ============================================================================
// BANK TRANSFERS
// ============================================================================

export type AdminBankTransfer = {
    id: string;
    order_id: string;
    user_id: string;
    amount: number;
    currency: string;
    payer_name: string | null;
    payer_note: string | null;
    status: "pending" | "approved" | "rejected";
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_reason: string | null;
    created_at: string;
    updated_at: string;
    payment_id: string | null;
    course_id: string | null;
    discount_percent: number | null;
    discount_amount: number | null;
    receipt_url: string | null;
    // Joined data
    user: {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    course: {
        id: string;
        title: string;
    } | null;
    reviewer: {
        id: string;
        full_name: string | null;
    } | null;
};

/**
 * Get all bank transfer payments for admin dashboard
 */
export async function getAdminBankTransfers(): Promise<AdminBankTransfer[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('billing').from("bank_transfer_payments")
        .select(`
            id,
            order_id,
            user_id,
            amount,
            currency,
            payer_name,
            payer_note,
            status,
            reviewed_by,
            reviewed_at,
            review_reason,
            created_at,
            updated_at,
            payment_id,
            course_id,
            discount_percent,
            discount_amount,
            receipt_url,
            user:users!bank_transfer_payments_user_id_fkey (
                id,
                email,
                full_name,
                avatar_url
            ),
            course:courses!bank_transfer_payments_course_id_fkey (
                id,
                title
            ),
            reviewer:users!bank_transfer_payments_reviewed_by_fkey (
                id,
                full_name
            )
        `)
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching bank transfers:", error);
        throw new Error("Error al obtener transferencias");
    }

    // Map array relations to single objects
    return (data || []).map((row) => ({
        ...row,
        user: Array.isArray(row.user) ? row.user[0] || null : row.user,
        course: Array.isArray(row.course) ? row.course[0] || null : row.course,
        reviewer: Array.isArray(row.reviewer) ? row.reviewer[0] || null : row.reviewer,
    })) as AdminBankTransfer[];
}
