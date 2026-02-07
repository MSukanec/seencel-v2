"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SeatStatus, PurchaseSeatsInput } from "./types";
import { sendEmail } from "@/features/emails/lib/send-email";
import { TeamInvitationEmail } from "@/features/emails/templates/team-invitation-email";
import { t } from "@/features/emails/lib/email-translations";
import { randomUUID } from "crypto";

// ============================================================
// INVITATIONS
// ============================================================

/**
 * Send an invitation to join the organization.
 * Validates seats, duplicates, and sends email via Resend.
 */
export async function sendInvitationAction(
    organizationId: string,
    email: string,
    roleId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: "No autenticado" };
    }

    const { data: currentUser } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('auth_id', authUser.id)
        .single();

    if (!currentUser) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // 2. Verify caller is admin member
    const { data: callerMember } = await supabase
        .from('organization_members')
        .select('id, role_id, roles(type)')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    if (!callerMember || (callerMember.roles as any)?.type !== 'admin') {
        return { success: false, error: "Solo los administradores pueden invitar miembros" };
    }

    // 3. Check available seats
    const { data: seatData, error: seatError } = await supabase.rpc('get_organization_seat_status', {
        p_organization_id: organizationId
    });

    if (seatError) {
        return { success: false, error: "Error al verificar asientos disponibles" };
    }

    const seats = seatData as SeatStatus;
    if (!seats.can_invite) {
        return { success: false, error: "No hay asientos disponibles. Comprá más asientos para invitar miembros." };
    }

    // 4. Check if email is already an active member
    const normalizedEmail = email.toLowerCase().trim();

    const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id, users!inner(email)')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('users.email', normalizedEmail)
        .maybeSingle();

    if (existingMember) {
        return { success: false, error: "Este email ya es miembro de la organización" };
    }

    // 5. Check for pending invitation
    const { data: existingInvitation } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingInvitation) {
        return { success: false, error: "Ya existe una invitación pendiente para este email" };
    }

    // 6. Get organization name for the email
    const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

    // 7. Get role name for the email
    const { data: role } = await supabase
        .from('roles')
        .select('name')
        .eq('id', roleId)
        .single();

    // 8. Generate token and insert invitation
    const token = randomUUID();

    const { error: insertError } = await supabase
        .from('organization_invitations')
        .insert({
            organization_id: organizationId,
            email: normalizedEmail,
            role_id: roleId,
            invited_by: callerMember.id,
            token,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

    if (insertError) {
        console.error('Error inserting invitation:', insertError);
        return { success: false, error: "Error al crear la invitación" };
    }

    // 9. Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seencel.com';
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;
    const orgName = org?.name || 'la organización';
    const inviterName = currentUser.full_name || currentUser.email || 'Un administrador';
    const roleName = role?.name || 'Miembro';

    const emailSubject = t('teamInvitation', 'emailSubject', 'es').replace('{orgName}', orgName);

    await sendEmail({
        to: normalizedEmail,
        subject: emailSubject,
        react: TeamInvitationEmail({
            organizationName: orgName,
            inviterName,
            roleName,
            acceptUrl,
            locale: 'es',
        }),
    });

    // 10. Revalidate
    revalidatePath('/organization/settings', 'page');

    return { success: true };
}

/**
 * Get invitation details by token (for the accept page).
 * Uses RPC (SECURITY DEFINER) to bypass RLS — works for unauthenticated users.
 */
export async function getInvitationByToken(
    token: string
): Promise<{
    success: boolean;
    data?: {
        id: string;
        email: string;
        status: string;
        expires_at: string | null;
        organization_name: string;
        role_name: string;
        inviter_name: string | null;
    };
    error?: string;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_invitation_by_token', {
        p_token: token
    });

    if (error) {
        console.error('Error getting invitation:', error);
        return { success: false, error: 'Error al buscar la invitación' };
    }

    const result = data as {
        success: boolean;
        error?: string;
        id?: string;
        email?: string;
        status?: string;
        expires_at?: string;
        organization_name?: string;
        role_name?: string;
        inviter_name?: string;
    };

    if (!result.success) {
        return { success: false, error: 'Invitación no encontrada' };
    }

    return {
        success: true,
        data: {
            id: result.id!,
            email: result.email!,
            status: result.status!,
            expires_at: result.expires_at || null,
            organization_name: result.organization_name || 'Organización',
            role_name: result.role_name || 'Miembro',
            inviter_name: result.inviter_name || null,
        },
    };
}

