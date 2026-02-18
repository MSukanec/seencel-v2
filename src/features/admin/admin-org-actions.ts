"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Update the plan of an organization (admin only).
 * Uses organization_subscriptions to change the plan.
 */
export async function updateOrganizationPlan(
    orgId: string,
    planId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Find the org's active subscription
        const { data: subscription, error: subError } = await supabase
            .from('organization_subscriptions')
            .select('id')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .maybeSingle();

        if (subError) {
            console.error("Error finding subscription:", subError);
            return { success: false, error: "No se pudo encontrar la suscripción de la organización." };
        }

        if (subscription) {
            // Update existing subscription
            const { error: updateError } = await supabase
                .from('organization_subscriptions')
                .update({ plan_id: planId })
                .eq('id', subscription.id);

            if (updateError) {
                console.error("Error updating subscription:", updateError);
                return { success: false, error: "No se pudo actualizar la suscripción." };
            }
        } else {
            // Create new subscription
            const { error: insertError } = await supabase
                .from('organization_subscriptions')
                .insert({
                    organization_id: orgId,
                    plan_id: planId,
                    status: 'active',
                });

            if (insertError) {
                console.error("Error creating subscription:", insertError);
                return { success: false, error: "No se pudo crear la suscripción." };
            }
        }

        revalidatePath('/admin/directory');
        revalidatePath(`/admin/directory/organizations/${orgId}`);
        return { success: true };
    } catch (error) {
        console.error("Error in updateOrganizationPlan:", error);
        return { success: false, error: "Error inesperado al actualizar el plan." };
    }
}
