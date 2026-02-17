"use client";

import { memo } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, UserX, ShieldCheck, User, Crown, Eye, ToggleLeft, ToggleRight } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface MemberListItemData {
    id: string;
    user_id: string;
    user_full_name: string | null;
    user_email: string | null;
    user_avatar_url: string | null;
    role_id: string;
    role_name: string | null;
    role_type: string | null;
    joined_at: string;
    is_active: boolean;
}

export interface MemberListItemProps {
    /** The member data to display */
    member: MemberListItemData;
    /** Whether this member is the org owner */
    isOwner?: boolean;
    /** Whether this member is the current user */
    isCurrentUser?: boolean;
    /** Whether the current user can edit this member's role */
    canEditRole?: boolean;
    /** Whether the current user can remove this member */
    canRemove?: boolean;
    /** Callback when edit role is clicked */
    onEditRole?: (member: MemberListItemData) => void;
    /** Callback when remove is clicked */
    onRemove?: (member: MemberListItemData) => void;

    // ---- External Actor Props ----
    /** Label for the external actor type (e.g. "Contador", "Cliente") — renders as role badge */
    actorTypeLabel?: string;
    /** Whether this actor is inactive */
    isInactive?: boolean;
    /** Callback to toggle active/inactive state */
    onToggleActive?: () => void;
    /** Callback to preview sidebar as this external actor */
    onViewAs?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string | null): string {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
}

function formatJoinDate(dateStr: string): string {
    return new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    }).format(new Date(dateStr));
}

// ============================================================================
// Component
// ============================================================================

export const MemberListItem = memo(function MemberListItem({
    member,
    isOwner = false,
    isCurrentUser = false,
    canEditRole = false,
    canRemove = false,
    onEditRole,
    onRemove,
    actorTypeLabel,
    isInactive = false,
    onToggleActive,
    onViewAs,
}: MemberListItemProps) {
    const isAdmin = member.role_type === 'admin' || member.role_name === 'Administrador';
    const isExternalActor = !!actorTypeLabel;
    const hasActions = (canEditRole && onEditRole) || (canRemove && onRemove) || onToggleActive || onViewAs;

    return (
        <ListItem variant="card" className={isInactive ? 'opacity-50' : undefined}>
            {/* Avatar */}
            <ListItem.Leading>
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={member.user_avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                        {getInitials(member.user_full_name)}
                    </AvatarFallback>
                </Avatar>
            </ListItem.Leading>

            {/* Name + Email */}
            <ListItem.Content>
                <ListItem.Title>
                    {member.user_full_name || "Usuario"}
                    {isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-2 align-middle">
                            Tú
                        </Badge>
                    )}
                </ListItem.Title>
                <ListItem.Description>
                    {member.user_email}
                </ListItem.Description>
            </ListItem.Content>

            {/* Role + Join date */}
            <ListItem.Trailing className="hidden sm:flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                    {isOwner && (
                        <Badge
                            variant="outline"
                            className="font-normal gap-1 border-amber-500/50 text-amber-500 bg-amber-500/10"
                        >
                            <Crown className="w-3 h-3" />
                            Dueño
                        </Badge>
                    )}
                    {isInactive && (
                        <Badge variant="outline" className="font-normal text-muted-foreground border-muted">
                            Inactivo
                        </Badge>
                    )}
                    <Badge variant="outline" className="font-normal capitalize gap-1">
                        {isExternalActor
                            ? <User className="w-3 h-3 text-blue-500" />
                            : isAdmin
                                ? <ShieldCheck className="w-3 h-3 text-primary" />
                                : <User className="w-3 h-3" />
                        }
                        {actorTypeLabel || member.role_name || "Miembro"}
                    </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                    Unido el {formatJoinDate(member.joined_at)}
                </span>
            </ListItem.Trailing>

            {/* Actions dropdown */}
            {hasActions && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground group-hover:text-foreground"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* View As — external actors only */}
                            {onViewAs && (
                                <DropdownMenuItem onClick={onViewAs}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver como este usuario
                                </DropdownMenuItem>
                            )}
                            {onViewAs && (canEditRole || canRemove || onToggleActive) && (
                                <DropdownMenuSeparator />
                            )}
                            {/* Edit Role — members only */}
                            {canEditRole && onEditRole && (
                                <DropdownMenuItem onClick={() => onEditRole(member)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar Rol
                                </DropdownMenuItem>
                            )}
                            {/* Toggle Active — external actors */}
                            {onToggleActive && (
                                <DropdownMenuItem onClick={onToggleActive}>
                                    {isInactive
                                        ? <><ToggleRight className="w-4 h-4 mr-2 text-green-500" />Activar</>
                                        : <><ToggleLeft className="w-4 h-4 mr-2" />Desactivar</>
                                    }
                                </DropdownMenuItem>
                            )}
                            {/* Separator before destructive actions */}
                            {(canEditRole || onToggleActive) && canRemove && (
                                <DropdownMenuSeparator />
                            )}
                            {/* Remove — members only */}
                            {canRemove && onRemove && (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onRemove(member)}
                                >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Eliminar Miembro
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
