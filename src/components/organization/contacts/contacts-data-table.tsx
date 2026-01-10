"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ContactWithRelations, ContactType } from "@/types/contact";
import { DataTable, DataTableColumnHeader, DataTableRowActions } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { ContactCard } from "./ContactCard";
import { deleteContact } from "@/actions/contacts";
import { createImportBatch, importContactsBatch, revertImportBatch } from "@/actions/import-actions";
import { getContactTypes, createContactType } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import { DataTableExport } from "@/components/ui/data-table/data-table-export";
import { DataTableImport } from "@/components/ui/data-table/data-table-import";
import { normalizeEmail, normalizePhone } from "@/lib/import-normalizers";
import { ImportConfig } from "@/lib/import-utils";
import { Contact } from "@/types/contact";
import { DeleteReplacementModal } from "@/components/global/DeleteReplacementModal";

interface ContactsDataTableProps {
    organizationId: string;
    contacts: ContactWithRelations[];
    contactTypes: ContactType[];
    viewMode: "table" | "grid";
    viewToggle?: React.ReactNode;
}

export function ContactsDataTable({ organizationId, contacts, contactTypes, viewMode, viewToggle }: ContactsDataTableProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [deletingContact, setDeletingContact] = useState<ContactWithRelations | null>(null);

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

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
                unique: true, // Enable duplicate checking in DB
                normalization: normalizeEmail,
                validation: (val) => {
                    const normalized = normalizeEmail(val);
                    if (!normalized) return undefined; // Optional handled by required flag
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
                    // Fetch existing types for dropdown/matching
                    fetchOptions: async (orgId) => {
                        const types = await getContactTypes(orgId);
                        return types.map(t => ({ id: t.id, label: t.name }));
                    },
                    allowCreate: true,
                    // Create new type inline
                    createAction: async (orgId, name) => {
                        const newType = await createContactType(orgId, name);
                        return { id: newType.id };
                    }
                }
            },
        ],
        onImport: async (data) => {
            try {

                // 1. Create Batch
                const batch = await createImportBatch(organizationId, "contacts", data.length);

                // 2. Insert Contacts
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

    // Opens the delete modal instead of native confirm
    const handleDelete = (contact: ContactWithRelations) => {
        setDeletingContact(contact);
    };

    // Called by the modal when user confirms
    const handleConfirmDelete = async (replacementId: string | null) => {
        if (!deletingContact) return;
        // Pass replacementId to server action for migration before delete
        await deleteContact(deletingContact.id, replacementId || undefined);
        setDeletingContact(null);
        router.refresh();
    };

    const handleBulkDelete = (selectedContacts: ContactWithRelations[], onSuccess?: () => void) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de que deseas eliminar permanentemente {selectedContacts.length} contactos? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            try {
                                const toastId = "bulk-delete"; // Simple ID for now
                                // In a real app we might want to show loading state
                                await Promise.all(selectedContacts.map(contact => deleteContact(contact.id)));
                                router.refresh();
                                onSuccess?.();
                                closeModal();
                            } catch (error) {
                                console.error("Error deleting contacts:", error);
                                // If we had toast here we would use it
                            }
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar contactos",
                description: "Estás a punto de eliminar múltiples registros."
            }
        );
    };

    const columns: ColumnDef<ContactWithRelations>[] = [
        {
            accessorKey: "full_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Contacto" />,
            cell: ({ row }) => {
                const contact = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={contact.resolved_avatar_url || contact.image_url || undefined} />
                            <AvatarFallback>{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium">{contact.full_name || "Sin nombre"}</span>
                            {contact.company_name && (
                                <span className="text-xs text-muted-foreground">{contact.company_name}</span>
                            )}
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            accessorKey: "email",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
            cell: ({ row }) => {
                const email = row.original.email;
                return email ? (
                    <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                        <Mail className="h-3 w-3" />
                        <span>{email}</span>
                    </a>
                ) : <span className="text-muted-foreground">-</span>;
            },
        },
        {
            accessorKey: "phone",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
            cell: ({ row }) => {
                const phone = row.original.phone;
                return phone ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{phone}</span>
                    </div>
                ) : <span className="text-muted-foreground">-</span>;
            },
        },
        {
            accessorKey: "location",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Ubicación" />,
            cell: ({ row }) => {
                const location = row.original.location;
                return location ? (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{location}</span>
                    </div>
                ) : <span className="text-muted-foreground">-</span>;
            },
        },
        {
            id: "contact_types",
            accessorFn: (row) => row.contact_types?.map((t) => t.name),
            header: ({ column }) => <DataTableColumnHeader column={column} title="Etiquetas" />,
            cell: ({ row }) => {
                const types = row.original.contact_types;
                return types && types.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {types.slice(0, 2).map((type) => (
                            <Badge key={type.id} variant="outline">
                                {type.name}
                            </Badge>
                        ))}
                        {types.length > 2 && (
                            <Badge variant="outline">+{types.length - 2}</Badge>
                        )}
                    </div>
                ) : <span className="text-muted-foreground">-</span>;
            },
            filterFn: "arrIncludesSome",
        },
        {
            id: "actions",
            header: () => <span className="sr-only">Acciones</span>,
            cell: ({ row }) => (
                <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <DataTableRowActions
                        row={row}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                    />
                </div>
            ),
            size: 50,
            enableHiding: false,
        },
    ];

    return (
        <>
            <DataTable
                columns={columns}
                data={contacts}
                searchPlaceholder="Buscar contactos..."
                viewMode={viewMode}
                enableRowSelection={true}
                leftActions={viewToggle}
                pageSize={50}
                facetedFilters={[
                    {
                        columnId: "contact_types",
                        title: "Etiquetas",
                        options: contactTypes.map((type) => ({
                            label: type.name,
                            value: type.name,
                        })),
                    },
                ]}
                renderGridItem={(contact) => (
                    <ContactCard
                        contact={contact}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                    />
                )}
                bulkActions={({ table }) => (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                            const selectedRows = table.getFilteredSelectedRowModel().rows;
                            const selectedContacts = selectedRows.map(row => row.original);
                            handleBulkDelete(selectedContacts, () => table.resetRowSelection());
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                    </Button>
                )}
                toolbar={({ table }) => (
                    <div className="flex gap-2">
                        <DataTableImport config={contactImportConfig} organizationId={organizationId} />
                        <DataTableExport table={table} />
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Contacto
                        </Button>
                    </div>
                )}
                initialSorting={[{ id: "full_name", desc: false }]}
                gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                emptyState={
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="font-medium text-lg">No hay contactos</h3>
                        <p className="text-muted-foreground text-sm mt-1">Agrega tu primer contacto</p>
                    </div>
                }
            />

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
