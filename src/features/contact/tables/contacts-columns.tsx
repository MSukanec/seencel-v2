"use client";

/**
 * Contacts — Column Definitions (Column Factories)
 *
 * Standard 19.0: Columns + constants extraídas de la vista.
 * Inline editing via onInlineUpdate callback.
 */

import { type ColumnDef } from "@tanstack/react-table";
import {
    createTextColumn,
    createEntityColumn,
} from "@/components/shared/data-table/columns";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { ContactWithRelations, ContactCategory } from "@/types/contact";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Building2, Tag, Users, User } from "lucide-react";
import { CategoryPopoverContent } from "@/components/shared/popovers";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// ─── Contact Type Config ────────────────────────────────

export const CONTACT_TYPE_LABELS: Record<string, string> = {
    person: "Persona",
    company: "Empresa",
};

export const CONTACT_TYPE_OPTIONS = Object.entries(CONTACT_TYPE_LABELS).map(
    ([value, label]) => ({ label, value })
);

// ─── Column Factory ─────────────────────────────────────

interface ContactColumnsOptions {
    /** Inline update callback — receives row + changed fields */
    onInlineUpdate?: (row: ContactWithRelations, fields: Record<string, any>) => Promise<void> | void;
    /** Available contact categories for inline editing */
    contactCategories?: ContactCategory[];
    /** Available company contacts for inline company assignment */
    companyContacts?: { id: string; name: string }[];
}

export function getContactColumns(
    options: ContactColumnsOptions = {}
): ColumnDef<ContactWithRelations>[] {
    const { onInlineUpdate, contactCategories = [], companyContacts = [] } = options;

    // Company entity options for inline editing
    const companyEntityOptions = companyContacts.map(c => ({
        value: c.id,
        label: c.name,
    }));

    return [
        // 1. Nombre — avatar + full_name + company subtitle
        {
            accessorKey: "full_name",
            header: "Nombre",
            cell: ({ row }) => {
                const contact = row.original;
                const avatarUrl = contact.resolved_avatar_url || contact.image_url;
                const initials = contact.contact_type === "company"
                    ? (contact.first_name?.[0]?.toUpperCase() || "E")
                    : `${contact.first_name?.[0] || ""}${contact.last_name?.[0] || ""}`;

                return (
                    <DataTableAvatarCell
                        src={avatarUrl}
                        fallback={initials}
                        title={contact.full_name || "Sin nombre"}
                        subtitle={
                            contact.contact_type === "person"
                                ? contact.resolved_company_name || undefined
                                : undefined
                        }
                    />
                );
            },
            enableSorting: true,
        },

        createEntityColumn<ContactWithRelations>({
            accessorKey: "contact_type",
            title: "Tipo",
            labels: CONTACT_TYPE_LABELS,
            icon: Users,
            optionIcons: {
                person: <User className="h-3.5 w-3.5 text-muted-foreground" />,
                company: <Building2 className="h-3.5 w-3.5 text-muted-foreground" />,
            },
            editable: !!onInlineUpdate,
            entityOptions: CONTACT_TYPE_OPTIONS,
            editSearchPlaceholder: "Seleccionar tipo...",
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { contact_type: newValue })
                : undefined,
        }),

        // 3. Email (inline editable)
        createTextColumn<ContactWithRelations>({
            accessorKey: "email",
            title: "Email",
            emptyValue: "—",
            fillWidth: false,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { email: newValue })
                : undefined,
        }),

        // 4. Teléfono (inline editable)
        createTextColumn<ContactWithRelations>({
            accessorKey: "phone",
            title: "Teléfono",
            emptyValue: "—",
            fillWidth: false,
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { phone: newValue })
                : undefined,
        }),

        // 5. Categorías — badges + inline popover editing
        {
            id: "categories",
            accessorKey: "contact_categories",
            header: "Categorías",
            cell: ({ row }) => {
                const contact = row.original;
                const categories = contact.contact_categories;
                const currentIds = categories?.map(c => c.id) || [];

                const badgeContent = (
                    <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                        {!categories || categories.length === 0 ? (
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                —
                            </span>
                        ) : (
                            <>
                                <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal whitespace-nowrap">
                                    {categories[0].name}
                                </Badge>
                                {categories.length > 1 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{categories.length - 1}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                );

                // If not editable, just show badges
                if (!onInlineUpdate || contactCategories.length === 0) {
                    return badgeContent;
                }

                // Editable: wrap in Popover with CategoryPopoverContent
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {badgeContent}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[220px] p-0"
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CategoryPopoverContent
                                currentValues={currentIds}
                                onToggle={(categoryId: string) => {
                                    const newIds = currentIds.includes(categoryId)
                                        ? currentIds.filter(id => id !== categoryId)
                                        : [...currentIds, categoryId];
                                    onInlineUpdate(contact, { _categoryIds: newIds });
                                }}
                                options={contactCategories.map(c => ({ value: c.id, label: c.name }))}
                                manageRoute={{ pathname: "/organization/contacts/categories" as any }}
                                manageLabel="Gestionar categorías"
                            />
                        </PopoverContent>
                    </Popover>
                );
            },
            enableSorting: false,
            // Context menu metadata so categories appear in right-click
            ...(onInlineUpdate && contactCategories.length > 0 ? {
                meta: {
                    contextMenu: {
                        label: "Categorías",
                        icon: Tag,
                        type: "action" as const,
                        onAction: () => {}, // Categories use inline popover, not context submenu
                    },
                },
            } : {}),
        },

        // 6. Ubicación (inline editable)
        createTextColumn<ContactWithRelations>({
            accessorKey: "location",
            title: "Ubicación",
            muted: true,
            emptyValue: "—",
            editable: !!onInlineUpdate,
            onUpdate: onInlineUpdate
                ? (row, newValue) => onInlineUpdate(row, { location: newValue })
                : undefined,
        }),

        // 7. Estado (Seencel / Organización) — read-only badges
        {
            id: "status_badges",
            header: "Estado",
            cell: ({ row }) => {
                const contact = row.original;
                return (
                    <div className="flex items-center gap-1">
                        {contact.linked_user_id && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5 whitespace-nowrap">
                                <ShieldCheck className="h-2.5 w-2.5" />
                                Seencel
                            </Badge>
                        )}
                        {contact.is_organization_member && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5 whitespace-nowrap">
                                <Building2 className="h-2.5 w-2.5" />
                                Org
                            </Badge>
                        )}
                    </div>
                );
            },
            enableSorting: false,
        },
    ];
}
