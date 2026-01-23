"use client";

import { useState } from "react";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { ContactForm } from "@/features/contact/forms/contact-form";
import { ContactCard } from "./contact-card";
import { ContactsDataTable } from "./contacts-data-table";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { deleteContact } from "@/actions/contacts";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";

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



    return (
        <div className="space-y-4">
            <ContactsDataTable
                organizationId={organizationId}
                contacts={initialContacts}
                contactTypes={contactTypes}
                viewMode={viewMode}
                viewToggle={
                    <ToolbarTabs
                        value={viewMode}
                        onValueChange={(v) => setViewMode(v as ViewMode)}
                        options={[
                            { value: "grid", label: "Tarjetas", icon: LayoutGrid },
                            { value: "table", label: "Tabla", icon: List },
                        ]}
                    />
                }
                toolbarInHeader={true}
            />
        </div>
    );
}

