"use client";

import { memo, useCallback } from "react";
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
import { MoreVertical, Paperclip, Pencil, Trash2, Building2, Mail, Phone, MapPin, PhoneCall, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContactWithRelations } from "@/types/contact";

// Helper to format phone for WhatsApp (remove spaces, dashes, etc)
function formatPhoneForWhatsApp(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

// ============================================================================
// Types
// ============================================================================

export interface ContactListItemProps {
    /** The contact data to display */
    contact: ContactWithRelations;
    /** Callback when edit is clicked */
    onEdit?: (contact: ContactWithRelations) => void;
    /** Callback when delete is clicked */
    onDelete?: (contact: ContactWithRelations) => void;
    /** Callback when attach files is clicked */
    onAttachFiles?: (contact: ContactWithRelations) => void;
    /** Multi-select: whether this item is selected */
    selected?: boolean;
    /** Multi-select: toggle selection callback */
    onToggleSelect?: (id: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ContactListItem = memo(function ContactListItem({
    contact,
    onEdit,
    onDelete,
    onAttachFiles,
    selected = false,
    onToggleSelect,
}: ContactListItemProps) {
    const handleToggle = useCallback(() => {
        onToggleSelect?.(contact.id);
    }, [onToggleSelect, contact.id]);

    const hasActions = !!onEdit || !!onDelete;
    const initials = contact.contact_type === 'company'
        ? undefined
        : `${contact.first_name?.[0] || ""}${contact.last_name?.[0] || ""}`.toUpperCase() || "?";

    return (
        <ListItem variant="card" selected={selected}>
            {/* Multi-select checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox
                    checked={selected}
                    onChange={handleToggle}
                />
            )}

            {/* Avatar */}
            <ListItem.Leading>
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={contact.resolved_avatar_url || contact.image_url || undefined} />
                    <AvatarFallback className="text-xs">
                        {contact.contact_type === 'company' ? (
                            <Building2 className="h-4 w-4" />
                        ) : (
                            initials
                        )}
                    </AvatarFallback>
                </Avatar>
            </ListItem.Leading>

            {/* Name + Company */}
            <ListItem.Content>
                <ListItem.Title>
                    {contact.full_name || "Sin nombre"}
                </ListItem.Title>
                <ListItem.Description>
                    {contact.contact_type === 'person' && contact.resolved_company_name ? (
                        <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {contact.resolved_company_name}
                        </span>
                    ) : (
                        contact.email || contact.phone || null
                    )}
                </ListItem.Description>
            </ListItem.Content>

            {/* Contact info + Categories */}
            <ListItem.Trailing className="hidden md:flex items-center gap-3">
                {/* Contact details */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                            <Mail className="h-3 w-3" />
                            <span className="hidden lg:inline max-w-[180px] truncate">{contact.email}</span>
                        </a>
                    )}
                    {contact.phone && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-1 hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                                    <Phone className="h-3 w-3" />
                                    <span className="hidden lg:inline">{contact.phone}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2" align="center">
                                <div className="flex flex-col gap-1">
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                                    >
                                        <PhoneCall className="h-4 w-4 text-blue-500" />
                                        <span>Llamar</span>
                                    </a>
                                    <a
                                        href={`https://wa.me/${formatPhoneForWhatsApp(contact.phone)}`}
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
                    {contact.location && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="hidden xl:inline max-w-[120px] truncate">{contact.location}</span>
                        </span>
                    )}
                </div>

                {/* Categories */}
                {contact.contact_categories && contact.contact_categories.length > 0 && (
                    <div className="flex items-center gap-1">
                        {contact.contact_categories.slice(0, 2).map((cat) => (
                            <Badge key={cat.id} variant="outline" className="text-[10px] h-5">
                                {cat.name}
                            </Badge>
                        ))}
                        {contact.contact_categories.length > 2 && (
                            <Badge variant="outline" className="text-[10px] h-5">
                                +{contact.contact_categories.length - 2}
                            </Badge>
                        )}
                    </div>
                )}
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
                                <DropdownMenuItem onClick={() => onEdit(contact)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onAttachFiles && (
                                <DropdownMenuItem onClick={() => onAttachFiles(contact)}>
                                    <Paperclip className="w-4 h-4 mr-2" />
                                    Adjuntar archivos
                                </DropdownMenuItem>
                            )}
                            {onEdit && onDelete && <DropdownMenuSeparator />}
                            {onDelete && (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(contact)}
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
