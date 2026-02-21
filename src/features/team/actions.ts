"use server";


import { sanitizeError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SeatStatus, PurchaseSeatsInput, ExternalActorDetail } from "./types";
import { EXTERNAL_ACTOR_TYPE_LABELS, ADVISOR_ACTOR_TYPES } from "./types";
import { getOrganizationPlanFeatures } from "@/actions/plans";
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
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('auth_id', authUser.id)
        .single();

    if (!currentUser) {
        return { success: false, error: "Usuario no encontrado" };
    }

    // 2. Verify caller is admin member (using full view like updateMemberRoleAction)
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name, user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: "Solo los administradores pueden invitar miembros" };
    }

    // 3. Check available seats
    const { data: seatData, error: seatError } = await supabase.schema('billing').rpc('get_organization_seat_status', {
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
        .schema('iam').from('organization_members')
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
        .schema('iam').from('organization_invitations')
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
        .schema('iam').from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

    // 7. Get role and validate it's not a system role
    const { data: role } = await supabase
        .schema('iam').from('roles')
        .select('name, is_system, type')
        .eq('id', roleId)
        .single();

    if (!role) {
        return { success: false, error: "Rol no encontrado" };
    }

    if (role.is_system || role.type === 'web' || role.type === 'owner') {
        return { success: false, error: "No se puede asignar un rol de sistema a un miembro invitado" };
    }

    // 8. Generate token and insert invitation
    const token = randomUUID();

    const { error: insertError } = await supabase
        .schema('iam').from('organization_invitations')
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
    revalidatePath('/organization/team', 'page');

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
        invitation_type: string;
        actor_type: string | null;
        organization_name: string;
        role_name: string;
        inviter_name: string | null;
    };
    error?: string;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase.schema('iam').rpc('get_invitation_by_token', {
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
        invitation_type?: string;
        actor_type?: string;
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
            invitation_type: result.invitation_type || 'member',
            actor_type: result.actor_type || null,
            organization_name: result.organization_name || 'Organización',
            role_name: result.role_name || 'Miembro',
            inviter_name: result.inviter_name || null,
        },
    };
}


/**
 * Revoke (cancel) a pending invitation.
 */
export async function revokeInvitationAction(
    organizationId: string,
    invitationId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "No autenticado" };

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
    if (!currentUser) return { success: false, error: "Usuario no encontrado" };

    // Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: "Solo los administradores pueden revocar invitaciones" };
    }

    // Delete the invitation
    const { error } = await supabase
        .schema('iam').from('organization_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error revoking invitation:', error);
        return { success: false, error: sanitizeError(error) };
    }

    revalidatePath('/[locale]/organization', 'layout');
    return { success: true };
}

/**
 * Resend an existing invitation with a fresh token and expiration.
 */
export async function resendInvitationAction(
    organizationId: string,
    invitationId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: "No autenticado" };

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('auth_id', authUser.id)
        .single();
    if (!currentUser) return { success: false, error: "Usuario no encontrado" };

    // Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: "Solo los administradores pueden reenviar invitaciones" };
    }

    // Get invitation details
    const { data: invitation } = await supabase
        .schema('iam').from('organization_invitations')
        .select('id, email, role_id, organization_id')
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'registered'])
        .single();

    if (!invitation) {
        return { success: false, error: "Invitación no encontrada o ya fue aceptada" };
    }

    // Get org name for email
    const { data: org } = await supabase
        .schema('iam').from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

    // Generate new token and reset expiration
    const newToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabase
        .schema('iam').from('organization_invitations')
        .update({
            token: newToken,
            expires_at: expiresAt.toISOString(),
            status: 'pending',
        })
        .eq('id', invitationId);

    if (updateError) {
        console.error('Error resending invitation:', updateError);
        return { success: false, error: sanitizeError(updateError) };
    }

    // Re-send email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.seencel.com'}/invite?token=${newToken}`;

    try {
        await sendEmail({
            to: invitation.email,
            subject: `${currentUser.full_name || 'Un administrador'} te invitó a unirte a ${org?.name || 'una organización'} en Seencel`,
            react: TeamInvitationEmail({
                acceptUrl: inviteUrl,
                organizationName: org?.name || 'Organización',
                inviterName: currentUser.full_name || 'Un administrador',
                roleName: 'Miembro',
            }),
        });
    } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the action if email fails - the token was already updated
    }

    revalidatePath('/[locale]/organization', 'layout');
    return { success: true };
}

