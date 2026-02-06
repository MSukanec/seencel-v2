/**
 * Contact Field Factory
 * Standard 19.13 - Reusable Contact/Provider Selector
 * 
 * Provides a standardized contact selector with:
 * - Combobox with search functionality
 * - Avatar + full name display
 * - Alphabetical ordering
 * - Support for different contact types (clients/providers/contacts)
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";
import { useMemo } from "react";

export interface Contact {
    id: string;
    name: string;
    avatar_url?: string | null;
    company_name?: string | null;
}

export interface ContactFieldProps {
    /** Current selected contact ID */
    value: string;
    /** Callback when contact changes */
    onChange: (value: string) => void;
    /** List of available contacts */
    contacts: Contact[];
    /** Field label (default: "Contacto") */
    label?: string;
    /** Is field required? (default: false) */
    required?: boolean;
    /** Is field disabled? */
    disabled?: boolean;
    /** Custom className for FormGroup */
    className?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Empty state message */
    emptyMessage?: string;
    /** Allow selecting "none" option */
    allowNone?: boolean;
    /** "None" option label */
    noneLabel?: string;
}

/**
 * Get initials from a name for avatar fallback
 */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export function ContactField({
    value,
    onChange,
    contacts,
    label = "Contacto",
    required = false,
    disabled = false,
    className,
    placeholder = "Seleccionar contacto",
    searchPlaceholder = "Buscar contacto...",
    emptyMessage = "No se encontraron contactos.",
    allowNone = true,
    noneLabel = "Sin contacto asignado",
}: ContactFieldProps) {

    // Transform contacts to combobox options with avatar support
    const options: ComboboxOption[] = useMemo(() => {
        const sortedContacts = [...contacts].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        );

        const contactOptions: ComboboxOption[] = sortedContacts.map((contact) => ({
            value: contact.id,
            label: contact.name,
            image: contact.avatar_url,
            fallback: getInitials(contact.name),
            // Include company name in search terms
            searchTerms: contact.company_name || undefined,
        }));

        if (allowNone) {
            return [
                { value: "none", label: noneLabel },
                ...contactOptions,
            ];
        }

        return contactOptions;
    }, [contacts, allowNone, noneLabel]);

    return (
        <FormGroup label={<FactoryLabel label={label} />} required={required} className={className}>
            <Combobox
                value={value || "none"}
                onValueChange={(val) => onChange(val === "none" ? "" : val)}
                options={options}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyMessage={emptyMessage}
                disabled={disabled}
                modal={true}
            />
        </FormGroup>
    );
}
