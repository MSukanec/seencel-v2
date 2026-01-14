"use client";

import { useState } from "react";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { ContactForm } from "./contact-form";
import { ContactCard } from "./contact-card";
import { ContactsDataTable } from "./contacts-data-table";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { deleteContact } from "@/actions/contacts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactTypes: ContactType[];
}

type ViewMode = "grid" | "table";

export function ContactsList({ organizationId, initialContacts, contactTypes }: ContactsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const { openModal, closeModal } = useModal();
    const router = useRouter();

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

    const handleDelete = async (contact: ContactWithRelations) => {
        if (confirm(`¿Estás seguro de eliminar a ${contact.full_name || 'este contacto'}?`)) {
            await deleteContact(contact.id);
            router.refresh();
        }
    };

    const ViewToggle = (
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="grid" aria-label="Vista de tarjetas">
                <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Vista de tabla">
                <List className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );

    return (
        <div className="space-y-4">
            <ContactsDataTable
                organizationId={organizationId}
                contacts={initialContacts}
                contactTypes={contactTypes}
                viewMode={viewMode}
                viewToggle={
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "table" ? "default" : "ghost"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setViewMode("table")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