/**
 * Accept an organization invitation.
 * Requires the user to be authenticated.
 * Handles both member and external invitations.
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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!publicUser) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // 3. Check if it's an external or client invitation first
    const { data: invitation } = await supabase
        .schema('iam').from('organization_invitations')
        .select('id, invitation_type, actor_type, organization_id, status')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

    // Handle CLIENT invitation via iam.accept_client_invitation RPC
    if (invitation?.invitation_type === 'client') {
        const { data: result, error } = await supabase.schema('iam').rpc('accept_client_invitation' as any, {
            p_token: token,
            p_user_id: publicUser.id,
        });

        if (error) {
            console.error('Error accepting client invitation:', error);
            return { success: false, error: sanitizeError(error) };
        }

        const res = result as {
            success: boolean;
            already_client?: boolean;
            organization_id?: string;
            org_name?: string;
            project_id?: string;
            error?: string;
            message?: string;
        };

        if (!res.success) {
            return {
                success: false,
                error: res.message || 'Error al aceptar la invitación de cliente',
            };
        }

        revalidatePath('/[locale]/organization', 'layout');

        return {
            success: true,
            organizationId: res.organization_id,
            orgName: res.org_name,
            alreadyMember: res.already_client || false,
        };
    }

    // Handle EXTERNAL (collaborator) invitation via SECURITY DEFINER RPC
    // (bypasses RLS since the user is not a member of the org yet)
    if (invitation?.invitation_type === 'external') {
        const { data: result, error } = await supabase.schema('iam').rpc('accept_external_invitation', {
            p_token: token,
            p_user_id: publicUser.id,
        });

        if (error) {
            console.error('Error accepting external invitation:', error);
            return { success: false, error: sanitizeError(error) };
        }

        const res = result as {
            success: boolean;
            already_actor?: boolean;
            organization_id?: string;
            org_name?: string;
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
            alreadyMember: res.already_actor || false,
        };
    }

    // 4. Member invitation — use existing RPC flow
    const { data: result, error } = await supabase.schema('iam').rpc('accept_organization_invitation', {
        p_token: token,
        p_user_id: publicUser.id,
    });

    if (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: sanitizeError(error) };
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

    // 5. Switch active org to the invited one BEFORE revalidating
    if (res.organization_id) {
        await supabase
            .schema('iam').from('user_preferences')
            .update({ last_organization_id: res.organization_id })
            .eq('user_id', publicUser.id);

        await supabase
            .schema('iam').from('user_organization_preferences')
            .upsert({
                user_id: publicUser.id,
                organization_id: res.organization_id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, organization_id'
            });
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

    const { error } = await supabase.schema('iam').from('permissions').upsert(defaultPermissions, { onConflict: 'key' });

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
        .schema('iam').from('roles')
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
            .schema('iam').from('role_permissions')
            .insert({
                role_id: roleId,
                permission_id: permissionId,
                organization_id: organizationId
            });

        if (error && !sanitizeError(error).includes('duplicate')) {
            console.error('Error adding role permission:', error);
            throw new Error('Failed to add permission');
        }
    } else {
        const { error } = await supabase
            .schema('iam').from('role_permissions')
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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Usuario no encontrado");

    // Check current user is admin
    const { data: currentMember } = await supabase
        .schema('iam').from('organization_members_full_view')
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
        .schema('iam').from('organization_members_full_view')
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
        .schema('iam').from('organizations')
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
        .schema('iam').from('organization_members')
        .update({ role_id: newRoleId })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error updating member role:', error);
        return { success: false, error: "Error al actualizar el rol" };
    }

    revalidatePath('/organization/team', 'page');

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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!publicUser) throw new Error("Usuario no encontrado");

    const { data: currentMember } = await supabase
        .schema('iam').from('organization_members_full_view')
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
        .schema('iam').from('organization_members_full_view')
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
        .schema('iam').from('organizations')
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
        .schema('iam').from('organization_members')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error removing member:', JSON.stringify(error, null, 2));
        return { success: false, error: "Error al eliminar miembro" };
    }

    revalidatePath('/organization/team', 'page');

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

    const { data, error } = await supabase.schema('billing').rpc('get_organization_seat_status', {
        p_organization_id: organizationId
    });

    if (error) {
        console.error('Error getting seat status:', error);
        return { success: false, error: sanitizeError(error) };
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
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

    if (!userData) {
        return { success: false, error: "User not found" };
    }

    const { data: result, error } = await supabase.schema('billing').rpc('handle_payment_seat_success', {
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
        return { success: false, error: sanitizeError(error) };
    }

    const status = (result as { status: string })?.status;
    if (status === 'already_processed') {
        return { success: true, paymentId: undefined };
    }

    revalidatePath('/[locale]/organization', 'layout');

    const paymentId = (result as { payment_id?: string })?.payment_id;
    return { success: true, paymentId };
}

// ============================================================
// EXTERNAL COLLABORATORS
// ============================================================



/**
 * Add an external collaborator/client to the organization.
 * ALWAYS creates an invitation — the user must accept before being added.
 * Notifies via: email (always), in-app modal (if user exists), campanita (if user exists).
 */