/**
 * Accept an organization invitation.
 * Requires the user to be authenticated.
 */
export async function acceptInvitationAction(
    token: string
): Promise<{
    success: boolean;
    organizationId?: string;
    orgName?: string;
    alreadyMember?: boolean;
    error?: string;
}> {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: 'No autenticado' };
    }

    // 2. Get public user_id
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!publicUser) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // 3. Call RPC
    const { data: result, error } = await supabase.rpc('accept_organization_invitation', {
        p_token: token,
        p_user_id: publicUser.id,
    });

    if (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: error.message };
    }

    const res = result as {
        success: boolean;
        organization_id?: string;
        org_name?: string;
        already_member?: boolean;
        error?: string;
        message?: string;
    };

    if (!res.success) {
        return {
            success: false,
            error: res.message || 'Error al aceptar la invitación',
        };
    }

    revalidatePath('/[locale]/organization', 'layout');

    return {
        success: true,
        organizationId: res.organization_id,
        orgName: res.org_name,
        alreadyMember: res.already_member || false,
    };
}

// ============================================================
// PERMISSIONS
// ============================================================

export async function seedPermissions(organizationId: string) {
    const supabase = await createClient();

    const defaultPermissions = [
        { key: 'billing.view', description: 'Ver Billing', category: 'Administración' },
        { key: 'billing.manage', description: 'Gestionar Billing', category: 'Administración' },
        { key: 'plans.view', description: 'Ver Plans', category: 'Administración' },
        { key: 'plans.manage', description: 'Gestionar Plans', category: 'Administración' },
        { key: 'admin.access', description: 'Access Administración', category: 'Administración' },
        { key: 'costs.view', description: 'Ver General Costs', category: 'General Costs' },
        { key: 'costs.manage', description: 'Gestionar General Costs', category: 'General Costs' },
        { key: 'org.view', description: 'Ver Organización', category: 'Organización' },
        { key: 'org.manage', description: 'Gestionar Organización', category: 'Organización' },
    ];

    const { error } = await supabase.from('permissions').upsert(defaultPermissions, { onConflict: 'key' });

    if (error) {
        console.error('Error seeding permissions:', error);
        throw new Error('Failed to seed permissions');
    }
}

/**
 * Toggle a permission for a role (add or remove).
 * Only allows editing non-admin roles (Editor, Lector).
 */
export async function toggleRolePermission(
    organizationId: string,
    roleId: string,
    permissionId: string,
    enabled: boolean
) {
    const supabase = await createClient();

    // Verify role belongs to org and is not Administrador
    const { data: role } = await supabase
        .from('roles')
        .select('id, name, organization_id')
        .eq('id', roleId)
        .eq('organization_id', organizationId)
        .single();

    if (!role) {
        throw new Error('Role not found or not in this organization');
    }

    if (role.name === 'Administrador') {
        throw new Error('Cannot modify Administrador permissions');
    }

    if (enabled) {
        const { error } = await supabase
            .from('role_permissions')
            .insert({
                role_id: roleId,
                permission_id: permissionId,
                organization_id: organizationId
            });

        if (error && !error.message.includes('duplicate')) {
            console.error('Error adding role permission:', error);
            throw new Error('Failed to add permission');
        }
    } else {
        const { error } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)
            .eq('permission_id', permissionId);

        if (error) {
            console.error('Error removing role permission:', error);
            throw new Error('Failed to remove permission');
        }
    }

    return { success: true };
}

// ============================================================
// MEMBER MANAGEMENT
// ============================================================

/**
 * Update a member's role in the organization.
 * Only admins can change roles. Cannot change your own role or another admin's role.
 */
