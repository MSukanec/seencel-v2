"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContactWithRelations } from "@/types/contact";
import { Building2, Mail, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, PhoneCall, Trash2 } from "lucide-react";

interface ContactCardProps {
    contact: ContactWithRelations;
    onEdit: (contact: ContactWithRelations) => void;
    onDelete: (contact: ContactWithRelations) => void;
}

// Helper to format phone for WhatsApp (remove spaces, dashes, etc)
function formatPhoneForWhatsApp(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
    const avatarUrl = contact.resolved_avatar_url || contact.image_url;

    return (
        <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/30">
            <CardContent className="p-0">
                {/* Header with gradient background */}
                <div className="h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

                {/* Avatar positioned over the header */}
                <div className="flex flex-col items-center -mt-10 px-4 pb-4">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="text-xl font-semibold bg-muted">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    {/* Name & Company */}
                    <div className="mt-3 text-center">
                        <h3 className="font-semibold text-lg leading-tight">
                            {contact.full_name || "Sin nombre"}
                        </h3>
                        {contact.company_name && (
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-0.5">
                                <Building2 className="h-3 w-3" />
                                <span>{contact.company_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {contact.contact_types && contact.contact_types.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-3">
                            {contact.contact_types.slice(0, 3).map((type) => (
                                <Badge key={type.id} variant="secondary" className="text-xs">
                                    {type.name}
                                </Badge>
                            ))}
                            {contact.contact_types.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{contact.contact_types.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="w-full mt-4 space-y-2 text-sm">
                        {/* Email - Clickable mailto */}
                        {contact.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate hover:underline">{contact.email}</span>
                            </a>
                        )}

                        {/* Phone - Popover with Call/WhatsApp options */}
                        {contact.phone && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer w-full text-left">
                                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="hover:underline">{contact.phone}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="start">
                                    <div className="flex flex-col gap-1">
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <PhoneCall className="h-4 w-4 text-blue-500" />
                                            <span>Llamar</span>
                                        </a>
                                        <a
                                            href={`https://wa.me/${formatPhoneForWhatsApp(contact.phone)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                                        >
                                            <MessageCircle className="h-4 w-4 text-green-500" />
                                            <span>WhatsApp</span>
                                        </a>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        {contact.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{contact.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Menu (appears on hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(contact)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(contact)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Member Badge */}
                {contact.is_organization_member && (
                    <div className="absolute top-2 left-2">
                        <Badge variant="default" className="text-xs bg-emerald-500/90 hover:bg-emerald-500">
                            Miembro
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


