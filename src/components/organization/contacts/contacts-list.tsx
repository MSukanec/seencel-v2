"use client";

import { useState } from "react";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Mail, Phone, MapPin, Tag } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactForm } from "./ContactForm";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { deleteContact } from "@/actions/contacts";

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactTypes: ContactType[];
}

export function ContactsList({ organizationId, initialContacts, contactTypes }: ContactsListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { openModal, closeModal } = useModal();
    const router = useRouter(); // Use router to refresh if needed, though actions revalidate

    const filteredContacts = initialContacts.filter(contact =>
        (contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
        (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
        (contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "")
    );
    console.log("Contacts Data:", filteredContacts);

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleOpenCreate = () => {
        openModal(
            <ContactForm
                organizationId={organizationId}
                contactTypes={contactTypes}
                onSuccess={handleSuccess}
            />,
            {
                title: "Nuevo Contacto",
                description: "Agrega un nuevo contacto a tu organización.",
                size: "lg"
            }
        );
    };

    const handleOpenEdit = (contact: ContactWithRelations) => {
        openModal(
            <ContactForm
                organizationId={organizationId}
                contactTypes={contactTypes}
                initialData={contact}
                onSuccess={handleSuccess}
            />,
            {
                title: "Editar Contacto",
                description: `Modificando a ${contact.full_name}`,
                size: "lg"
            }
        );
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que quieres eliminar este contacto?")) {
            await deleteContact(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar contactos..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Contacto
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Contacto</TableHead>
                            <TableHead>Detalles</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Etiquetas</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron contactos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={contact.image_path || undefined} /> {/* Assuming path is url for now or needs storage resolution */}
                                                <AvatarFallback>{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{contact.full_name || "Sin nombre"}</span>
                                                {contact.company_name && (
                                                    <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                            {contact.email && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    <span>{contact.email}</span>
                                                </div>
                                            )}
                                            {contact.phone && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{contact.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {contact.location && (
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>{contact.location}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {contact.contact_types?.map((type, idx) => (
                                                <Badge key={`${contact.id}-${type.id}-${idx}`} variant="secondary" className="text-xs font-normal">
                                                    {type.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(contact)}>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(contact.id)}>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
