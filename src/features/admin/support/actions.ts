"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Limpia todos los datos de compra de prueba para un usuario específico.
 * Solo para uso administrativo.
 */
export async function cleanupTestPurchase(email: string): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createClient();

        // Verificar que hay un usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, message: "No autenticado" };
        }

        // Buscar el usuario target por email
        const { data: targetUser, error: userError } = await supabase
            .from("users")
            .select("id, email")
            .ilike("email", email.trim())
            .single();

        if (userError || !targetUser) {
            return { success: false, message: `Usuario no encontrado: ${email}` };
        }

        const userId = targetUser.id;
        const deletedItems: string[] = [];

        // 1. Obtener la org del usuario
        const { data: membership } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userId)
            .limit(1)
            .maybeSingle();

        const orgId = membership?.organization_id;

        // 2. Borrar course_enrollments
        const { error: enrollError } = await supabase
            .from("course_enrollments")
            .delete()
            .eq("user_id", userId);
        if (!enrollError) deletedItems.push("course_enrollments");

        // 3. Borrar suscripciones y resetear plan de org
        if (orgId) {
            const { error: subError } = await supabase
                .from("organization_subscriptions")
                .delete()
                .eq("organization_id", orgId);
            if (!subError) deletedItems.push("organization_subscriptions");

            const { error: orgError } = await supabase
                .from("organizations")
                .update({ plan_id: null })
                .eq("id", orgId);
            if (!orgError) deletedItems.push("organizations.plan_id → null");
        }

        // 4. Borrar payments
        const { error: payError } = await supabase
            .from("payments")
            .delete()
            .eq("user_id", userId);
        if (!payError) deletedItems.push("payments");

        // 5. Borrar bank_transfer_payments
        const { error: btError } = await supabase
            .from("bank_transfer_payments")
            .delete()
            .eq("user_id", userId);
        if (!btError) deletedItems.push("bank_transfer_payments");

        // 6. Borrar mp_preferences
        const { error: mpError } = await supabase
            .from("mp_preferences")
            .delete()
            .eq("user_id", userId);
        if (!mpError) deletedItems.push("mp_preferences");

        // 7. Borrar coupon_redemptions
        const { error: couponError } = await supabase
            .from("coupon_redemptions")
            .delete()
            .eq("user_id", userId);
        if (!couponError) deletedItems.push("coupon_redemptions");

        // 8. Borrar paypal preferences
        const { error: ppSeatError } = await supabase
            .from("paypal_seat_preferences")
            .delete()
            .eq("user_id", userId);
        if (!ppSeatError) deletedItems.push("paypal_seat_preferences");

        const { error: ppUpgradeError } = await supabase
            .from("paypal_upgrade_preferences")
            .delete()
            .eq("user_id", userId);
        if (!ppUpgradeError) deletedItems.push("paypal_upgrade_preferences");

        revalidatePath("/admin/support");

        if (deletedItems.length === 0) {
            return {
                success: true,
                message: `✅ Usuario ${email} encontrado pero no tenía datos de compra para limpiar.`
            };
        }

        return {
            success: true,
            message: `✅ Limpieza completa para ${email}.\n\nSe procesaron:\n• ${deletedItems.join("\n• ")}`
        };
    } catch (error) {
        console.error("Error en cleanupTestPurchase:", error);
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
        };
    }
}

/**
 * Datos hardcodeados del usuario de prueba
 */
const TEST_USER = {
    email: "matusukanec@gmail.com",
    organizationId: "6d617475-c2f1-4e3d-b924-0c8dbdd44e25"
};

export interface TestUserStatus {
    user: {
        id: string;
        email: string;
        fullName: string | null;
        createdAt: string;
    } | null;
    organization: {
        id: string;
        name: string;
        planId: string | null;
        planName: string | null;
        isFounder: boolean;
        createdAt: string;
    } | null;
    subscription: {
        id: string;
        status: string;
        planName: string;
        billingPeriod: string;
        startedAt: string;
        expiresAt: string;
    } | null;
    enrollments: {
        id: string;
        courseName: string;
        courseSlug: string;
        enrolledAt: string;
        status: string;
    }[];
    payments: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        productType: string;
        createdAt: string;
    }[];
    bankTransfers: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        createdAt: string;
    }[];
    couponRedemptions: {
        id: string;
        couponCode: string;
        redeemedAt: string;
    }[];
}

