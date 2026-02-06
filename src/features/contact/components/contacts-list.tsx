"use client";

import { useState } from "react";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { Plus, LayoutGrid, List, Upload } from "lucide-react";
import { ContactForm } from "@/features/contact/forms/contact-form";
import { ContactsDataTable } from "./contacts-data-table";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "next/navigation";
import { deleteContact } from "@/actions/contacts";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, importContactsBatch, revertImportBatch } from "@/lib/import";
import { getContactTypes, createContactType } from "@/actions/contacts";
import { normalizeEmail, normalizePhone } from "@/lib/import";
import { ImportConfig } from "@/lib/import";

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactTypes: ContactType[];
}

type ViewMode = "grid" | "table";

export function ContactsList({ organizationId, initialContacts, contactTypes }: ContactsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
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

    // Import config
    const contactImportConfig: ImportConfig<any> = {
        entityLabel: "Contactos",
        entityId: "contactos",
        columns: [
            { id: "first_name", label: "Nombre", required: true, example: "Juan" },
            { id: "last_name", label: "Apellido", required: false, example: "Pérez" },
            {
                id: "email",
                label: "Email",
                type: "email",
                unique: true,
                normalization: normalizeEmail,
                validation: (val) => {
                    const normalized = normalizeEmail(val);
                    if (!normalized) return undefined;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(normalized)) return "Email inválido";
                }
            },
            {
                id: "phone",
                label: "Teléfono",
                type: "phone",
                normalization: normalizePhone
            },
            { id: "company_name", label: "Empresa", required: false },
            { id: "location", label: "Ubicación", required: false },
            { id: "notes", label: "Notas", required: false },
            {
                id: "contact_types",
                label: "Tipo",
                required: false,
                example: "Cliente",
                foreignKey: {
                    table: 'contact_types',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async (orgId) => {
                        const types = await getContactTypes(orgId);
                        return types.map(t => ({ id: t.id, label: t.name }));
                    },
                    allowCreate: true,
                    createAction: async (orgId, name) => {
                        const newType = await createContactType(orgId, name);
                        return { id: newType.id };
                    }
                }
            },
        ],
        onImport: async (data) => {
            try {
                const batch = await createImportBatch(organizationId, "contacts", data.length);
                await importContactsBatch(organizationId, data, batch.id);
                return { success: data.length, errors: [], batchId: batch.id };
            } catch (error) {
                console.error("Import error:", error);
                throw error;
            }
        },
        onRevert: async (batchId) => {
            await revertImportBatch(batchId, 'contacts');
        }
    };

    const handleOpenImport = () => {
        openModal(
            <BulkImportModal config={contactImportConfig} organizationId={organizationId} />,
            {
                size: "2xl",
                title: `Importar ${contactImportConfig.entityLabel}`,
                description: "Sigue los pasos para importar datos masivamente."
            }
        );
    };

    return (
        <>
            {/* Toolbar with portal to header */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar contactos..."
                leftActions={
                    <ToolbarTabs
                        value={viewMode}
                        onValueChange={(v) => setViewMode(v as ViewMode)}
                        options={[
                            { value: "grid", label: "Tarjetas", icon: LayoutGrid },
                            { value: "table", label: "Tabla", icon: List },
                        ]}
                    />
                }
                actions={[
                    {
                        label: "Nuevo Contacto",
                        icon: Plus,
                        onClick: handleOpenCreate,
                    },
                    {
                        label: "Importar",
                        icon: Upload,
                        onClick: handleOpenImport,
                    }
                ]}
            />

            {/* Data Table - now without deprecated toolbar props */}
            <ContactsDataTable
                organizationId={organizationId}
                contacts={initialContacts}
                contactTypes={contactTypes}
                viewMode={viewMode}
                globalFilter={searchQuery}
                onGlobalFilterChange={setSearchQuery}
            />
        </>
    );
}

