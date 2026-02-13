"use client";

import { useState, useMemo } from "react";
import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { ContactForm, CompanyOption } from "@/features/contact/forms/contact-form";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { ContactCard } from "./contact-card";
import { ContactFilesModal } from "./contact-files-modal";
import { ContactListItem } from "@/components/shared/list-item/items/contact-list-item";
import { deleteContact } from "@/actions/contacts";
import { DeleteReplacementModal } from "@/components/shared/forms/general/delete-replacement-modal";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

interface ContactsDataTableProps {
    organizationId: string;
    /** Already optimistic items from parent */
    contacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
    viewMode: "table" | "grid";
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    selectedCategoryIds?: Set<string>;
    /** Company contacts for the edit form combobox */
    companyContacts: CompanyOption[];
    /** Callback: parent handles optimistic update for edit */
    onEditSubmit: (contactId: string, data: any, categoryIds: string[]) => void;
    /** Callback: parent handles optimistic remove */
    onDeleteContact: (id: string | number, serverAction?: () => Promise<void>) => void;
}

export function ContactsDataTable({
    organizationId,
    contacts,
    contactCategories,
    viewMode,
    globalFilter,
    onGlobalFilterChange,
    selectedCategoryIds,
    companyContacts,
    onEditSubmit,
    onDeleteContact,
}: ContactsDataTableProps) {
    const { openModal } = useModal();
    const router = useRouter();
    const [deletingContact, setDeletingContact] = useState<ContactWithRelations | null>(null);

    // Filter by search query and selected categories
    const filteredContacts = useMemo(() => {
        let result = contacts;

        // Filter by categories
        if (selectedCategoryIds && selectedCategoryIds.size > 0) {
            result = result.filter(c =>
                c.contact_categories?.some(cat => selectedCategoryIds.has(cat.id))
            );
        }

        // Filter by search query
        if (globalFilter?.trim()) {
            const query = globalFilter.toLowerCase();
            result = result.filter(c =>
                (c.full_name?.toLowerCase().includes(query)) ||
                (c.email?.toLowerCase().includes(query)) ||
                (c.phone?.includes(query)) ||
                (c.resolved_company_name?.toLowerCase().includes(query)) ||
                (c.location?.toLowerCase().includes(query)) ||
                (c.contact_categories?.some(cat => cat.name.toLowerCase().includes(query)))
            );
        }

        return result;
    }, [contacts, globalFilter, selectedCategoryIds]);

    // 🚀 OPTIMISTIC EDIT: parent handles the update
    const handleOpenEdit = (contact: ContactWithRelations) => {
        openModal(
            <ContactForm
                organizationId={organizationId}
                contactCategories={contactCategories}
                companyContacts={companyContacts}
                initialData={contact}
                onOptimisticSubmit={(data, categoryIds) => onEditSubmit(contact.id, data, categoryIds)}
            />,
            {
                title: "Editar Contacto",
                description: `Modificando a ${contact.full_name}`,
                size: "lg"
            }
        );
    };

    // Opens the delete modal
    const handleDelete = (contact: ContactWithRelations) => {
        setDeletingContact(contact);
    };

    // Opens the attach files modal
    const handleAttachFiles = (contact: ContactWithRelations) => {
        openModal(
            <ContactFilesModal
                contactId={contact.id}
                organizationId={organizationId}
            />,
            {
                title: `Archivos de ${contact.full_name || "Contacto"}`,
                description: "Adjuntá documentos, imágenes o PDFs a este contacto.",
                size: "lg"
            }
        );
    };

    // 🚀 OPTIMISTIC DELETE: parent handles the remove
    const handleConfirmDelete = async (replacementId: string | null) => {
        if (!deletingContact) return;
        const contactId = deletingContact.id;
        setDeletingContact(null); // Close modal immediately

        onDeleteContact(contactId, async () => {
            try {
                await deleteContact(contactId, replacementId || undefined);
            } catch (error) {
                router.refresh(); // Recover on error
            }
        });
    };

    // Empty state when no results
    if (filteredContacts.length === 0) {
        return (
            <>
                <ViewEmptyState
                    mode="no-results"
                    icon={Users}
                    viewName="contactos"
                    filterContext="con esa búsqueda"
                    onResetFilters={() => onGlobalFilterChange?.("")}
                />
            </>
        );
    }

    return (
        <>
            {viewMode === "grid" ? (
                /* Grid view: Cards */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredContacts.map((contact) => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            onAttachFiles={handleAttachFiles}
                        />
                    ))}
                </div>
            ) : (
                /* List view: ListItems */
                <div className="flex flex-col gap-1">
                    {filteredContacts.map((contact) => (
                        <ContactListItem
                            key={contact.id}
                            contact={contact}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            onAttachFiles={handleAttachFiles}
                        />
                    ))}
                </div>
            )}

            {/* Delete Contact Modal */}
            <DeleteReplacementModal
                isOpen={deletingContact !== null}
                onClose={() => setDeletingContact(null)}
                onConfirm={handleConfirmDelete}
                itemToDelete={deletingContact ? { id: deletingContact.id, name: deletingContact.full_name || "Sin nombre" } : null}
                entityLabel="contacto"
                replacementOptions={contacts
                    .filter(c => c.id !== deletingContact?.id)
                    .map(c => ({ id: c.id, name: c.full_name || `${c.first_name} ${c.last_name}` || "Sin nombre" }))
                }
                title="Eliminar Contacto"
                description={`¿Estás seguro de eliminar a "${deletingContact?.full_name || 'este contacto'}"?`}
            />
        </>
    );
}
