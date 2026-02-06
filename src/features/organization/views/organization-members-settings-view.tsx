"use client";

import { useState, useMemo } from "react";
import { OrganizationMemberDetail, OrganizationInvitation, Role } from "@/types/organization";
import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, MoreVertical, ShieldCheck, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/stores/modal-store";
import { InviteMemberForm } from "@/features/organization/forms/organization-invite-member-form";

interface MembersSettingsViewProps {
    organizationId: string;
    planId: string;
    members: OrganizationMemberDetail[];
    invitations: OrganizationInvitation[];
    roles: Role[];
}

export function MembersSettingsView({ organizationId, planId, members, invitations, roles }: MembersSettingsViewProps) {
    const { openModal } = useModal();
    const [searchQuery, setSearchQuery] = useState("");

    // Filter members by search query
    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const query = searchQuery.toLowerCase();
        return members.filter(m =>
            m.user_full_name?.toLowerCase().includes(query) ||
            m.user_email?.toLowerCase().includes(query) ||
            m.role_name?.toLowerCase().includes(query)
        );
    }, [members, searchQuery]);

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

    return (
        <>
            <Toolbar
                portalToHeader={true}
                searchPlaceholder="Buscar miembros..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            >
                <Button onClick={handleInvite}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invitar Miembro
                </Button>
            </Toolbar>

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
                                                    <p className="text-sm font-medium leading-none">{member.user_full_name || "Usuario"}</p>
                                                    <p className="text-sm text-muted-foreground">{member.user_email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                                                    <Badge variant="outline" className="font-normal capitalize gap-1">
                                                        {member.role_name === 'owner' ? <ShieldCheck className="w-3 h-3 text-primary" /> : <User className="w-3 h-3" />}
                                                        {member.role_name || "Miembro"}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Unido el {new Date(member.joined_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
        </>
    );
}
