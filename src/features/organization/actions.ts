'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { OrganizationPreferences, OrganizationCurrency } from "@/types/organization";

export async function updateInsightConfig(organizationId: string, newConfig: any) {
    const supabase = await createClient();

    // Fetch current config to merge
    const { data: current, error: fetchError } = await supabase
        .from('organization_preferences')
        .select('insight_config')
        .eq('organization_id', organizationId)
        .single();

    if (fetchError) throw new Error(fetchError.message);

    const settings = current?.insight_config || {};
    const updatedSettings = { ...settings, ...newConfig };

    const { error } = await supabase
        .from('organization_preferences')
        .update({ insight_config: updatedSettings })
        .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/organization/settings');
    return { success: true };
}

export async function switchOrganization(organizationId: string) {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    // 2. Get Public User ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) {
        throw new Error("Public user record not found");
    }

    // 3. Update User Preferences (Global)
    const { error } = await supabase
        .from('user_preferences')
        .update({ last_organization_id: organizationId })
        .eq('user_id', publicUser.id);

    if (error) {
        console.error("Error switching organization:", error);
        throw new Error("Failed to switch organization");
    }

    // 3b. Update Org-Specific Preferences (Last Access Timestamp)
    // We upsert to ensure we touch the updated_at.
    await supabase
        .from('user_organization_preferences')
        .upsert({
            user_id: publicUser.id,
            organization_id: organizationId,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, organization_id'
        });

    // 4. Revalidate to refresh data across the app
    revalidatePath('/', 'layout');

    // 5. Redirect to Localized Dashboard
    const locale = await getLocale();
    // Logic matching the pathnames defined in i18n/routing.ts
    const path = locale === 'es' ? '/es/organizacion' : '/en/organization';

    redirect(path);
}

// ============================================================
// SEAT BILLING - Compra de asientos adicionales
// ============================================================

export interface SeatStatus {
    seats_included: number;     // Seats GRATIS en el plan (ej: 1 para owner)
    max_members: number;        // Límite MÁXIMO posible de miembros
    purchased: number;          // Seats comprados adicionales
    total_capacity: number;     // Total actual = included + purchased
    used: number;               // Miembros actuales
    pending_invitations: number; // Invitaciones pendientes
    available: number;          // Slots disponibles para invitar
    can_invite: boolean;        // Si puede invitar sin comprar más
    can_buy_more: boolean;      // Si puede comprar más (no alcanzó max_members)
    seat_price_monthly: number; // Precio base por seat mensual
    seat_price_annual: number;  // Precio base por seat anual
    plan_slug: string | null;   // Slug del plan actual

    // Prorrateo
    billing_period: 'monthly' | 'annual' | null;
    expires_at: string | null;  // ISO date de fin de ciclo
    days_remaining: number;     // Días hasta fin de ciclo
    prorated_price: number;     // Precio prorrateado a pagar
}

/**
 * Obtiene el estado actual de seats de una organización
 * Usado para mostrar en UI antes de invitar miembros
 */
export async function getOrganizationSeatStatus(
    organizationId: string
): Promise<{ success: boolean; data?: SeatStatus; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_organization_seat_status', {
        p_organization_id: organizationId
    });

    if (error) {
        console.error('Error getting seat status:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as SeatStatus };
}

export interface PurchaseSeatsInput {
    organizationId: string;
    planId: string;
    seatsCount: number;
    billingPeriod: 'monthly' | 'annual';
}

/**
 * Procesa compra de seats adicionales.
 * Llamada desde checkout después del pago exitoso.
 */
export async function purchaseMemberSeats(
    provider: string,
    providerPaymentId: string,
    input: PurchaseSeatsInput,
    amount: number,
    currency: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
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

    const { data: result, error } = await supabase.rpc('handle_member_seat_purchase', {
        p_provider: provider,
        p_provider_payment_id: providerPaymentId,
        p_user_id: userData.id,
        p_organization_id: input.organizationId,
        p_plan_id: input.planId,
        p_seats_purchased: input.seatsCount,
        p_amount: amount,
        p_currency: currency,
        p_metadata: JSON.stringify({
            billing_period: input.billingPeriod,
            seats_count: input.seatsCount
        })
    });

    if (error) {
        console.error('Error purchasing seats:', error);
        return { success: false, error: error.message };
    }

    const status = (result as { status: string })?.status;
    if (status === 'already_processed') {
        return { success: true, paymentId: undefined };
    }

    revalidatePath('/[locale]/organization', 'layout');

    const paymentId = (result as { payment_id?: string })?.payment_id;
    return { success: true, paymentId };
}

