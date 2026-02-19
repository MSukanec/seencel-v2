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
import {
    MoreVertical,
    Pencil,
    UserX,
    UserPen,
    UserCheck,
    Trash2,
    Building2,
    Mail,
    Phone,
    PhoneCall,
    MessageCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal data shape for a project participant (client, collaborator, etc.)
 * This is contact-based, NOT user-based.
 */
export interface ParticipantItemData {
    /** Participant record ID (e.g. project_clients.id) */
    id: string;
    /** Contact full name */
    contact_full_name: string | null;
    /** Contact email */
    contact_email: string | null;
    /** Contact phone */
    contact_phone: string | null;
    /** Contact company name */
    contact_company_name: string | null;
    /** Resolved avatar URL (user avatar > contact image) */
    contact_avatar_url: string | null;
    /** Role label (e.g. "Mandatario", "Propietario") */
    role_name: string | null;
    /** Contact ID for editing the underlying contact */
    contact_id: string | null;
    /** Optional notes */
    notes: string | null;
}

export interface ParticipantListItemProps {
    /** The participant data to display */
    participant: ParticipantItemData;
    /** Whether this participant is inactive (deactivated/unlinked) */
    isInactive?: boolean;
    /** Callback: edit the participant relationship (e.g. change role) */
    onEdit?: (participant: ParticipantItemData) => void;
    /** Callback: edit the underlying contact record */
    onEditContact?: (participant: ParticipantItemData) => void;
    /** Callback: deactivate participant (revoke access, keep as historical) */
    onDeactivate?: (participant: ParticipantItemData) => void;
    /** Callback: delete participant permanently (soft delete) */
    onDelete?: (participant: ParticipantItemData) => void;
    /** Callback: reactivate a previously deactivated participant */
    onReactivate?: (participant: ParticipantItemData) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function formatPhoneForWhatsApp(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
}

// ============================================================================
// Component
// ============================================================================

export const ParticipantListItem = memo(function ParticipantListItem({
    participant,
    isInactive = false,
    onEdit,
    onEditContact,
    onDeactivate,
    onDelete,
    onReactivate,
}: ParticipantListItemProps) {
    const displayName = participant.contact_full_name || "Sin nombre";
    const hasActions = !!onEdit || !!onEditContact || !!onDeactivate || !!onDelete || !!onReactivate;

    return (
        <ListItem variant="card" className={isInactive ? "opacity-60" : undefined}>
            {/* Avatar */}
            <ListItem.Leading>
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={participant.contact_avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="text-xs font-medium">
                        {getInitials(participant.contact_full_name)}
                    </AvatarFallback>
                </Avatar>
            </ListItem.Leading>

            {/* Name + Company */}
            <ListItem.Content>
                <ListItem.Title>
                    {displayName}
                    {participant.role_name && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-2 align-middle">
                            {participant.role_name}
                        </Badge>
                    )}
                    {isInactive && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-2 align-middle text-muted-foreground">
                            Inactivo
                        </Badge>
                    )}
                </ListItem.Title>
                <ListItem.Description>
                    {participant.contact_company_name ? (
                        <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {participant.contact_company_name}
                        </span>
                    ) : (
                        participant.contact_email || participant.notes || null
                    )}
                </ListItem.Description>
            </ListItem.Content>

            {/* Contact details (Trailing) */}
            <ListItem.Trailing className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {participant.contact_email && (
                        <a
                            href={`mailto:${participant.contact_email}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Mail className="h-3 w-3" />
                            <span className="hidden lg:inline max-w-[180px] truncate">
                                {participant.contact_email}
                            </span>
                        </a>
                    )}
                    {participant.contact_phone && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Phone className="h-3 w-3" />
                                    <span className="hidden lg:inline">{participant.contact_phone}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="center">
                                <div className="flex flex-col gap-1">
                                    <a
                                        href={`tel:${participant.contact_phone}`}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                                    >
                                        <PhoneCall className="h-4 w-4 text-blue-500" />
                                        <span>Llamar</span>
                                    </a>
                                    <a
                                        href={`https://wa.me/${formatPhoneForWhatsApp(participant.contact_phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                                    >
                                        <MessageCircle className="h-4 w-4 text-green-500" />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
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
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(participant)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onEditContact && (
                                <DropdownMenuItem onClick={() => onEditContact(participant)}>
                                    <UserPen className="w-4 h-4 mr-2" />
                                    Editar Contacto
                                </DropdownMenuItem>
                            )}
                            {onReactivate && (
                                <DropdownMenuItem onClick={() => onReactivate(participant)}>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Reactivar
                                </DropdownMenuItem>
                            )}
                            {(onEdit || onEditContact || onReactivate) && (onDeactivate || onDelete) && <DropdownMenuSeparator />}
                            {onDeactivate && (
                                <DropdownMenuItem
                                    className="text-amber-600 focus:text-amber-600"
                                    onClick={() => onDeactivate(participant)}
                                >
                                    <UserX className="w-4 h-4 mr-2" />
                                    Desvincular
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(participant)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
