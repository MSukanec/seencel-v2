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