export async function addExternalCollaboratorAction(
    organizationId: string,
    email: string,
    actorType: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: 'No autenticado' };
    }

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('auth_id', authUser.id)
        .single();

    if (!currentUser) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // 2. Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name, user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: 'Solo los administradores pueden agregar colaboradores externos' };
    }

    // 3. Validate actor_type
    if (!EXTERNAL_ACTOR_TYPE_LABELS[actorType]) {
        return { success: false, error: 'Tipo de colaborador no válido' };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 4. Check if already an active member  
    const { data: existingMember } = await supabase
        .schema('iam').from('organization_members')
        .select('id, users!inner(email)')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .eq('users.email', normalizedEmail)
        .maybeSingle();

    if (existingMember) {
        return { success: false, error: 'Este email ya es miembro interno de la organización. No necesita ser colaborador externo.' };
    }

    // 5. Check for existing pending invitation (member or external)
    const { data: existingInvitation } = await supabase
        .schema('iam').from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingInvitation) {
        return { success: false, error: 'Ya existe una invitación pendiente para este email' };
    }

    // 6. Check if user exists in Seencel (for notification purposes)
    const { data: existingUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('email', normalizedEmail)
        .maybeSingle();

    // 6b. If user exists, check if already an active external actor
    if (existingUser) {
        const { data: existingActor } = await supabase
            .schema('iam').from('organization_external_actors')
            .select('id, is_active')
            .eq('organization_id', organizationId)
            .eq('user_id', existingUser.id)
            .maybeSingle();

        if (existingActor?.is_active) {
            return { success: false, error: 'Este usuario ya es colaborador externo de la organización' };
        }
    }

    // Get org name for emails/toasts
    const { data: org } = await supabase
        .schema('iam').from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

    const orgName = org?.name || 'la organización';
    const inviterName = currentUser.full_name || currentUser.email || 'Un administrador';

    // 7. ALWAYS create invitation — user must accept
    const token = randomUUID();
    const actorLabel = EXTERNAL_ACTOR_TYPE_LABELS[actorType]?.label || 'Colaborador';

    const { data: invitationData, error: insertError } = await supabase
        .schema('iam').from('organization_invitations')
        .insert({
            organization_id: organizationId,
            email: normalizedEmail,
            role_id: null,
            invited_by: callerMember.id,
            token,
            status: 'pending',
            invitation_type: 'external',
            actor_type: actorType,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Error inserting external invitation:', insertError);
        return { success: false, error: 'Error al crear la invitación' };
    }

    // 8. Send invitation email ALWAYS
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seencel.com';
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;
    const emailSubject = `${inviterName} te invitó a colaborar en ${orgName}`;

    try {
        await sendEmail({
            to: normalizedEmail,
            subject: emailSubject,
            react: TeamInvitationEmail({
                organizationName: orgName,
                inviterName,
                roleName: actorLabel,
                acceptUrl,
                locale: 'es',
                isExternal: true,
            }),
        });
    } catch (emailError) {
        console.error('Error sending external invitation email:', emailError);
        // Don't fail — invitation was created
    }

    // 9. If user exists in Seencel → create in-app notification (campanita)
    // The modal (PendingInvitationOverlay) is handled automatically by PendingInvitationChecker
    if (existingUser) {
        try {
            const { data: notif } = await supabase
                .schema('notifications').from('notifications')
                .insert({
                    type: 'invitation',
                    title: `Te invitaron a ${orgName}`,
                    body: `${inviterName} te invitó como ${actorLabel}. Aceptá la invitación para unirte.`,
                    data: {
                        invitation_id: invitationData?.id,
                        organization_id: organizationId,
                        actor_type: actorType,
                    },
                })
                .select('id')
                .single();

            if (notif) {
                await supabase
                    .schema('notifications').from('user_notifications')
                    .insert({
                        user_id: existingUser.id,
                        notification_id: notif.id,
                    });
            }
        } catch (notifError) {
            console.error('Error creating in-app notification:', notifError);
            // Don't fail — invitation + email were already sent
        }
    }

    revalidatePath('/organization/team', 'page');
    return { success: true };
}

/**
 * Get all external actors for an organization (for the team view).
 */

/**
 * Add an external collaborator with project context.
 * Same as addExternalCollaboratorAction but includes project_id and client_id
 * in the invitation so that accept_external_invitation auto-creates project_access.
 */
export async function addExternalCollaboratorWithProjectAction(input: {
    organizationId: string;
    email: string;
    actorType: string;
    projectId: string;
    clientId: string | null;
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        return { success: false, error: 'No autenticado' };
    }

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('auth_id', authUser.id)
        .single();

    if (!currentUser) {
        return { success: false, error: 'Usuario no encontrado' };
    }

    // 2. Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name, user_id')
        .eq('organization_id', input.organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: 'Solo los administradores pueden invitar colaboradores' };
    }

    const normalizedEmail = input.email.toLowerCase().trim();

    // 3. Check if already a member
    const { data: existingMember } = await supabase
        .schema('iam').from('organization_members')
        .select('id, users!inner(email)')
        .eq('organization_id', input.organizationId)
        .eq('is_active', true)
        .eq('users.email', normalizedEmail)
        .maybeSingle();

    if (existingMember) {
        return { success: false, error: 'Este email ya es miembro interno de la organización.' };
    }

    // 4. Check for existing pending invitation
    const { data: existingInvitation } = await supabase
        .schema('iam').from('organization_invitations')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('email', normalizedEmail)
        .eq('status', 'pending')
        .maybeSingle();

    if (existingInvitation) {
        return { success: false, error: 'Ya existe una invitación pendiente para este email' };
    }

    // 5. Check if user exists in Seencel
    const { data: existingUser } = await supabase
        .schema('iam').from('users')
        .select('id, full_name, email')
        .eq('email', normalizedEmail)
        .maybeSingle();

    // If user exists and already has project_access, skip
    if (existingUser) {
        const { data: existingAccess } = await supabase
            .schema('iam').from('project_access')
            .select('id')
            .eq('project_id', input.projectId)
            .eq('user_id', existingUser.id)
            .eq('is_deleted', false)
            .maybeSingle();

        if (existingAccess) {
            return { success: false, error: 'Este usuario ya tiene acceso a este proyecto' };
        }
    }

    // Get org name
    const { data: org } = await supabase
        .schema('iam').from('organizations')
        .select('name')
        .eq('id', input.organizationId)
        .single();

    const orgName = org?.name || 'la organización';
    const inviterName = currentUser.full_name || currentUser.email || 'Un administrador';

    // 6. Create invitation WITH project context
    const token = randomUUID();
    const actorLabel = EXTERNAL_ACTOR_TYPE_LABELS[input.actorType]?.label || 'Colaborador';

    const { data: invitationData, error: insertError } = await supabase
        .schema('iam').from('organization_invitations')
        .insert({
            organization_id: input.organizationId,
            email: normalizedEmail,
            role_id: null,
            // If the user already exists in Seencel, store their user_id for easier lookup
            user_id: existingUser?.id ?? null,
            invited_by: callerMember.id,
            token,
            status: 'pending',
            invitation_type: input.actorType === 'client' ? 'client' : 'external',
            actor_type: input.actorType,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            project_id: input.projectId,
            client_id: input.clientId,
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Error inserting external invitation with project:', insertError);
        return { success: false, error: 'Error al crear la invitación' };
    }

    // 7. Send email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seencel.com';
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;
    const emailSubject = `${inviterName} te invitó a colaborar en ${orgName}`;

    try {
        await sendEmail({
            to: normalizedEmail,
            subject: emailSubject,
            react: TeamInvitationEmail({
                organizationName: orgName,
                inviterName,
                roleName: actorLabel,
                acceptUrl,
                locale: 'es',
                isExternal: true,
            }),
        });
    } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
    }

    // 8. In-app notification if user exists
    if (existingUser) {
        try {
            const { data: notif } = await supabase
                .schema('notifications').from('notifications')
                .insert({
                    type: 'invitation',
                    title: `Te invitaron a ${orgName}`,
                    body: `${inviterName} te invitó como ${actorLabel}. Aceptá la invitación para unirte.`,
                    data: {
                        invitation_id: invitationData?.id,
                        organization_id: input.organizationId,
                        actor_type: input.actorType,
                        project_id: input.projectId,
                    },
                })
                .select('id')
                .single();

            if (notif) {
                await supabase
                    .schema('notifications').from('user_notifications')
                    .insert({
                        user_id: existingUser.id,
                        notification_id: notif.id,
                    });
            }
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }
    }

    revalidatePath('/organization/projects');
    revalidatePath('/organization/team', 'page');
    return { success: true };
}

