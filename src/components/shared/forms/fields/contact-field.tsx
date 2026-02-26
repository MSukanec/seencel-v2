/**
 * Contact Field Factory (Smart)
 * Standard 19.13 - Reusable Contact/Provider Selector
 *
 * - Self-populating: reads contacts from useFormData().clients store
 * - Avatar: prioridad resolved_avatar_url (Google OAuth) > avatar_url (legacy)
 * - Tooltip: explica que "Cliente = Contacto", incluye link a la página de Contactos
 * - Override: pass `contacts` prop to use custom list
 */

"use client";

import { FormGroup } from "@/components/ui/form-group";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FactoryLabel } from "./field-wrapper";
import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useFormData } from "@/stores/organization-store";

export interface Contact {
    id: string;
    name: string;
    /** URL directa (Google, upload, etc) — legacy */
    avatar_url?: string | null;
    /** Campo resuelto por la contacts_view: combina Google + uploads propios */
    resolved_avatar_url?: string | null;
    company_name?: string | null;
}

export interface ContactFieldProps {
    value: string;
    onChange: (value: string) => void;
    /** Override: pass custom contacts list. Default: reads from store (.clients) */
    contacts?: Contact[];
    label?: string;
    tooltip?: React.ReactNode;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowNone?: boolean;
    noneLabel?: string;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Tooltip por defecto para el campo Cliente/Contacto.
 * Explica la relación "Cliente = Contacto" y que el presupuesto no requiere proyecto.
 */
const DEFAULT_CONTACT_TOOLTIP = (
    <span className="flex flex-col gap-1.5 text-xs leading-relaxed">
        <span>
            Seleccioná un{" "}
            <Link href="/organization/contacts" className="underline">
                Contacto
            </Link>{" "}
            de tu directorio. Es la persona o empresa a quien va dirigido
            este presupuesto.
        </span>
        <span className="text-muted-foreground">
            Este campo es <strong>opcional</strong>. Podés crear el presupuesto
            sin asignar un contacto y vincularlo después.
        </span>
    </span>
);

export function ContactField({
    value,
    onChange,
    contacts: contactsOverride,
    label = "Cliente",
    tooltip = DEFAULT_CONTACT_TOOLTIP,
    required = false,
    disabled = false,
    className,
    placeholder = "Seleccionar contacto",
    searchPlaceholder = "Buscar contacto...",
    emptyMessage = "No se encontraron contactos.",
    allowNone = true,
    noneLabel = "Sin cliente asignado",
}: ContactFieldProps) {
    // Smart: read from store by default, allow override
    const storeData = useFormData();
    const contacts = contactsOverride ?? (storeData.clients as Contact[]);

    const options: ComboboxOption[] = useMemo(() => {
        const sortedContacts = [...contacts].sort((a, b) =>
            a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
        );

        const contactOptions: ComboboxOption[] = sortedContacts.map((contact) => ({
            value: contact.id,
            label: contact.name,
            // Prioridad: resolved_avatar_url (contiene foto de Google OAuth) > avatar_url (legacy)
            image: contact.resolved_avatar_url || contact.avatar_url,
            fallback: getInitials(contact.name),
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
        <FormGroup
            label={<FactoryLabel label={label} />}
            required={required}
            tooltip={tooltip}
            className={className}
        >
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
