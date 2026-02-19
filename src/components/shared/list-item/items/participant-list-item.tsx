"use client";

import { memo } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
    RefreshCw,
    ShieldX,
    Clock,
    BadgeCheck,
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
    /** Invitation status (from iam.organization_invitations via view) */
    invitation_status?: string | null;
    /** When the invitation was created (for display) */
    invitation_sent_at?: string | null;
    /** Linked Seencel user ID — if set, this contact is a real Seencel user */
    linked_user_id?: string | null;
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
    /** Callback: resend invitation email (only shown when invitation_status === "pending") */
    onResendInvitation?: (participant: ParticipantItemData) => void;
    /** Callback: revoke invitation (only shown when invitation_status === "pending") */
    onRevokeInvitation?: (participant: ParticipantItemData) => void;
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
// Pending Invitation Row (style matching team invitations)
// ============================================================================

function PendingInvitationRow({
    participant,
    onResendInvitation,
    onRevokeInvitation,
}: {
    participant: ParticipantItemData;
    onResendInvitation?: (p: ParticipantItemData) => void;
    onRevokeInvitation?: (p: ParticipantItemData) => void;
}) {
    const sentDate = participant.invitation_sent_at
        ? new Date(participant.invitation_sent_at).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
        : null;

    return (
        <Card className="border shadow-sm overflow-hidden bg-muted/20">
            <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4">
                    {/* Left: Icon + info */}
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-background border flex items-center justify-center text-muted-foreground shrink-0">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {participant.contact_full_name || participant.contact_email}
                            </p>
                            <div className="flex items-center gap-2">
                                {participant.role_name && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                        {participant.role_name}
                                    </Badge>
                                )}
                                <Badge
                                    variant="outline"
                                    className="text-[10px] h-5 px-1.5 font-normal text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400 gap-1"
                                >
                                    <Clock className="h-2.5 w-2.5" />
                                    Invitación pendiente
                                </Badge>
                                {sentDate && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        Enviado el {sentDate}
                                    </span>
                                )}
                            </div>
                            {participant.contact_email && participant.contact_full_name && (
                                <p className="text-xs text-muted-foreground">{participant.contact_email}</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    {(onResendInvitation || onRevokeInvitation) && (
                        <div className="flex items-center gap-2 shrink-0">
                            {onResendInvitation && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => onResendInvitation(participant)}
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Reenviar
                                </Button>
                            )}
                            {onRevokeInvitation && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                    onClick={() => onRevokeInvitation(participant)}
                                >
                                    <ShieldX className="h-3 w-3" />
                                    Revocar
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export const ParticipantListItem = memo(function ParticipantListItem({
    participant,
    isInactive = false,
    onEdit,
    onEditContact,
    onDeactivate,
    onDelete,
    onReactivate,
    onResendInvitation,
    onRevokeInvitation,
}: ParticipantListItemProps) {
    const isPendingInvitation = participant.invitation_status === "pending";
    const isSeencelUser = !!participant.linked_user_id;

    // Render invitation-style row for pending clients
    if (isPendingInvitation) {
        return (
            <PendingInvitationRow
                participant={participant}
                onResendInvitation={onResendInvitation}
                onRevokeInvitation={onRevokeInvitation}
            />
        );
    }

    // Normal participant row
    const displayName = participant.contact_full_name || "Sin nombre";
    const hasActions = !!onEdit || !!onEditContact || !!onDeactivate || !!onDelete || !!onReactivate;

    return (
        <ListItem variant="card" className={isInactive ? "opacity-60" : undefined}>
            {/* Avatar with Seencel user indicator */}
            <ListItem.Leading>
                <div className="relative">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={participant.contact_avatar_url || undefined} alt={displayName} />
                        <AvatarFallback className="text-xs font-medium">
                            {getInitials(participant.contact_full_name)}
                        </AvatarFallback>
                    </Avatar>
                    {isSeencelUser && (
                        <div
                            className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-px ring-1 ring-background"
                            title="Usuario activo en Seencel"
                        >
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500" fill="rgb(59,130,246)" color="white" />
                        </div>
                    )}
                </div>
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
                    <span className="flex items-center gap-1.5">
                        {participant.contact_company_name ? (
                            <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {participant.contact_company_name}
                            </span>
                        ) : (
                            participant.contact_email || participant.notes || null
                        )}
                        {isSeencelUser && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-full px-1.5 py-0 leading-4">
                                <BadgeCheck className="h-2.5 w-2.5" />
                                En Seencel
                            </span>
                        )}
                    </span>
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