export async function updateMemberRoleAction(
    organizationId: string,
    memberId: string,
    newRoleId: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Resolve public user ID from auth ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Usuario no encontrado");

    // Check current user is admin
    const { data: currentMember } = await supabase
        .from('organization_members_full_view')
        .select('id, role_type, role_name, user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', publicUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = currentMember?.role_type === 'admin' || currentMember?.role_name === 'Administrador';
    if (!currentMember || !isAdmin) {
        return { success: false, error: "Solo los administradores pueden cambiar roles" };
    }

    // Get target member
    const { data: targetMember } = await supabase
        .from('organization_members_full_view')
        .select('id, role_type, role_name, user_id, user_full_name')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

    if (!targetMember) {
        return { success: false, error: "Miembro no encontrado" };
    }

    // Check if current user is the org owner
    const { data: orgData } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single();

    const currentUserIsOwner = orgData?.owner_id === publicUser.id;

    // Cannot change your own role
    if (targetMember.user_id === publicUser.id) {
        return { success: false, error: "No podés cambiar tu propio rol" };
    }

    // Cannot change the owner's role
    if (orgData?.owner_id === targetMember.user_id) {
        return { success: false, error: "No se puede cambiar el rol del dueño" };
    }

    // Non-owner admins cannot change another admin's role
    const targetIsAdmin = targetMember.role_type === 'admin' || targetMember.role_name === 'Administrador';
    if (targetIsAdmin && !currentUserIsOwner) {
        return { success: false, error: "No se puede cambiar el rol de un administrador" };
    }

    // Update the role
    const { error } = await supabase
        .from('organization_members')
        .update({ role_id: newRoleId })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error updating member role:', error);
        return { success: false, error: "Error al actualizar el rol" };
    }

    revalidatePath('/organization/settings', 'page');

    return { success: true, memberName: targetMember.user_full_name };
}

/**
 * Remove a member from the organization (soft delete: is_active = false).
 * Only admins can remove members. Cannot remove yourself or other admins.
 */
export async function removeMemberAction(
    organizationId: string,
    memberId: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    // Resolve public user ID from auth ID
    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Usuario no encontrado");

    const { data: currentMember } = await supabase
        .from('organization_members_full_view')
        .select('id, role_type, role_name, user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', publicUser.id)
        .eq('is_active', true)
        .single();


    const isAdmin = currentMember?.role_type === 'admin' || currentMember?.role_name === 'Administrador';
    if (!currentMember || !isAdmin) {
        return { success: false, error: "Solo los administradores pueden eliminar miembros" };
    }

    const { data: targetMember } = await supabase
        .from('organization_members_full_view')
        .select('id, role_type, role_name, user_id, user_full_name')
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single();

    if (!targetMember) {
        return { success: false, error: "Miembro no encontrado" };
    }

    if (targetMember.user_id === publicUser.id) {
        return { success: false, error: "No podés eliminarte a vos mismo" };
    }

    // Check if current user is the org owner
    const { data: orgData } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single();

    const currentUserIsOwner = orgData?.owner_id === publicUser.id;

    // Cannot remove the owner
    if (orgData?.owner_id === targetMember.user_id) {
        return { success: false, error: "No se puede eliminar al dueño de la organización" };
    }

    // Non-owner admins cannot remove other admins
    const targetIsAdmin = targetMember.role_type === 'admin' || targetMember.role_name === 'Administrador';
    if (targetIsAdmin && !currentUserIsOwner) {
        return { success: false, error: "No se puede eliminar a un administrador" };
    }

    const { error } = await supabase
        .from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error removing member:', JSON.stringify(error, null, 2));
        return { success: false, error: "Error al eliminar miembro" };
    }

    revalidatePath('/organization/settings', 'page');

    return { success: true, memberName: targetMember.user_full_name };
}

// ============================================================
// SEAT BILLING
// ============================================================

/**
 * Get the current seat status of an organization.
 * Used to display in UI before inviting members.
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



/**
 * Process purchase of additional seats.
 * Called from checkout after successful payment.
 */
export async function purchaseMemberSeats(
    provider: string,
    providerPaymentId: string,
    input: PurchaseSeatsInput,
    amount: number,
    currency: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: "Not authenticated" };
    }

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