/**
 * Obtiene el estado actual del usuario de prueba hardcodeado
 */
export async function getTestUserStatus(): Promise<{ success: boolean; data?: TestUserStatus; error?: string }> {
    try {
        const supabase = await createClient();

        // 1. Obtener usuario
        const { data: user } = await supabase
            .from("users")
            .select("id, email, full_name, created_at")
            .ilike("email", TEST_USER.email)
            .single();

        if (!user) {
            return { success: false, error: "Usuario de prueba no encontrado" };
        }

        // 2. Obtener organización con plan
        const { data: org } = await supabase
            .from("organizations")
            .select(`
                id, 
                name, 
                plan_id, 
                created_at,
                settings,
                plans:plan_id (name)
            `)
            .eq("id", TEST_USER.organizationId)
            .single();

        // 3. Obtener suscripción activa
        const { data: subscription } = await supabase
            .from("organization_subscriptions")
            .select(`
                id,
                status,
                billing_period,
                started_at,
                expires_at,
                plans:plan_id (name)
            `)
            .eq("organization_id", TEST_USER.organizationId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        // 4. Obtener enrollments
        const { data: enrollments } = await supabase
            .from("course_enrollments")
            .select(`
                id,
                enrolled_at,
                status,
                courses:course_id (title, slug)
            `)
            .eq("user_id", user.id);

        // 5. Obtener payments
        const { data: payments } = await supabase
            .from("payments")
            .select("id, amount, currency, status, product_type, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        // 6. Obtener transferencias bancarias
        const { data: bankTransfers } = await supabase
            .from("bank_transfer_payments")
            .select("id, amount, currency, status, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        // 7. Obtener cupones usados
        const { data: couponRedemptions } = await supabase
            .from("coupon_redemptions")
            .select(`
                id,
                redeemed_at,
                coupons:coupon_id (code)
            `)
            .eq("user_id", user.id);

        const isFounder = (org?.settings as any)?.is_founder === true;

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    createdAt: user.created_at
                },
                organization: org ? {
                    id: org.id,
                    name: org.name,
                    planId: org.plan_id,
                    planName: (org.plans as any)?.name || null,
                    isFounder,
                    createdAt: org.created_at
                } : null,
                subscription: subscription ? {
                    id: subscription.id,
                    status: subscription.status,
                    planName: (subscription.plans as any)?.name || "Sin nombre",
                    billingPeriod: subscription.billing_period,
                    startedAt: subscription.started_at,
                    expiresAt: subscription.expires_at
                } : null,
                enrollments: (enrollments || []).map((e: any) => ({
                    id: e.id,
                    courseName: e.courses?.title || "Curso desconocido",
                    courseSlug: e.courses?.slug || "",
                    enrolledAt: e.enrolled_at,
                    status: e.status
                })),
                payments: (payments || []).map((p: any) => ({
                    id: p.id,
                    amount: p.amount,
                    currency: p.currency,
                    status: p.status,
                    productType: p.product_type,
                    createdAt: p.created_at
                })),
                bankTransfers: (bankTransfers || []).map((bt: any) => ({
                    id: bt.id,
                    amount: bt.amount,
                    currency: bt.currency,
                    status: bt.status,
                    createdAt: bt.created_at
                })),
                couponRedemptions: (couponRedemptions || []).map((cr: any) => ({
                    id: cr.id,
                    couponCode: cr.coupons?.code || "Cupón desconocido",
                    redeemedAt: cr.redeemed_at
                }))
            }
        };
    } catch (error) {
        console.error("Error en getTestUserStatus:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido"
        };
    }
}

