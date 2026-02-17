"use client";

import { useState, useMemo, useTransition } from "react";
import { OrganizationMemberDetail, OrganizationInvitation, Role } from "@/features/team/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Users, UserPlus, Wrench, BookOpen, UserCheck, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/stores/modal-store";
import { InviteMemberForm } from "@/features/team/forms/team-invite-member-form";
import { removeMemberAction, updateMemberRoleAction, revokeInvitationAction, resendInvitationAction, removeExternalActorAction, reactivateExternalActorAction } from "@/features/team/actions";
import { SeatStatus, ExternalActorDetail, EXTERNAL_ACTOR_TYPE_LABELS, CLIENT_ACTOR_TYPES, ADVISOR_ACTOR_TYPES } from "@/features/team/types";
import { useAccessContextStore } from "@/stores/access-context-store";
import type { ExternalActorType } from "@/features/external-actors/types";

import { MemberListItem } from "@/components/shared/list-item";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { SettingsSection } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout";
import { toast } from "sonner";
import { AddExternalCollaboratorForm } from "@/features/team/forms/team-add-external-form";
import { AddClientForm } from "@/features/team/forms/team-add-client-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MembersSettingsViewProps {
    organizationId: string;
    planId: string;
    members: OrganizationMemberDetail[];
    invitations: OrganizationInvitation[];
    roles: Role[];
    currentUserId: string;
    ownerId: string | null;
    canInviteMembers: boolean;
    initialSeatStatus: SeatStatus | null;
    externalActors: ExternalActorDetail[];
    /** Max external advisors allowed by plan (-1 = unlimited) */
    maxExternalAdvisors: number;
}

