"use client";

import { OrganizationMemberDetail, OrganizationInvitation, Role } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Mail, MoreVertical, ShieldCheck, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MembersTabProps {
    members: OrganizationMemberDetail[];
    invitations: OrganizationInvitation[];
    roles: Role[];
}

export function MembersTab({ members, invitations, roles }: MembersTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Miembros del Equipo</h2>
                    <p className="text-sm text-muted-foreground">Gestiona quién tiene acceso a tu organización.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Invitar Miembro
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-card/50">
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-base font-medium">Miembros Activos ({members.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b">
                                <TableHead className="pl-6">Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Te uniste el</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id} className="group">
                                    <TableCell className="pl-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={member.user_avatar_url || undefined} />
                                                <AvatarFallback>{member.user_full_name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{member.user_full_name || "Usuario Desconocido"}</span>
                                                <span className="text-xs text-muted-foreground">{member.user_email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal capitalize gap-1 pl-1 pr-2">
                                            {member.role_name === 'owner' ? <ShieldCheck className="w-3 h-3 text-primary" /> : <User className="w-3 h-3" />}
                                            {member.role_name || "Miembro"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={member.is_active ? "secondary" : "destructive"}
                                            className={member.is_active ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200" : ""}
                                        >
                                            {member.is_active ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(member.joined_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {invitations.length > 0 && (
                <Card className="border-none shadow-sm bg-card/50">
                    <CardHeader className="px-6 py-4 border-b">
                        <CardTitle className="text-base font-medium">Invitaciones Pendientes ({invitations.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b">
                                    <TableHead className="pl-6">Email</TableHead>
                                    <TableHead>Rol Invitado</TableHead>
                                    <TableHead>Enviado el</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invite) => (
                                    <TableRow key={invite.id}>
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="text-sm">{invite.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{roles.find(r => r.id === invite.role_id)?.name || "Rol"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(invite.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" className="text-destructive h-8">
                                                Cancelar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
