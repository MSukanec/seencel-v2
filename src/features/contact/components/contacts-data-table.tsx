"use client";

import { useMemo, useCallback } from "react";
import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { CompanyOption } from "@/features/contact/forms/contact-form";
import { usePanel } from "@/stores/panel-store";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { useTableActions } from "@/hooks/use-table-actions";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Card } from "@/components/ui/card";
import { EntityContextMenu, type EntityCustomAction } from "@/components/shared/entity-context-menu";
import { ContactCard } from "./contact-card";
import { deleteContact, updateContact } from "@/actions/contacts";
import { getContactColumns } from "@/features/contact/tables/contacts-columns";
import {
    Paperclip,
    Phone,
    Mail,
    MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// COMPONENT
// ============================================================================

interface ContactsDataTableProps {
    organizationId: string;
    contacts: ContactWithRelations[];
    contactCategories: ContactCategory[];
    viewMode: "table" | "grid";
    organizationName: string;
    organizationLogoUrl: string | null;
    companyContacts: CompanyOption[];
    onDeleteContact: (id: string | number, serverAction?: () => Promise<void>) => void;
    searchQuery?: string;
    onClearFilters?: () => void;
}

export function ContactsDataTable({
    organizationId,
    contacts,
    contactCategories,
    viewMode,
    organizationName,
    organizationLogoUrl,
    companyContacts,
    onDeleteContact,
    searchQuery,
    onClearFilters,
}: ContactsDataTableProps) {
    const { openPanel } = usePanel();
    const router = useRouter();

    // ─── Inline update handler ───────────────────────────
    const handleInlineUpdate = useCallback(async (row: ContactWithRelations, fields: Record<string, any>) => {
        try {
            const categoryIds = fields._categoryIds;
            const contactFields = { ...fields };
            delete contactFields._categoryIds;

            if (contactFields.first_name !== undefined || contactFields.last_name !== undefined) {
                const firstName = contactFields.first_name ?? row.first_name;
                const lastName = contactFields.last_name ?? row.last_name;
                contactFields.full_name = [firstName, lastName].filter(Boolean).join(" ");
            }

            await updateContact(
                row.id,
                Object.keys(contactFields).length > 0 ? contactFields : {},
                categoryIds
            );
            router.refresh();
        } catch {
            toast.error("Error al actualizar el contacto");
        }
    }, [router]);

    // ─── Panel handlers ─────────────────────────────────
    const handleEdit = useCallback((contact: ContactWithRelations) => {
        openPanel('contact-form', {
            organizationId,
            contactCategories,
            companyContacts,
            initialData: contact,
            onSuccess: () => {
                router.refresh();
            },
        });
    }, [organizationId, contactCategories, companyContacts, openPanel, router]);

    // ─── Delete via useTableActions ──────────────────────
    const { handleDelete, handleBulkDelete, DeleteConfirmDialog } = useTableActions<ContactWithRelations>({
        onDelete: async (contact) => {
            onDeleteContact(contact.id, async () => {
                try {
                    await deleteContact(contact.id);
                } catch {
                    toast.error("Error al eliminar el contacto");
                    router.refresh();
                }
            });
            return { success: true };
        },
        entityName: "contacto",
        entityNamePlural: "contactos",
    });

    // ─── Custom actions (Zone 3 of EntityContextMenu) ────
    const customActions: EntityCustomAction<ContactWithRelations>[] = useMemo(() => [
        {
            label: "Enviar por WhatsApp",
            icon: <MessageCircle className="h-3.5 w-3.5" />,
            visible: (contact) => !!contact.phone,
            onClick: (contact) => {
                const formattedPhone = contact.phone!.replace(/\D/g, "");
                window.open(`https://wa.me/${formattedPhone}`, "_blank");
            },
        },
        {
            label: "Llamar",
            icon: <Phone className="h-3.5 w-3.5" />,
            visible: (contact) => !!contact.phone,
            onClick: (contact) => window.open(`tel:${contact.phone}`, "_self"),
        },
        {
            label: "Enviar por mail",
            icon: <Mail className="h-3.5 w-3.5" />,
            visible: (contact) => !!contact.email,
            onClick: (contact) => window.open(`mailto:${contact.email}`, "_blank"),
        },
    ], []);

    // ─── Columns (memoized) ──────────────────────────────
    const columns = useMemo(
        () => getContactColumns({
            onInlineUpdate: handleInlineUpdate,
            contactCategories,
            companyContacts: companyContacts.map(c => ({ id: c.id, name: c.name })),
        }),
        [handleInlineUpdate, contactCategories, companyContacts]
    );

    // ─── Row click → open edit panel ────────────────────
    const handleRowClick = useCallback((contact: ContactWithRelations) => {
        handleEdit(contact);
    }, [handleEdit]);

    return (
        <>
            {viewMode === "grid" ? (
                <Card variant="inset">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {contacts.map((contact) => (
                            <EntityContextMenu
                                key={contact.id}
                                data={contact}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                customActions={customActions}
                            >
                                <div>
                                    <ContactCard
                                        contact={contact}
                                        organizationName={organizationName}
                                        organizationLogoUrl={organizationLogoUrl}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            </EntityContextMenu>
                        ))}
                    </div>
                </Card>
            ) : (
                <DataTable
                    columns={columns}
                    data={contacts}
                    enableRowSelection
                    enableContextMenu
                    onRowClick={handleRowClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                    initialSorting={[{ id: "full_name", desc: false }]}
                    globalFilter={searchQuery}
                    onClearFilters={onClearFilters}
                    customActions={customActions}
                />
            )}

            <DeleteConfirmDialog />
        </>
    );
}