export function TeamMembersView({ organizationId, planId, members, invitations, roles, currentUserId, ownerId, canInviteMembers, initialSeatStatus, externalActors, maxExternalAdvisors }: MembersSettingsViewProps) {
    const { openModal } = useModal();
    const [removedMemberIds, setRemovedMemberIds] = useState<string[]>([]);
    const [removedInvitationIds, setRemovedInvitationIds] = useState<string[]>([]);
    const [roleOverrides, setRoleOverrides] = useState<Record<string, { roleId: string; roleName: string }>>();
    const [memberToRemove, setMemberToRemove] = useState<OrganizationMemberDetail | null>(null);
    const [memberToEditRole, setMemberToEditRole] = useState<OrganizationMemberDetail | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const [seatStatus, setSeatStatus] = useState<SeatStatus | null>(initialSeatStatus);

    // Roles that can be assigned (exclude admin/system roles that shouldn't be manually assigned)
    // Only show roles that belong to THIS organization (not system-level roles)
    const assignableRoles = useMemo(() => {
        return roles.filter(r => r.type !== 'admin' && r.organization_id === organizationId);
    }, [roles, organizationId]);

    // Filter members excluding optimistically removed, sorted alphabetically
    const filteredMembers = useMemo(() => {
        return members
            .filter(m => !removedMemberIds.includes(m.id))
            .sort((a, b) => (a.user_full_name || "").localeCompare(b.user_full_name || ""));
    }, [members, removedMemberIds]);

    // Active invitations (excludes optimistically revoked)
    const activeInvitations = useMemo(() =>
        invitations.filter(inv => !removedInvitationIds.includes(inv.id)),
        [invitations, removedInvitationIds]
    );

    // Split invitations: member vs external
    const memberInvitations = useMemo(() =>
        activeInvitations.filter(inv => (inv as any).invitation_type !== 'external'),
        [activeInvitations]
    );
    const clientInvitations = useMemo(() =>
        activeInvitations.filter(inv => (inv as any).invitation_type === 'external' && (inv as any).actor_type === 'client'),
        [activeInvitations]
    );
    const advisorInvitations = useMemo(() =>
        activeInvitations.filter(inv => (inv as any).invitation_type === 'external' && (inv as any).actor_type !== 'client'),
        [activeInvitations]
    );

    // External actors split
    const clientActors = useMemo(() =>
        externalActors.filter(a => CLIENT_ACTOR_TYPES.includes(a.actor_type as any)),
        [externalActors]
    );
    const advisorActors = useMemo(() =>
        externalActors.filter(a => ADVISOR_ACTOR_TYPES.includes(a.actor_type as any)),
        [externalActors]
    );

    // Advisor capacity: count only ACTIVE advisors (not all)
    const activeAdvisorCount = advisorActors.filter(a => a.is_active).length;
    const advisorCount = activeAdvisorCount + advisorInvitations.length;
    const isAdvisorUnlimited = maxExternalAdvisors === -1;
    const canAddAdvisor = isAdvisorUnlimited || advisorCount < maxExternalAdvisors;

    // External sections: locked for non-owners ("Próximamente")
    // Owner sees the same locked UI but can still interact
    const isCurrentUserOwner = currentUserId === ownerId;

    // "View as" handler — sets viewingAs state in access-context-store
    const handleViewAs = (actor: ExternalActorDetail) => {
        useAccessContextStore.getState().setViewingAs({
            userId: actor.user_id,
            userName: actor.user_full_name || actor.user_email || 'Usuario',
            actorType: actor.actor_type as ExternalActorType,
        });
        toast.info(`Ahora estás viendo como: ${actor.user_full_name || actor.user_email}`);
    };

    const handleInvite = () => {
        openModal(
            <InviteMemberForm
                organizationId={organizationId}
                planId={planId}
                roles={roles}
            />,
            {
                title: "Invitar Miembro",
                description: "Invita a nuevos miembros a tu organización para colaborar en proyectos.",
                size: "md"
            }
        );
    };

    const handleEditRole = (member: OrganizationMemberDetail) => {
        setMemberToEditRole(member);
        setSelectedRoleId(member.role_id || "");
    };

    const handleConfirmRoleChange = () => {
        if (!memberToEditRole || !selectedRoleId) return;

        const member = memberToEditRole;
        const newRoleName = roles.find(r => r.id === selectedRoleId)?.name || "Rol";
        const previousRoleId = member.role_id;
        const previousRoleName = member.role_name;
        const newRoleId = selectedRoleId;

        // Optimistic: update role in UI immediately
        setRoleOverrides(prev => ({
            ...prev,
            [member.id]: { roleId: newRoleId, roleName: newRoleName },
        }));

        // Close dialog
        setMemberToEditRole(null);

        startTransition(async () => {
            try {
                const result = await updateMemberRoleAction(organizationId, member.id, newRoleId);
                if (!result.success) {
                    // Rollback
                    setRoleOverrides(prev => {
                        const next = { ...prev };
                        delete next[member.id];
                        return next;
                    });
                    toast.error(result.error || "Error al cambiar el rol");
                } else {
                    toast.success(`El rol de ${member.user_full_name || "miembro"} fue cambiado a ${newRoleName}`);
                }
            } catch {
                // Rollback
                setRoleOverrides(prev => {
                    const next = { ...prev };
                    delete next[member.id];
                    return next;
                });
                toast.error("Error inesperado al cambiar el rol");
            }
        });
    };

    const handleRemoveMember = (member: OrganizationMemberDetail) => {
        // Optimistic: remove from UI immediately
        setRemovedMemberIds(prev => [...prev, member.id]);
        setMemberToRemove(null);

        startTransition(async () => {
            try {
                const result = await removeMemberAction(organizationId, member.id);
                if (!result.success) {
                    // Rollback
                    setRemovedMemberIds(prev => prev.filter(id => id !== member.id));
                    toast.error(result.error || "Error al eliminar miembro");
                } else {
                    toast.success(`${member.user_full_name || "Miembro"} fue eliminado de la organización`);
                }
            } catch {
                // Rollback
                setRemovedMemberIds(prev => prev.filter(id => id !== member.id));
                toast.error("Error inesperado al eliminar miembro");
            }
        });
    };

    const currentUserIsOwner = currentUserId === ownerId;

    const canRemoveMember = (member: OrganizationMemberDetail) => {
        // Cannot remove yourself
        if (member.user_id === currentUserId) return false;
        // Cannot remove the owner
        if (member.user_id === ownerId) return false;
        // Owner can remove anyone (including admins)
        if (currentUserIsOwner) return true;
        // Non-owner admins cannot remove other admins
        if (member.role_type === 'admin') return false;
        return true;
    };

    const canEditRole = (member: OrganizationMemberDetail) => {
        // Cannot edit your own role
        if (member.user_id === currentUserId) return false;
        // Cannot edit the owner's role
        if (member.user_id === ownerId) return false;
        // Owner can edit anyone's role (including admins)
        if (currentUserIsOwner) return true;
        // Non-owner admins cannot edit other admin roles
        if (member.role_type === 'admin' || member.role_name === 'Administrador') return false;
        return true;
    };

    const isOwner = (member: OrganizationMemberDetail) => member.user_id === ownerId;

    const isCurrentUser = (member: OrganizationMemberDetail) => member.user_id === currentUserId;

    return (
        <ContentLayout variant="wide">
            <div className="space-y-12 pb-12">
                {/* Members Section */}
                <SettingsSection
                    icon={Users}
                    title="Miembros de la Organización"
                    description={
                        <>
                            <span>Personas con acceso completo a la organización. Cada miembro ocupa un asiento del plan e incluye roles, permisos y acceso a todos los proyectos según su nivel.</span>
                            {seatStatus && (
                                <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted px-2.5 py-1 rounded-full">
                                    <Users className="h-3 w-3" />
                                    {filteredMembers.length} / {seatStatus.total_capacity} asientos
                                </span>
                            )}
                        </>
                    }
                    actions={[
                        {
                            label: "Invitar Miembro",
                            icon: UserPlus,
                            onClick: handleInvite,
                            featureGuard: {
                                isEnabled: canInviteMembers,
                                featureName: "Invitar Miembros",
                                requiredPlan: "TEAMS",
                            },
                        },
                        {
                            label: "Documentación",
                            icon: BookOpen,
                            variant: "secondary",
                            href: "/docs/equipo/miembros",
                        },
                    ]}
                >
                    <div className="space-y-2">
                        {filteredMembers.length === 0 ? (
                            <ViewEmptyState
                                mode="empty"
                                icon={Users}
                                viewName="Miembros"
                                featureDescription="Los miembros son las personas que forman parte de tu organización con acceso a proyectos y recursos."
                                onAction={canInviteMembers ? handleInvite : undefined}
                                actionLabel="Invitar Miembro"
                            />
                        ) : (
                            filteredMembers.map((member) => {
                                // Apply optimistic role override if exists
                                const override = roleOverrides?.[member.id];
                                const displayMember = override
                                    ? { ...member, role_id: override.roleId, role_name: override.roleName }
                                    : member;
                                return (
                                    <MemberListItem
                                        key={member.id}
                                        member={displayMember}
                                        isOwner={member.user_id === ownerId}
                                        isCurrentUser={member.user_id === currentUserId}
                                        canEditRole={canEditRole(member)}
                                        canRemove={canRemoveMember(member)}
                                        onEditRole={(m) => handleEditRole(m as unknown as OrganizationMemberDetail)}
                                        onRemove={(m) => setMemberToRemove(m as unknown as OrganizationMemberDetail)}
                                    />
                                );
                            })
                        )}
                    </div>
                </SettingsSection>

                {/* Pending Member Invitations Section */}
                {memberInvitations.length > 0 && (
                    <SettingsSection
                        icon={Mail}
                        title="Invitaciones Pendientes"
                        description="Usuarios que han sido invitados a unirse a la organización pero aún no han aceptado. Cada invitación ocupa un asiento temporalmente."
                    >
                        <Card className="border shadow-sm overflow-hidden bg-muted/20">
                            <div className="divide-y">
                                {memberInvitations.map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between p-4 px-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{invite.email}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                        {roles.find(r => r.id === invite.role_id)?.name || "Rol"}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Enviado el {new Date(invite.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                disabled={isPending}
                                                onClick={() => {
                                                    startTransition(async () => {
                                                        const result = await resendInvitationAction(organizationId, invite.id);
                                                        if (result.success) {
                                                            toast.success("Invitación reenviada correctamente");
                                                        } else {
                                                            toast.error(result.error || "Error al reenviar");
                                                        }
                                                    });
                                                }}
                                            >
                                                Reenviar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={isPending}
                                                onClick={() => {
                                                    // Optimistic: remove invitation immediately
                                                    const inviteId = invite.id;
                                                    setRemovedInvitationIds(prev => [...prev, inviteId]);

                                                    startTransition(async () => {
                                                        const result = await revokeInvitationAction(organizationId, inviteId);
                                                        if (result.success) {
                                                            toast.success("Invitación revocada");
                                                        } else {
                                                            // Rollback
                                                            setRemovedInvitationIds(prev => prev.filter(id => id !== inviteId));
                                                            toast.error(result.error || "Error al revocar");
                                                        }
                                                    });
                                                }}
                                            >
                                                Revocar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </SettingsSection>
                )}

                {/* ===== CLIENTS SECTION ===== */}
                <SettingsSection
                    icon={Users}
                    title="Clientes"
                    description={
                        <>
                            <span>Tus clientes pueden seguir el avance de sus obras, ver documentos y consultar estados de cuenta desde su propio portal.</span>
                            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted px-2.5 py-1 rounded-full">
                                <Users className="h-3 w-3" />
                                {clientActors.length} clientes · Ilimitados
                            </span>
                        </>
                    }
                    actions={[
                        {
                            label: "Agregar Cliente",
                            icon: UserPlus,
                            onClick: () => {
                                openModal(
                                    <AddClientForm organizationId={organizationId} />,
                                    {
                                        title: "Agregar Cliente",
                                        description: "Agregá un cliente para que pueda acceder al portal de su obra.",
                                        size: "md"
                                    }
                                );
                            },
                        },
                        {
                            label: "Documentación",
                            icon: BookOpen,
                            variant: "secondary",
                            href: "/docs/equipo/clientes",
                        },
                    ]}
                >
                    {(() => {

                        return (
                            <>
                                {clientActors.length === 0 && clientInvitations.length === 0 ? (
                                    <ViewEmptyState
                                        mode="empty"
                                        icon={Users}
                                        viewName="Clientes"
                                        featureDescription="Invitá a tus clientes para que sigan el avance de sus obras, vean documentos y consulten estados de cuenta desde su propio portal. Los clientes son ilimitados y no ocupan asientos del plan."
                                        onAction={() => {
                                            openModal(
                                                <AddClientForm organizationId={organizationId} />,
                                                {
                                                    title: "Agregar Cliente",
                                                    description: "Agregá un cliente para que pueda acceder al portal de su obra.",
                                                    size: "md"
                                                }
                                            );
                                        }}
                                        actionLabel="Agregar Cliente"
                                        docsPath="/docs/equipo/clientes"
                                    />
                                ) : (
                                    <>
                                        {clientActors.length > 0 && (
                                            <div className="space-y-2">
                                                {clientActors.map((actor) => (
                                                    <MemberListItem
                                                        key={actor.id}
                                                        member={{
                                                            id: actor.id,
                                                            user_id: actor.user_id,
                                                            user_full_name: actor.user_full_name,
                                                            user_email: actor.user_email,
                                                            user_avatar_url: actor.user_avatar_url,
                                                            role_id: '',
                                                            role_name: null,
                                                            role_type: null,
                                                            joined_at: actor.created_at,
                                                            is_active: actor.is_active,
                                                        }}
                                                        actorTypeLabel={EXTERNAL_ACTOR_TYPE_LABELS[actor.actor_type]?.label || 'Cliente'}
                                                        isInactive={!actor.is_active}
                                                        onViewAs={() => handleViewAs(actor)}
                                                        onToggleActive={() => {
                                                            startTransition(async () => {
                                                                const result = await removeExternalActorAction(organizationId, actor.id);
                                                                if (result.success) {
                                                                    toast.success(`${actor.user_full_name || 'Cliente'} fue desactivado`);
                                                                } else {
                                                                    toast.error(result.error || "Error al desactivar");
                                                                }
                                                            });
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {clientInvitations.length > 0 && (
                                            <div className={clientActors.length > 0 ? "mt-4" : ""}>
                                                <p className="text-xs font-medium text-muted-foreground mb-2">Invitaciones pendientes</p>
                                                <Card className="border shadow-sm overflow-hidden bg-muted/10">
                                                    <div className="divide-y">
                                                        {clientInvitations.map((invite) => (
                                                            <div key={invite.id} className="flex items-center justify-between p-4 px-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground">
                                                                        <Mail className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm font-medium leading-none">{invite.email}</p>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            Enviado el {new Date(invite.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    disabled={isPending}
                                                                    onClick={() => {
                                                                        const inviteId = invite.id;
                                                                        setRemovedInvitationIds(prev => [...prev, inviteId]);
                                                                        startTransition(async () => {
                                                                            const result = await revokeInvitationAction(organizationId, inviteId);
                                                                            if (result.success) {
                                                                                toast.success("Invitación revocada");
                                                                            } else {
                                                                                setRemovedInvitationIds(prev => prev.filter(id => id !== inviteId));
                                                                                toast.error(result.error || "Error al revocar");
                                                                            }
                                                                        });
                                                                    }}
                                                                >
                                                                    Revocar
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        );
                    })()}
                </SettingsSection>

                {/* ===== COLLABORATORS/ADVISORS SECTION ===== */}
                <div className="relative">
                    {/* Locked overlay — visual for all, interactive only for owner */}
                    <div className={`absolute -top-1 -right-1 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/80 border border-border/50 shadow-sm backdrop-blur-sm`}>
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground">Próximamente</span>
                    </div>
                    <div className={!isCurrentUserOwner ? 'pointer-events-none opacity-50' : 'opacity-75'}>
                        <SettingsSection
                            icon={Wrench}
                            title="Colaboradores"
                            description={
                                <>
                                    <span>Personas que asesoran o participan en tus proyectos: contadores, directores de obra, subcontratistas, etc. No ocupan asientos del plan.</span>
                                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted px-2.5 py-1 rounded-full">
                                        <Wrench className="h-3 w-3" />
                                        {advisorCount}{isAdvisorUnlimited ? '' : ` / ${maxExternalAdvisors}`} colaboradores{isAdvisorUnlimited ? ' · Ilimitados' : ''}
                                    </span>
                                </>
                            }
                            actions={[
                                {
                                    label: "Agregar Colaborador",
                                    icon: UserCheck,
                                    onClick: () => {
                                        openModal(
                                            <AddExternalCollaboratorForm organizationId={organizationId} />,
                                            {
                                                title: "Agregar Colaborador",
                                                description: "Agregá asesores y colaboradores profesionales a tu organización.",
                                                size: "md"
                                            }
                                        );
                                    },
                                    featureGuard: {
                                        isEnabled: canAddAdvisor,
                                        featureName: "Agregar más colaboradores",
                                        requiredPlan: "PRO",
                                        customMessage: isAdvisorUnlimited
                                            ? undefined
                                            : `Alcanzaste el límite de ${maxExternalAdvisors} colaborador${maxExternalAdvisors !== 1 ? 'es' : ''} activo${maxExternalAdvisors !== 1 ? 's' : ''} de tu plan actual (${advisorCount}/${maxExternalAdvisors}). Desactivá un colaborador para liberar un lugar o actualizá tu plan.`,
                                    },
                                },
                                {
                                    label: "Documentación",
                                    icon: BookOpen,
                                    variant: "secondary",
                                    href: "/docs/equipo/colaboradores",
                                },
                            ]}
                        >
                            {(() => {
                                return (
                                    <>
                                        {advisorActors.length === 0 && advisorInvitations.length === 0 ? (
                                            <ViewEmptyState
                                                mode="empty"
                                                icon={Wrench}
                                                viewName="Colaboradores"
                                                featureDescription="Los colaboradores son profesionales que participan en tus proyectos: contadores, directores de obra, subcontratistas, etc. No ocupan asientos del plan."
                                                onAction={() => {
                                                    openModal(
                                                        <AddExternalCollaboratorForm organizationId={organizationId} />,
                                                        {
                                                            title: "Agregar Colaborador",
                                                            description: "Agregá asesores y colaboradores profesionales a tu organización.",
                                                            size: "md"
                                                        }
                                                    );
                                                }}
                                                actionLabel="Agregar Colaborador"
                                                docsPath="/docs/equipo/colaboradores"
                                            />
                                        ) : (
                                            <>
                                                {advisorActors.length > 0 && (
                                                    <div className="space-y-2">
                                                        {advisorActors.map((actor) => (
                                                            <MemberListItem
                                                                key={actor.id}
                                                                member={{
                                                                    id: actor.id,
                                                                    user_id: actor.user_id,
                                                                    user_full_name: actor.user_full_name,
                                                                    user_email: actor.user_email,
                                                                    user_avatar_url: actor.user_avatar_url,
                                                                    role_id: '',
                                                                    role_name: null,
                                                                    role_type: null,
                                                                    joined_at: actor.created_at,
                                                                    is_active: actor.is_active,
                                                                }}
                                                                actorTypeLabel={EXTERNAL_ACTOR_TYPE_LABELS[actor.actor_type]?.label || actor.actor_type}
                                                                isInactive={!actor.is_active}
                                                                onViewAs={() => handleViewAs(actor)}
                                                                onToggleActive={() => {
                                                                    if (actor.is_active) {
                                                                        startTransition(async () => {
                                                                            const result = await removeExternalActorAction(organizationId, actor.id);
                                                                            if (result.success) {
                                                                                toast.success(`${actor.user_full_name || 'Colaborador'} fue desactivado`);
                                                                            } else {
                                                                                toast.error(result.error || "Error al desactivar");
                                                                            }
                                                                        });
                                                                    } else {
                                                                        startTransition(async () => {
                                                                            const result = await reactivateExternalActorAction(organizationId, actor.id);
                                                                            if (result.success) {
                                                                                toast.success(`${actor.user_full_name || 'Colaborador'} fue reactivado`);
                                                                            } else {
                                                                                toast.error(result.error || "Error al reactivar");
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}

                                                {advisorInvitations.length > 0 && (
                                                    <div className={advisorActors.length > 0 ? "mt-4" : ""}>
                                                        <p className="text-xs font-medium text-muted-foreground mb-2">Invitaciones pendientes</p>
                                                        <Card className="border shadow-sm overflow-hidden bg-muted/10">
                                                            <div className="divide-y">
                                                                {advisorInvitations.map((invite) => (
                                                                    <div key={invite.id} className="flex items-center justify-between p-4 px-5">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground">
                                                                                <Mail className="w-5 h-5" />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <p className="text-sm font-medium leading-none">{invite.email}</p>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                                                        {EXTERNAL_ACTOR_TYPE_LABELS[(invite as any).actor_type]?.label || 'Colaborador'}
                                                                                    </Badge>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        Enviado el {new Date(invite.created_at).toLocaleDateString()}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                            disabled={isPending}
                                                                            onClick={() => {
                                                                                const inviteId = invite.id;
                                                                                setRemovedInvitationIds(prev => [...prev, inviteId]);
                                                                                startTransition(async () => {
                                                                                    const result = await revokeInvitationAction(organizationId, inviteId);
                                                                                    if (result.success) {
                                                                                        toast.success("Invitación revocada");
                                                                                    } else {
                                                                                        setRemovedInvitationIds(prev => prev.filter(id => id !== inviteId));
                                                                                        toast.error(result.error || "Error al revocar");
                                                                                    }
                                                                                });
                                                                            }}
                                                                        >
                                                                            Revocar
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Card>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                );
                            })()}
                        </SettingsSection>
                    </div>
                </div>

                {/* Edit Role Dialog */}
                <AlertDialog open={!!memberToEditRole} onOpenChange={(open) => !open && setMemberToEditRole(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cambiar rol de {memberToEditRole?.user_full_name || "miembro"}</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-4">
                                    <p>
                                        Seleccioná el nuevo rol para <strong className="text-foreground">{memberToEditRole?.user_full_name}</strong>.
                                        Los permisos se actualizarán inmediatamente.
                                    </p>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Rol</label>
                                        <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                            <SelectTrigger className="text-left">
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assignableRoles.map((role) => (
                                                    <SelectItem key={role.id} value={role.id} className="py-2">
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-medium">{role.name}</span>
                                                            {role.description && (
                                                                <span className="text-xs text-muted-foreground">{role.description}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmRoleChange}
                                disabled={isPending || !selectedRoleId || selectedRoleId === memberToEditRole?.role_id}
                            >
                                {isPending ? "Guardando..." : "Cambiar rol"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog >

                {/* Remove Member Confirmation Dialog */}
                < AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar a {memberToRemove?.user_full_name || "este miembro"}</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-3">
                                    <p>
                                        Al eliminar a <strong className="text-foreground">{memberToRemove?.user_full_name || "este miembro"}</strong>,
                                        perderá acceso inmediato a la organización y a todos sus proyectos.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">✓</span>
                                            <span>Todo su trabajo (tareas, documentos, registros) <strong className="text-foreground">se conserva</strong> intacto.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">✓</span>
                                            <span>Podés <strong className="text-foreground">volver a invitarlo en cualquier momento</strong>, sin esperas ni restricciones.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-0.5">✓</span>
                                            <span>Su asiento se libera y queda disponible para otro miembro.</span>
                                        </li>
                                    </ul>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
                                disabled={isPending}
                            >
                                {isPending ? "Eliminando..." : "Eliminar miembro"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </ContentLayout>
    );
}

