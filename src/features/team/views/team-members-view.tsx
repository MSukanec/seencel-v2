"use client";

import { useState, useMemo, useTransition } from "react";
import { OrganizationMemberDetail, OrganizationInvitation, Role } from "@/features/team/types";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MoreVertical, ShieldCheck, User, UserX, Pencil, Crown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModal } from "@/stores/modal-store";
import { InviteMemberForm } from "@/features/team/forms/team-invite-member-form";
import { removeMemberAction, updateMemberRoleAction } from "@/features/team/actions";
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
}

export function TeamMembersView({ organizationId, planId, members, invitations, roles, currentUserId, ownerId }: MembersSettingsViewProps) {
    const { openModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");
    const [removedMemberIds, setRemovedMemberIds] = useState<string[]>([]);
    const [memberToRemove, setMemberToRemove] = useState<OrganizationMemberDetail | null>(null);
    const [memberToEditRole, setMemberToEditRole] = useState<OrganizationMemberDetail | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [isPending, startTransition] = useTransition();

    // Roles that can be assigned (exclude admin/system roles that shouldn't be manually assigned)
    const assignableRoles = useMemo(() => {
        return roles.filter(r => r.type !== 'admin');
    }, [roles]);

    // Filter members by search query AND exclude optimistically removed members
    const filteredMembers = useMemo(() => {
        const activeMembers = members.filter(m => !removedMemberIds.includes(m.id));
        if (!searchQuery.trim()) return activeMembers;
        const query = searchQuery.toLowerCase();
        return activeMembers.filter(m =>
            m.user_full_name?.toLowerCase().includes(query) ||
            m.user_email?.toLowerCase().includes(query) ||
            m.role_name?.toLowerCase().includes(query)
        );
    }, [members, searchQuery, removedMemberIds]);

    // Filter invitations by search query
    const filteredInvitations = useMemo(() => {
        if (!searchQuery.trim()) return invitations;
        const query = searchQuery.toLowerCase();
        return invitations.filter(i => i.email?.toLowerCase().includes(query));
    }, [invitations, searchQuery]);

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

        // Close dialog
        setMemberToEditRole(null);

        startTransition(async () => {
            try {
                const result = await updateMemberRoleAction(organizationId, member.id, selectedRoleId);
                if (!result.success) {
                    toast.error(result.error || "Error al cambiar el rol");
                } else {
                    toast.success(`El rol de ${member.user_full_name || "miembro"} fue cambiado a ${newRoleName}`);
                }
            } catch {
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

    const canRemoveMember = (member: OrganizationMemberDetail) => {
        // Cannot remove yourself
        if (member.user_id === currentUserId) return false;
        // Cannot remove the owner
        if (member.user_id === ownerId) return false;
        // Cannot remove admins
        if (member.role_type === 'admin') return false;
        return true;
    };

    const canEditRole = (member: OrganizationMemberDetail) => {
        // Cannot edit your own role
        if (member.user_id === currentUserId) return false;
        // Cannot edit the owner's role
        if (member.user_id === ownerId) return false;
        // Cannot edit admin roles
        if (member.role_type === 'admin' || member.role_name === 'Administrador') return false;
        return true;
    };

    const isOwner = (member: OrganizationMemberDetail) => member.user_id === ownerId;

    const isCurrentUser = (member: OrganizationMemberDetail) => member.user_id === currentUserId;

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar miembros..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                actions={[
                    {
                        label: "Invitar Miembro",
                        icon: Plus,
                        onClick: handleInvite,
                    },
                ]}
            />

            <ContentLayout variant="narrow">
                <div className="space-y-12 pb-12">
                    {/* Members Section */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">Miembros</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Gestiona los miembros de tu equipo, sus roles y permisos para colaborar en los proyectos.
                            </p>
                        </div>

                        <Card className="border shadow-sm overflow-hidden">
                            <div className="divide-y">
                                {filteredMembers.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        {searchQuery ? "No se encontraron miembros" : "No hay miembros"}
                                    </div>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={member.user_avatar_url || undefined} />
                                                    <AvatarFallback>{member.user_full_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium leading-none">{member.user_full_name || "Usuario"}</p>
                                                        {isCurrentUser(member) && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">Tú</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{member.user_email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {isOwner(member) && (
                                                            <Badge variant="outline" className="font-normal gap-1 border-amber-500/50 text-amber-500 bg-amber-500/10">
                                                                <Crown className="w-3 h-3" />
                                                                Dueño
                                                            </Badge>
                                                        )}
                                                        <Badge variant="outline" className="font-normal capitalize gap-1">
                                                            {member.role_name === 'owner' || member.role_type === 'admin'
                                                                ? <ShieldCheck className="w-3 h-3 text-primary" />
                                                                : <User className="w-3 h-3" />
                                                            }
                                                            {member.role_name || "Miembro"}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Unido el {new Date(member.joined_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {/* Only show menu for non-self, non-admin members */}
                                                {(canEditRole(member) || canRemoveMember(member)) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {canEditRole(member) && (
                                                                <DropdownMenuItem onClick={() => handleEditRole(member)}>
                                                                    <Pencil className="w-4 h-4 mr-2" />
                                                                    Editar Rol
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canEditRole(member) && canRemoveMember(member) && (
                                                                <DropdownMenuSeparator />
                                                            )}
                                                            {canRemoveMember(member) && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setMemberToRemove(member)}
                                                                >
                                                                    <UserX className="w-4 h-4 mr-2" />
                                                                    Eliminar Miembro
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Invitations Section */}
                    {filteredInvitations.length > 0 && (
                        <>
                            <div className="h-px bg-border" />

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Invitaciones Pendientes</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Usuarios que han sido invitados a la organización pero aún no han aceptado.
                                    </p>
                                </div>

                                <Card className="border shadow-sm overflow-hidden bg-muted/20">
                                    <div className="divide-y">
                                        {filteredInvitations.map((invite) => (
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
                                                    <Button variant="outline" size="sm" className="h-8 text-xs">
                                                        Reenviar
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        Revocar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </ContentLayout>

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
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignableRoles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    <div className="flex flex-col">
                                                        <span>{role.name}</span>
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
            </AlertDialog>

            {/* Remove Member Confirmation Dialog */}
            <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
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
        </>
    );
}

