"use client";

import { useState, useMemo, useTransition } from "react";
import { OrganizationMemberDetail, OrganizationInvitation, Role } from "@/features/team/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Users, UserPlus, CreditCard, Wrench, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/stores/modal-store";
import { InviteMemberForm } from "@/features/team/forms/team-invite-member-form";
import { removeMemberAction, updateMemberRoleAction, revokeInvitationAction, resendInvitationAction } from "@/features/team/actions";
import { SeatStatus } from "@/features/team/types";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { MemberListItem } from "@/components/shared/list-item";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { SettingsSection } from "@/components/shared/settings-section";
import { ContentLayout } from "@/components/layout";
import { toast } from "sonner";
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
}

export function TeamMembersView({ organizationId, planId, members, invitations, roles, currentUserId, ownerId, canInviteMembers, initialSeatStatus }: MembersSettingsViewProps) {
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

    // Optimistic KPI values derived from filteredMembers (already excludes removed members)
    const optimisticUsed = filteredMembers.length;
    const optimisticAvailable = seatStatus
        ? seatStatus.total_capacity - optimisticUsed - seatStatus.pending_invitations
        : 0;

    return (
        <ContentLayout variant="wide">
            <div className="space-y-12 pb-12">
                {/* KPIs Section */}
                {seatStatus && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DashboardKpiCard
                            title="Miembros Activos"
                            value={`${optimisticUsed} / ${seatStatus.total_capacity}`}
                            icon={<Users className="w-4 h-4" />}
                            description="Asientos ocupados"
                            size="default"
                        />
                        <DashboardKpiCard
                            title="Disponibles"
                            value={Math.max(0, optimisticAvailable)}
                            icon={<UserPlus className="w-4 h-4" />}
                            description="Para invitar"
                            size="default"
                        />
                        <DashboardKpiCard
                            title="Invitaciones"
                            value={seatStatus.pending_invitations}
                            icon={<Mail className="w-4 h-4" />}
                            description="Pendientes"
                            size="default"
                        />
                        <DashboardKpiCard
                            title="Comprados"
                            value={seatStatus.purchased}
                            icon={<CreditCard className="w-4 h-4" />}
                            description="Asientos extra"
                            size="default"
                        />
                    </div>
                )}

                {/* Members Section */}
                <SettingsSection
                    icon={Users}
                    title="Miembros de la Organización"
                    description="Personas con acceso completo a la organización. Cada miembro ocupa un asiento del plan e incluye roles, permisos y acceso a todos los proyectos según su nivel."
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

                {/* Pending Invitations Section */}
                {activeInvitations.length > 0 && (
                    <SettingsSection
                        icon={Mail}
                        title="Invitaciones Pendientes"
                        description="Usuarios que han sido invitados a unirse a la organización pero aún no han aceptado. Cada invitación ocupa un asiento temporalmente."
                    >
                        <Card className="border shadow-sm overflow-hidden bg-muted/20">
                            <div className="divide-y">
                                {activeInvitations.map((invite) => (
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

                {/* External Users Section */}
                <SettingsSection
                    icon={Wrench}
                    title="Usuarios Externos"
                    description="Colaboradores que no son parte de tu equipo pero participan en proyectos específicos: contadores, albañiles, subcontratistas, proveedores, etc. No ocupan asientos del plan."
                    actions={[
                        {
                            label: "Documentación",
                            icon: BookOpen,
                            variant: "secondary",
                            href: "/docs/equipo/usuarios-externos",
                        },
                    ]}
                >
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Próximamente podrás invitar usuarios externos a proyectos específicos.
                    </div>
                </SettingsSection>
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
        </ContentLayout>
    );
}

