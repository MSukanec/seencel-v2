"use client";

import { AdminUser } from "../queries";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Shield, Mail, CheckCircle, XCircle, Clock, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

interface UsersTableProps {
    users: AdminUser[];
}

export function UsersTable({ users }: UsersTableProps) {
    if (!users || users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p>No se encontraron usuarios.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Última Conexión</TableHead>
                        <TableHead className="w-[300px]">Usuario</TableHead>
                        <TableHead className="text-center">Organizaciones</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const presence = Array.isArray(user.user_presence) ? user.user_presence[0] : user.user_presence;
                        const lastSeen = presence?.last_seen_at ? new Date(presence.last_seen_at) : null;

                        return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {lastSeen && (new Date().getTime() - lastSeen.getTime() < 1000 * 60 * 5) ? (
                                            <div className="flex items-center">
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    Activo ahora
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>
                                                    {lastSeen
                                                        ? formatDistanceToNowStrict(lastSeen, { addSuffix: true, locale: es })
                                                        : "Nunca"
                                                    }
                                                </span>
                                            </div>
                                        )}
                                        {presence?.current_view && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Monitor className="h-3 w-3" />
                                                <span className="truncate max-w-[150px]">{presence.current_view.replace(/_/g, ' ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
                                            <AvatarFallback className="uppercase">
                                                {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium leading-none">
                                                {user.full_name || "Sin nombre"}
                                            </span>
                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate max-w-[180px]">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {user.organization_members[0]?.count || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menú</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                Copiar ID
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                                                Copiar Email
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
