"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { AdminUser } from "../queries";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Monitor, Mail } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

interface UsersTableProps {
    users: AdminUser[];
}

export function UsersTable({ users }: UsersTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Multi-field filtering: name, email, id, auth_id
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const query = searchQuery.toLowerCase().trim();
        return users.filter((user) => {
            const fullName = (user.full_name || "").toLowerCase();
            const email = user.email.toLowerCase();
            const id = user.id.toLowerCase();
            const authId = (user.auth_id || "").toLowerCase();
            return (
                fullName.includes(query) ||
                email.includes(query) ||
                id.includes(query) ||
                authId.includes(query)
            );
        });
    }, [users, searchQuery]);

    const columns: ColumnDef<AdminUser>[] = [
        {
            id: "presence",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Última Conexión" />,
            accessorFn: (row) => {
                const presence = Array.isArray(row.user_presence) ? row.user_presence[0] : row.user_presence;
                return presence?.last_seen_at || null;
            },
            cell: ({ row }) => {
                const user = row.original;
                const presence = Array.isArray(user.user_presence) ? user.user_presence[0] : user.user_presence;
                const lastSeen = presence?.last_seen_at ? new Date(presence.last_seen_at) : null;
                const isActive = lastSeen && (new Date().getTime() - lastSeen.getTime() < 1000 * 60 * 5);

                return (
                    <div className="flex flex-col gap-1">
                        {isActive ? (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none gap-1.5 pl-1.5 pr-2.5 h-6 w-fit">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Activo ahora
                            </Badge>
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
                );
            },
        },
        {
            accessorKey: "full_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <Link href={{ pathname: "/admin/directory/[userId]", params: { userId: user.id } }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || ""} alt={user.full_name || user.email} />
                            <AvatarFallback className="uppercase">
                                {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium leading-none underline-offset-4 hover:underline">
                                {user.full_name || "Sin nombre"}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[180px]">{user.email}</span>
                            </div>
                        </div>
                    </Link>
                );
            },
            enableHiding: false,
        },
        {
            id: "organizations",
            header: "Organizaciones",
            cell: ({ row }) => (
                <Badge variant="secondary" className="font-mono text-xs">
                    {row.original.organization_members[0]?.count || 0}
                </Badge>
            ),
        },
    ];

    return (
        <>
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar por nombre, email, ID o Auth ID..."
            />
            <DataTable
                columns={columns}
                data={filteredUsers}
                pageSize={25}
                enableRowActions={true}
                customActions={[
                    {
                        label: "Copiar ID",
                        onClick: (user) => navigator.clipboard.writeText(user.id),
                    },
                    {
                        label: "Copiar Auth ID",
                        onClick: (user) => navigator.clipboard.writeText(user.auth_id),
                    },
                    {
                        label: "Copiar Email",
                        onClick: (user) => navigator.clipboard.writeText(user.email),
                    },
                ]}
            />
        </>
    );
}
