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

    // Cross-schema joins not supported by PostgREST — fetch separately
    const { data: payments, error } = await supabase
        .schema('billing').from("payments")
        .select(`
            id, provider, provider_payment_id, user_id, course_id,
            amount, currency, status, created_at, product_type,
            product_id, organization_id, approved_at, gateway, metadata
        `)
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching payments:", error);
        throw new Error("Error al obtener pagos");
    }

    if (!payments?.length) return [];

    // Fetch related users from iam schema
    const userIds = [...new Set(payments.map(p => p.user_id).filter(Boolean))];
    const { data: usersData } = userIds.length
        ? await supabase.schema('iam').from('users').select('id, email, full_name, avatar_url').in('id', userIds)
        : { data: [] };
    const userMap = new Map(usersData?.map(u => [u.id, u]) ?? []);

    // Fetch related courses from academy schema
    const courseIds = [...new Set(payments.map(p => p.course_id).filter(Boolean))] as string[];
    const { data: coursesData } = courseIds.length
        ? await supabase.schema('academy').from('courses').select('id, title').in('id', courseIds)
        : { data: [] };
    const courseMap = new Map(coursesData?.map(c => [c.id, c]) ?? []);

    // Fetch related organizations from iam schema
    const orgIds = [...new Set(payments.map(p => p.organization_id).filter(Boolean))] as string[];
    const { data: orgsData } = orgIds.length
        ? await supabase.schema('iam').from('organizations').select('id, name').in('id', orgIds)
        : { data: [] };
    const orgMap = new Map(orgsData?.map(o => [o.id, o]) ?? []);

    return payments.map((row) => ({
        ...row,
        user: userMap.get(row.user_id) ?? null,
        course: row.course_id ? courseMap.get(row.course_id) ?? null : null,
        organization: row.organization_id ? orgMap.get(row.organization_id) ?? null : null,
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

    // Cross-schema joins not supported — fetch separately
    const { data: transfers, error } = await supabase
        .schema('billing').from("bank_transfer_payments")
        .select(`
            id, order_id, user_id, amount, currency, payer_name, payer_note,
            status, reviewed_by, reviewed_at, review_reason, created_at,
            updated_at, payment_id, course_id, discount_percent, discount_amount, receipt_url
        `)
        .order("created_at", { ascending: false })
        .limit(500);

    if (error) {
        console.error("Error fetching bank transfers:", error);
        throw new Error("Error al obtener transferencias");
    }

    if (!transfers?.length) return [];

    // Fetch related users (includes both user_id and reviewed_by)
    const allUserIds = [...new Set([
        ...transfers.map(t => t.user_id),
        ...transfers.map(t => t.reviewed_by).filter(Boolean)
    ])] as string[];
    const { data: usersData } = allUserIds.length
        ? await supabase.schema('iam').from('users').select('id, email, full_name, avatar_url').in('id', allUserIds)
        : { data: [] };
    const userMap = new Map(usersData?.map(u => [u.id, u]) ?? []);

    // Fetch related courses from academy schema
    const courseIds = [...new Set(transfers.map(t => t.course_id).filter(Boolean))] as string[];
    const { data: coursesData } = courseIds.length
        ? await supabase.schema('academy').from('courses').select('id, title').in('id', courseIds)
        : { data: [] };
    const courseMap = new Map(coursesData?.map(c => [c.id, c]) ?? []);

    return transfers.map((row) => {
        const userData = userMap.get(row.user_id);
        const reviewerData = row.reviewed_by ? userMap.get(row.reviewed_by) : null;
        return {
            ...row,
            user: userData ? { id: userData.id, email: userData.email, full_name: userData.full_name, avatar_url: userData.avatar_url } : null,
            course: row.course_id ? courseMap.get(row.course_id) ?? null : null,
            reviewer: reviewerData ? { id: reviewerData.id, full_name: reviewerData.full_name } : null,
        };
    }) as AdminBankTransfer[];
}
