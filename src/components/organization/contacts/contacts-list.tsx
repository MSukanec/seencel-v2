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
import { createContact, updateContact, deleteContact } from "@/actions/contacts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this
import { Checkbox } from "@/components/ui/checkbox"; // Assuming you have this

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactTypes: ContactType[];
}

export function ContactsList({ organizationId, initialContacts, contactTypes }: ContactsListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<ContactWithRelations | null>(null);

    // Form State (Simple controlled inputs for speed, could use React Hook Form)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        company_name: "",
        location: "",
        notes: "",
        typeIds: [] as string[] // Selected type IDs
    });

    const filteredContacts = initialContacts.filter(contact =>
        (contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
        (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
        (contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || "")
    );

    const handleOpenCreate = () => {
        setEditingContact(null);
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            company_name: "",
            location: "",
            notes: "",
            typeIds: []
        });
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (contact: ContactWithRelations) => {
        setEditingContact(contact);
        setFormData({
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            email: contact.email || "",
            phone: contact.phone || "",
            company_name: contact.company_name || "",
            location: contact.location || "",
            notes: contact.notes || "",
            typeIds: contact.contact_types ? contact.contact_types.map(t => t.id) : []
        });
        setIsSheetOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const dataToSave = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                email: formData.email,
                phone: formData.phone,
                company_name: formData.company_name,
                location: formData.location,
                notes: formData.notes,
            };

            if (editingContact) {
                await updateContact(editingContact.id, dataToSave, formData.typeIds);
            } else {
                await createContact(organizationId, dataToSave, formData.typeIds);
            }
            setIsSheetOpen(false);
        } catch (error) {
            console.error("Failed to save contact", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que quieres eliminar este contacto?")) {
            await deleteContact(id);
        }
    };

    const toggleType = (typeId: string) => {
        setFormData(prev => {
            const exists = prev.typeIds.includes(typeId);
            if (exists) return { ...prev, typeIds: prev.typeIds.filter(id => id !== typeId) };
            return { ...prev, typeIds: [...prev.typeIds, typeId] };
        });
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

            <div className="rounded-md border">
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

            {/* CREATE / EDIT SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{editingContact ? "Editar Contacto" : "Nuevo Contacto"}</SheetTitle>
                        <SheetDescription>
                            {editingContact ? "Modifica los detalles del contacto existente." : "Agrega un nuevo contacto a tu organización."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Nombre</Label>
                                <Input id="first_name" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Apellido</Label>
                                <Input id="last_name" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Empresa</Label>
                            <Input id="company" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Ubicación</Label>
                            <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Etiquetas / Tipos</Label>
                            <div className="flex flex-wrap gap-2 border rounded-md p-3">
                                {contactTypes.length === 0 ? <p className="text-xs text-muted-foreground">No hay tipos disponibles. Crea uno en Configuración.</p> :
                                    contactTypes.map(type => (
                                        <div key={type.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`type-${type.id}`}
                                                checked={formData.typeIds.includes(type.id)}
                                                onCheckedChange={() => toggleType(type.id)}
                                            />
                                            <Label htmlFor={`type-${type.id}`} className="text-sm font-normal cursor-pointer">
                                                {type.name}
                                            </Label>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Guardar</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
