"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =============================================================================
// USER/ORG LISTING FOR ADMIN SUPPORT
// =============================================================================

export interface UserBasic {
    id: string;
    email: string;
    fullName: string | null;
}

export interface OrganizationBasic {
    id: string;
    name: string;
    planName: string | null;
}

/**
 * Lista todos los usuarios (para selector admin)
 */
export async function getAllUsers(): Promise<{ success: boolean; users?: UserBasic[]; error?: string }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("users")
            .select("id, email, full_name")
            .order("email");

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            users: (data || []).map(u => ({
                id: u.id,
                email: u.email,
                fullName: u.full_name
            }))
        };
    } catch (error) {
        console.error("Error en getAllUsers:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error" };
    }
}

/**
 * Lista las organizaciones de un usuario específico
 */
export async function getUserOrganizations(userId: string): Promise<{ success: boolean; organizations?: OrganizationBasic[]; error?: string }> {
    try {
        const supabase = await createClient();

        // Get orgs where user is a member
        const { data, error } = await supabase
            .from("organization_members")
            .select(`
                organization_id,
                organizations:organization_id (
                    id,
                    name,
                    plans:plan_id (name)
                )
            `)
            .eq("user_id", userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            organizations: (data || []).map((m: any) => ({
                id: m.organizations.id,
                name: m.organizations.name,
                planName: m.organizations.plans?.name || null
            }))
        };
    } catch (error) {
        console.error("Error en getUserOrganizations:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error" };
    }
}

/**
 * Limpia todos los datos de compra de prueba para el usuario/org seleccionado.
 * Usa RPC con SECURITY DEFINER para bypass RLS.
 */
export async function cleanupTestPurchase(email: string, orgId: string): Promise<{ success: boolean; message: string }> {
    try {
        const supabase = await createClient();

        // Verificar que hay un usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, message: "No autenticado" };
        }

        // Llamar RPC que bypassa RLS
        const { data, error } = await supabase.rpc('admin_cleanup_test_purchase', {
            p_user_email: email,
            p_org_id: orgId
        });

        if (error) {
            console.error("Error en RPC admin_cleanup_test_purchase:", error);
            return {
                success: false,
                message: `Error RPC: ${error.message}`
            };
        }

        revalidatePath("/admin/support");

        const result = data as { success: boolean; message: string; deleted_items?: string[] };

        if (!result.success) {
            return { success: false, message: result.message };
        }

        const deletedItems = result.deleted_items || [];
        if (deletedItems.length === 0) {
            return {
                success: true,
                message: `✅ Usuario ${email} encontrado pero no tenía datos de compra para limpiar.`
            };
        }

        return {
            success: true,
            message: `✅ Limpieza completa para ${email}.\n\nSe eliminaron:\n• ${deletedItems.join("\n• ")}`
        };
    } catch (error) {
        console.error("Error en cleanupTestPurchase:", error);
        return {
            success: false,
            message: `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
        };
    }
}

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
 * Obtiene el estado actual del usuario seleccionado
 */
export async function getTestUserStatus(userId: string, orgId: string): Promise<{ success: boolean; data?: TestUserStatus; error?: string }> {
    try {
        const supabase = await createClient();

        // 1. Obtener usuario por ID
        const { data: user } = await supabase
            .from("users")
            .select("id, email, full_name, created_at")
            .eq("id", userId)
            .single();

        if (!user) {
            return { success: false, error: "Usuario no encontrado" };
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
            .eq("id", orgId)
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
            .eq("organization_id", orgId)
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

/**
 * System error type for payment step failures
 */
export interface SystemError {
    id: string;
    domain: string;
    scope: string;
    functionName: string;
    message: string;
    context: Record<string, unknown>;
    severity: string;
    createdAt: string;
}

/**
 * Obtiene errores del sistema recientes (últimos 24h por defecto)
 */
export async function getSystemErrors(hours: number = 24): Promise<{ success: boolean; errors?: SystemError[]; error?: string }> {
    try {
        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "No autenticado" };
        }

        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('system_error_logs')
            .select('*')
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching system_error_logs:", error);
            return { success: false, error: error.message };
        }

        const errors: SystemError[] = (data || []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            domain: e.domain as string,
            scope: e.entity as string, // entity in DB = scope in our type
            functionName: e.function_name as string,
            message: e.error_message as string, // error_message in DB
            context: (e.context || {}) as Record<string, unknown>,
            severity: e.severity as string,
            createdAt: e.created_at as string
        }));

        return { success: true, errors };
    } catch (error) {
        console.error("Error en getSystemErrors:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido"
        };
    }
}