/**
 * Get all external actors for an organization (for the team view).
 */
export async function getExternalActorsForOrg(
    organizationId: string
): Promise<{ success: boolean; data?: ExternalActorDetail[]; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .schema('iam').from('organization_external_actors')
        .select(`
            id,
            organization_id,
            user_id,
            actor_type,
            is_active,
            created_at
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching external actors:', error);
        return { success: false, error: sanitizeError(error) };
    }

    // Cross-schema: enriquecer con datos de users (public schema)
    const userIds = [...new Set((data || []).map((a: any) => a.user_id).filter(Boolean))];
    let usersMap: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
        const { data: usersData } = await supabase
            .schema('iam').from('users')
            .select('id, full_name, email, avatar_url')
            .in('id', userIds);
        for (const u of (usersData || [])) {
            usersMap[u.id] = { full_name: u.full_name, email: u.email, avatar_url: u.avatar_url };
        }
    }

    // Map the data to flat structure
    const actors: ExternalActorDetail[] = (data || []).map((actor: any) => ({
        id: actor.id,
        organization_id: actor.organization_id,
        user_id: actor.user_id,
        actor_type: actor.actor_type,
        is_active: actor.is_active,
        created_at: actor.created_at,
        user_full_name: usersMap[actor.user_id]?.full_name || null,
        user_email: usersMap[actor.user_id]?.email || null,
        user_avatar_url: usersMap[actor.user_id]?.avatar_url || null,
    }));

    return { success: true, data: actors };
}

/**
 * Remove (deactivate) an external actor from the organization.
 * Soft delete: is_active = false.
 */
export async function removeExternalActorAction(
    organizationId: string,
    actorId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: 'No autenticado' };

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
    if (!currentUser) return { success: false, error: 'Usuario no encontrado' };

    // Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: 'Solo los administradores pueden desactivar colaboradores externos' };
    }

    const { error } = await supabase
        .schema('iam').from('organization_external_actors')
        .update({ is_active: false })
        .eq('id', actorId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error removing external actor:', error);
        return { success: false, error: 'Error al desactivar colaborador' };
    }

    revalidatePath('/organization/team', 'page');
    return { success: true };
}

/**
 * Reactivate an external actor.
 * Validates that the plan has available slots before reactivating.
 */
export async function reactivateExternalActorAction(
    organizationId: string,
    actorId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { success: false, error: 'No autenticado' };

    const { data: currentUser } = await supabase
        .schema('iam').from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
    if (!currentUser) return { success: false, error: 'Usuario no encontrado' };

    // Verify caller is admin
    const { data: callerMember } = await supabase
        .schema('iam').from('organization_members_full_view')
        .select('id, role_type, role_name')
        .eq('organization_id', organizationId)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();

    const isAdmin = callerMember?.role_type === 'admin' || callerMember?.role_name === 'Administrador';
    if (!callerMember || !isAdmin) {
        return { success: false, error: 'Solo los administradores pueden reactivar colaboradores externos' };
    }

    // Check the actor exists and is currently inactive
    const { data: actor } = await supabase
        .schema('iam').from('organization_external_actors')
        .select('id, is_active, actor_type')
        .eq('id', actorId)
        .eq('organization_id', organizationId)
        .single();

    if (!actor) return { success: false, error: 'Colaborador no encontrado' };
    if (actor.is_active) return { success: false, error: 'Este colaborador ya está activo' };

    // Check if it's an advisor type (clients are unlimited)
    if (ADVISOR_ACTOR_TYPES.includes(actor.actor_type as any)) {
        // Validate plan has available slots
        const planFeatures = await getOrganizationPlanFeatures(organizationId);
        const maxAdvisors = planFeatures?.max_external_advisors ?? 0;
        const isUnlimited = maxAdvisors === -1;

        if (!isUnlimited) {
            // Count current active advisors
            const { count: activeAdvisorCount } = await supabase
                .schema('iam').from('organization_external_actors')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .in('actor_type', ADVISOR_ACTOR_TYPES);

            if ((activeAdvisorCount ?? 0) >= maxAdvisors) {
                return {
                    success: false,
                    error: `Alcanzaste el límite de ${maxAdvisors} colaborador${maxAdvisors !== 1 ? 'es' : ''} activo${maxAdvisors !== 1 ? 's' : ''} de tu plan. Desactivá otro colaborador primero o actualizá tu plan.`
                };
            }
        }
    }

    // Reactivate
    const { error } = await supabase
        .schema('iam').from('organization_external_actors')
        .update({ is_active: true })
        .eq('id', actorId)
        .eq('organization_id', organizationId);

    if (error) {
        console.error('Error reactivating external actor:', error);
        return { success: false, error: 'Error al reactivar colaborador' };
    }

    revalidatePath('/organization/team', 'page');
    return { success: true };
}
