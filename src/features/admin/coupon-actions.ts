"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Coupon {
    id: string;
    code: string;
    type: "percent" | "fixed";
    amount: number;
    currency: string | null;
    max_redemptions: number | null;
    per_user_limit: number | null;
    starts_at: string | null;
    expires_at: string | null;
    min_order_total: number | null;
    applies_to_all: boolean;
    applies_to: "courses" | "subscriptions" | "all";
    is_active: boolean;
    created_at: string;
    updated_at: string;
    redemption_count?: number;
}

export interface CreateCouponInput {
    code: string;
    type: "percent" | "fixed";
    amount: number;
    currency?: string | null;
    max_redemptions?: number | null;
    per_user_limit?: number | null;
    starts_at?: string | null;
    expires_at?: string | null;
    min_order_total?: number | null;
    applies_to_all?: boolean;
    applies_to?: "courses" | "subscriptions" | "all";
    is_active?: boolean;
}

/**
 * Get all coupons with redemption counts
 */
export async function getCoupons(): Promise<Coupon[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("coupons")
        .select(`
            *,
            redemption_count:coupon_redemptions(count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching coupons:", error);
        return [];
    }

    // Transform the count aggregation
    return (data || []).map((coupon: Record<string, unknown>) => ({
        ...coupon,
        redemption_count: (coupon.redemption_count as { count: number }[])?.[0]?.count || 0,
    })) as Coupon[];
}

/**
 * Create a new coupon
 */
export async function createCoupon(input: CreateCouponInput): Promise<{ success: boolean; error?: string; coupon?: Coupon }> {
    const supabase = await createClient();

    // Get current user auth info
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Get public user ID from users table
    let createdBy: string | null = null;
    if (authUser) {
        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", authUser.id)
            .single();
        createdBy = userData?.id || null;
    }

    const { data, error } = await supabase
        .from("coupons")
        .insert({
            code: input.code.toUpperCase().trim(),
            type: input.type,
            amount: input.amount,
            currency: input.type === "fixed" ? (input.currency || "USD") : null,
            max_redemptions: input.max_redemptions || null,
            per_user_limit: input.per_user_limit ?? 1,
            starts_at: input.starts_at || null,
            expires_at: input.expires_at || null,
            min_order_total: input.min_order_total || null,
            applies_to_all: input.applies_to_all ?? true,
            applies_to: input.applies_to || "courses",
            is_active: input.is_active ?? true,
            created_by: createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating coupon:", error);
        if (error.code === "23505") {
            return { success: false, error: "Ya existe un cupón con ese código" };
        }
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/finance");
    return { success: true, coupon: data };
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(
    id: string,
    input: Partial<CreateCouponInput>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (input.code !== undefined) updateData.code = input.code.toUpperCase().trim();
    if (input.type !== undefined) updateData.type = input.type;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.max_redemptions !== undefined) updateData.max_redemptions = input.max_redemptions;
    if (input.per_user_limit !== undefined) updateData.per_user_limit = input.per_user_limit;
    if (input.starts_at !== undefined) updateData.starts_at = input.starts_at;
    if (input.expires_at !== undefined) updateData.expires_at = input.expires_at;
    if (input.min_order_total !== undefined) updateData.min_order_total = input.min_order_total;
    if (input.applies_to_all !== undefined) updateData.applies_to_all = input.applies_to_all;
    if (input.applies_to !== undefined) updateData.applies_to = input.applies_to;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { error } = await supabase
        .from("coupons")
        .update(updateData)
        .eq("id", id);

    if (error) {
        console.error("Error updating coupon:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/finance");
    return { success: true };
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting coupon:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/finance");
    return { success: true };
}

/**
 * Toggle coupon active status
 */
export async function toggleCouponStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) {
        console.error("Error toggling coupon status:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/finance");
    return { success: true };
}
