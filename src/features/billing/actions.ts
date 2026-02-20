"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBillingProfile(formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    const isCompany = formData.get("is_company") === "true";
    const fullName = formData.get("full_name") as string || null;
    const companyName = formData.get("company_name") as string || null;
    const taxId = formData.get("tax_id") as string || null;
    const countryId = formData.get("country_id") as string || null;
    const addressLine1 = formData.get("address_line1") as string || null;
    const city = formData.get("city") as string || null;
    const postcode = formData.get("postcode") as string || null;

    const billingData = {
        user_id: userData.id,
        is_company: isCompany,
        full_name: fullName,
        company_name: companyName,
        tax_id: taxId,
        country_id: countryId || null,
        address_line1: addressLine1,
        city: city,
        postcode: postcode,
        updated_at: new Date().toISOString(),
    };

    // Check if billing profile exists
    const { data: existingProfile } = await supabase
        .schema('billing').from('billing_profiles')
        .select('id')
        .eq('user_id', userData.id)
        .single();

    let result;
    if (existingProfile) {
        // Update existing
        result = await supabase
            .schema('billing').from('billing_profiles')
            .update(billingData)
            .eq('id', existingProfile.id);
    } else {
        // Insert new
        result = await supabase
            .schema('billing').from('billing_profiles')
            .insert(billingData);
    }

    if (result.error) {
        console.error("Error updating billing profile:", result.error);
        return { success: false, error: sanitizeError(result.error) };
    }

    revalidatePath('/[locale]/settings', 'page');
    return { success: true };
}

// ============================================================
// COUPON VALIDATION
// ============================================================

export interface CouponValidationInput {
    code: string;
    productType: "course" | "subscription";
    productId: string;
    price: number;
    currency: "USD" | "ARS";
}

export interface CouponValidationSuccess {
    ok: true;
    couponId: string;
    couponCode: string;
    type: "percent" | "fixed";
    amount: number;
    discount: number;
    finalPrice: number;
    isFree: boolean;
}

export interface CouponValidationError {
    ok: false;
    reason: string;
    minimumRequired?: number;
    limit?: number;
    used?: number;
}

export type CouponValidationResult = CouponValidationSuccess | CouponValidationError;

/**
 * Validate a coupon code against a product
 * Calls the validate_coupon_universal RPC function
 */
export async function validateCoupon(input: CouponValidationInput): Promise<CouponValidationResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("validate_coupon_universal", {
        p_code: input.code,
        p_product_type: input.productType,
        p_product_id: input.productId,
        p_price: input.price,
        p_currency: input.currency
    });

    if (error) {
        console.error("Error validating coupon:", error);
        return { ok: false, reason: "DATABASE_ERROR" };
    }

    // The RPC returns a JSONB object
    const result = data as Record<string, unknown>;

    if (!result.ok) {
        return {
            ok: false,
            reason: result.reason as string,
            minimumRequired: result.minimum_required as number | undefined,
            limit: result.limit as number | undefined,
            used: result.used as number | undefined
        };
    }

    return {
        ok: true,
        couponId: result.coupon_id as string,
        couponCode: result.coupon_code as string,
        type: result.type as "percent" | "fixed",
        amount: result.amount as number,
        discount: result.discount as number,
        finalPrice: result.final_price as number,
        isFree: result.is_free as boolean
    };
}

// ============================================================
// FREE SUBSCRIPTION ACTIVATION (100% COUPON)
// ============================================================

export interface FreeSubscriptionInput {
    organizationId: string;
    planId: string;
    billingPeriod: "monthly" | "annual";
    couponId: string;
    couponCode: string;
}

/**
 * Activate a subscription for free when a 100% discount coupon is applied.
 * This bypasses payment gateways and directly calls handle_payment_subscription_success
 * with amount=0 and provider='coupon'.
 */
export async function activateFreeSubscription(input: FreeSubscriptionInput): Promise<{
    success: boolean;
    error?: string;
    paymentId?: string;
}> {
    const supabase = await createClient();

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: "Not authenticated" };
    }

    // Get internal user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    // First, redeem the coupon to mark it as used
    const { error: redeemError } = await supabase.rpc("redeem_coupon_universal", {
        p_code: input.couponCode,
        p_product_type: "subscription",
        p_product_id: input.planId,
        p_price: 0,
        p_currency: "USD",
        p_subscription_id: null,
        p_order_id: null
    });

    if (redeemError) {
        console.error("Error redeeming coupon:", redeemError);
        return { success: false, error: "Error al canjear el cupón" };
    }

    // Activate subscription via handle_payment_subscription_success
    const { data: handleResult, error: handleError } = await supabase.rpc(
        "handle_payment_subscription_success",
        {
            p_provider: "coupon",
            p_provider_payment_id: `coupon-${input.couponId}-${Date.now()}`,
            p_user_id: userData.id,
            p_organization_id: input.organizationId,
            p_plan_id: input.planId,
            p_billing_period: input.billingPeriod,
            p_amount: 0,
            p_currency: "USD",
            p_metadata: JSON.stringify({
                coupon_id: input.couponId,
                coupon_code: input.couponCode,
                is_gift: true,
                activated_via: "free_coupon"
            })
        }
    );

    if (handleError) {
        console.error("Error activating free subscription:", handleError);
        return { success: false, error: "Error al activar la suscripción" };
    }

    revalidatePath('/[locale]/organization', 'layout');
    revalidatePath('/[locale]/checkout', 'page');

    const paymentId = (handleResult as { payment_id?: string })?.payment_id;
    return { success: true, paymentId };
}

