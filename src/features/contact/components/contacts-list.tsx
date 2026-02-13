"use client";

import { useState, useMemo, useCallback } from "react";
import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { Plus, LayoutGrid, List, Upload, Users } from "lucide-react";
import { ContactForm } from "@/features/contact/forms/contact-form";
import { ContactsDataTable } from "./contacts-data-table";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ToolbarTabs } from "@/components/layout/dashboard/shared/toolbar/toolbar-tabs";
import { FacetedFilter } from "@/components/layout/dashboard/shared/toolbar/toolbar-faceted-filter";
import { BulkImportModal } from "@/components/shared/import/import-modal";
import { createImportBatch, importContactsBatch, revertImportBatch } from "@/lib/import";
import { getContactCategories, createContactCategory, createContact, updateContact } from "@/actions/contacts";
import { normalizeEmail, normalizePhone } from "@/lib/import";
import { ImportConfig } from "@/lib/import";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useOptimisticList } from "@/hooks/use-optimistic-action";
import { toast } from "sonner";

interface ContactsListProps {
    organizationId: string;
    initialContacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
}

type ViewMode = "grid" | "table";

export function ContactsList({ organizationId, initialContacts, contactCategories }: ContactsListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // 🚀 OPTIMISTIC UI: Lifted to parent to handle create/edit/delete
    const {
        optimisticItems: optimisticContacts,
        addItem: optimisticAdd,
        updateItem: optimisticUpdate,
        removeItem: optimisticRemove,
    } = useOptimisticList({
        items: initialContacts,
        getItemId: (contact) => contact.id,
    });

    // Category filter options
    const categoryFilterOptions = useMemo(() =>
        contactCategories.map(cat => ({ label: cat.name, value: cat.id })),
        [contactCategories]
    );

    const handleCategorySelect = useCallback((value: string) => {
        setSelectedCategoryIds(prev => {
            const next = new Set(prev);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            return next;
        });
    }, []);

    const handleClearCategories = useCallback(() => {
        setSelectedCategoryIds(new Set());
    }, []);

    // Extract company contacts for the company combobox in the form
    const companyContacts = useMemo(() => {
        return optimisticContacts
            .filter(c => c.contact_type === 'company')
            .map(c => ({ id: c.id, name: c.full_name || c.first_name || "" }));
    }, [optimisticContacts]);

    // 🚀 OPTIMISTIC CREATE: Add to list immediately, server in background
    const handleCreateSubmit = useCallback((dataToSave: any, categoryIds: string[]) => {
        const tempId = `temp-${Date.now()}`;
        const selectedCategories = contactCategories.filter(c => categoryIds.includes(c.id));

        const optimisticItem: ContactWithRelations = {
            id: tempId,
            organization_id: organizationId,
            contact_type: dataToSave.contact_type,
            first_name: dataToSave.first_name,
            last_name: dataToSave.last_name || null,
            full_name: dataToSave.full_name,
            email: dataToSave.email || null,
            phone: dataToSave.phone || null,
            company_id: dataToSave.company_id || null,
            company_name: dataToSave.company_name || null,
            national_id: dataToSave.national_id || null,
            location: dataToSave.location || null,
            notes: dataToSave.notes || null,
            image_url: dataToSave.image_url || null,
            contact_categories: selectedCategories,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
            deleted_at: null,
            linked_user_id: null,
            is_local: true,
            sync_status: "local",
            display_name_override: null,
            linked_at: null,
            avatar_updated_at: null,
            linked_user_full_name: null,
            linked_user_email: null,
            linked_user_avatar_url: null,
            resolved_avatar_url: dataToSave.image_url || null,
            is_organization_member: false,
            linked_company_name: null,
            resolved_company_name: dataToSave.company_name || null,
        };

        closeModal();

        optimisticAdd(optimisticItem, async () => {
            try {
                await createContact(organizationId, dataToSave, categoryIds);
            } catch (error) {
                toast.error("Error al crear el contacto");
                router.refresh();
            }
        });
    }, [organizationId, contactCategories, closeModal, optimisticAdd, router]);

    // 🚀 OPTIMISTIC UPDATE: Update in list immediately, server in background
    const handleEditSubmit = useCallback((contactId: string, dataToSave: any, categoryIds: string[]) => {
        const selectedCategories = contactCategories.filter(c => categoryIds.includes(c.id));

        const updates: Partial<ContactWithRelations> = {
            contact_type: dataToSave.contact_type,
            first_name: dataToSave.first_name,
            last_name: dataToSave.last_name || null,
            full_name: dataToSave.full_name,
            email: dataToSave.email || null,
            phone: dataToSave.phone || null,
            company_id: dataToSave.company_id || null,
            company_name: dataToSave.company_name || null,
            national_id: dataToSave.national_id || null,
            location: dataToSave.location || null,
            notes: dataToSave.notes || null,
            image_url: dataToSave.image_url || null,
            contact_categories: selectedCategories,
        };

        closeModal();

        optimisticUpdate(contactId, updates, async () => {
            try {
                await updateContact(contactId, dataToSave, categoryIds);
            } catch (error) {
                toast.error("Error al actualizar el contacto");
                router.refresh();
            }
        });
    }, [contactCategories, closeModal, optimisticUpdate, router]);

    const handleOpenCreate = () => {
        openModal(
            <ContactForm
                organizationId={organizationId}
                contactCategories={contactCategories}
                companyContacts={companyContacts}
                onOptimisticSubmit={(data, categoryIds) => handleCreateSubmit(data, categoryIds)}
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
                id: "contact_categories",
                label: "Categoría",
                required: false,
                example: "Cliente",
                foreignKey: {
                    table: 'contact_categories',
                    labelField: 'name',
                    valueField: 'id',
                    fetchOptions: async (orgId) => {
                        const categories = await getContactCategories(orgId);
                        return categories.map(c => ({ id: c.id, label: c.name }));
                    },
                    allowCreate: true,
                    createAction: async (orgId, name) => {
                        const newCategory = await createContactCategory(orgId, name);
                        return { id: newCategory.id };
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
                            { value: "table", label: "Lista", icon: List },
                        ]}
                    />
                }
                filterContent={
                    categoryFilterOptions.length > 0 ? (
                        <FacetedFilter
                            title="Categoría"
                            options={categoryFilterOptions}
                            selectedValues={selectedCategoryIds}
                            onSelect={handleCategorySelect}
                            onClear={handleClearCategories}
                        />
                    ) : undefined
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

            {/* Empty State: no contacts at all */}
            {initialContacts.length === 0 ? (
                <ViewEmptyState
                    mode="empty"
                    icon={Users}
                    viewName="Contactos"
                    featureDescription="Los contactos son las personas y empresas con las que trabajás: clientes, proveedores, subcontratistas y socios. Organizalos con etiquetas, vincularlos a proyectos y mantenelos actualizados."
                    onAction={handleOpenCreate}
                    actionLabel="Nuevo Contacto"
                    docsPath="/docs/contactos/introduccion"
                />
            ) : (
                <ContactsDataTable
                    organizationId={organizationId}
                    contacts={optimisticContacts}
                    contactCategories={contactCategories}
                    viewMode={viewMode}
                    globalFilter={searchQuery}
                    onGlobalFilterChange={setSearchQuery}
                    selectedCategoryIds={selectedCategoryIds}
                    companyContacts={companyContacts}
                    onEditSubmit={handleEditSubmit}
                    onDeleteContact={optimisticRemove}
                />
            )}
        </>
    );
}
