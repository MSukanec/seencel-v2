"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
        <Card className="group relative flex flex-col items-center text-center p-6 h-[400px] bg-card hover:bg-accent/40 transition-colors border-border/50 shadow-sm cursor-pointer">

            {/* Top Actions - Always Visible */}
            <div className="absolute top-4 right-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors outline-none">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
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

            {/* Organization Member Indicator (Top Left) - Mini Logo */}
            {contact.is_organization_member && (
                <div className="absolute top-4 left-4 z-10">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Avatar className="h-8 w-8 border border-border/50 shadow-sm bg-background">
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        <Building2 className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p className="text-xs">Miembro de la Organización</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Avatar - Centered & Circular */}
            <div className="mt-8 mb-6">
                <Avatar className="h-24 w-24 border-2 border-border/10 shadow-sm rounded-full">
                    <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl font-medium bg-muted text-muted-foreground/70">
                        {contact.first_name?.[0]}{contact.last_name?.[0]}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Name & Title - Fixed Height Area */}
            <div className="w-full min-h-[60px] flex flex-col items-center justify-start mb-4">
                <h3 className="font-semibold text-lg leading-tight line-clamp-1 w-full px-2" title={contact.full_name || undefined}>
                    {contact.full_name || "Sin nombre"}
                </h3>
                {contact.company_name ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="line-clamp-1">{contact.company_name}</span>
                    </div>
                ) : (
                    <div className="h-5 mt-1" /> /* Spacer for alignment */
                )}
            </div>

            {/* Tags Slot - Moved here below name */}
            <div className="h-6 w-full flex items-center justify-center overflow-hidden mb-2">
                {contact.contact_types && contact.contact_types.length > 0 ? (
                    <div className="flex gap-1 justify-center">
                        <Badge variant="secondary" className="text-xs h-5 px-2 font-normal bg-secondary/50 text-secondary-foreground/80">
                            {contact.contact_types[0].name}
                        </Badge>
                        {contact.contact_types.length > 1 && (
                            <span className="text-xs text-muted-foreground self-center">+{contact.contact_types.length - 1}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs opacity-20 select-none">-</span>
                )}
            </div>

            {/* Fixed Height Contact Info Area */}
            {/* We reserve space for Email, Phone, and Types so cards align perfectly even if empty */}
            <div className="w-full mt-auto flex flex-col items-center gap-2 text-sm text-muted-foreground pb-2">

                {/* Email Slot */}
                <div className="h-6 w-full flex items-center justify-center">
                    {contact.email ? (
                        <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors max-w-full"
                            title={contact.email || undefined}
                        >
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate text-xs">{contact.email}</span>
                        </a>
                    ) : (
                        <span className="text-xs opacity-20 select-none">-</span>
                    )}
                </div>

                {/* Phone Slot */}
                <div className="h-6 w-full flex items-center justify-center">
                    {contact.phone ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="flex items-center gap-2 hover:text-primary transition-colors max-w-full">
                                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate text-xs">{formatPhoneForWhatsApp(contact.phone)}</span>
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
                    ) : (
                        <span className="text-xs opacity-20 select-none">-</span>
                    )}
                </div>



            </div>
        </Card>
    );
}


