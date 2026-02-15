"use client";

// ============================================================================
// ORGANIZATION DETAILS FORM
// ============================================================================
// Vista de información de la organización usando SettingsSection layout.
// Secciones:
//   1. Logo de la Organización
//   2. Información General (nombre, descripción)
//   3. Datos de Contacto (CUIT, email, teléfono, web)
// ============================================================================

import { useRef, useCallback, useState } from "react";
import { SettingsSection, SettingsSectionContainer } from "@/components/shared/settings-section";
import { TextField, NotesField, PhoneField } from "@/components/shared/forms/fields";
import { updateOrganization } from "@/actions/update-organization";
import { OrganizationLogoUpload } from "./organization-logo-upload";
import { toast } from "sonner";
import {
    Building2,
    FileText,
    Phone,
} from "lucide-react";

// ── Props ──
interface OrganizationDetailsFormProps {
    organization: any;
}

export function OrganizationDetailsForm({ organization }: OrganizationDetailsFormProps) {
    const orgDataRaw = organization.organization_data;
    const orgData = Array.isArray(orgDataRaw) ? orgDataRaw[0] : orgDataRaw || {};

    const logoUrl = organization.logo_url || null;

    // ── Form state ──
    const [name, setName] = useState(organization.name || "");
    const [description, setDescription] = useState(orgData.description || "");
    const [taxId, setTaxId] = useState(orgData.tax_id || "");
    const [email, setEmail] = useState(orgData.email || "");
    const [phone, setPhone] = useState(orgData.phone || "");
    const [website, setWebsite] = useState(orgData.website || "");

    // ── Debounced auto-save (1000ms) for text fields ──
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const triggerAutoSave = useCallback((fields: {
        name: string;
        description: string;
        tax_id: string;
        email: string;
        phone: string;
        website: string;
    }) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            if (!fields.name.trim()) return; // name is required

            try {
                const formData = new FormData();
                formData.set("name", fields.name);
                formData.set("description", fields.description);
                formData.set("tax_id", fields.tax_id);
                formData.set("email", fields.email);
                formData.set("phone", fields.phone);
                formData.set("website", fields.website);

                const result = await updateOrganization(organization.id, formData);
                if (result?.error) {
                    toast.error("Error al guardar", { description: result.error });
                } else {
                    toast.success("¡Cambios guardados!");
                }
            } catch {
                toast.error("Error al guardar los cambios.");
            }
        }, 1000);
    }, [organization.id]);

    // ── Field change handlers ──
    const handleNameChange = (value: string) => {
        setName(value);
        triggerAutoSave({ name: value, description, tax_id: taxId, email, phone, website });
    };

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        triggerAutoSave({ name, description: value, tax_id: taxId, email, phone, website });
    };

    const handleTaxIdChange = (value: string) => {
        setTaxId(value);
        triggerAutoSave({ name, description, tax_id: value, email, phone, website });
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        triggerAutoSave({ name, description, tax_id: taxId, email: value, phone, website });
    };

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        triggerAutoSave({ name, description, tax_id: taxId, email, phone: value, website });
    };

    const handleWebsiteChange = (value: string) => {
        setWebsite(value);
        triggerAutoSave({ name, description, tax_id: taxId, email, phone, website: value });
    };

    return (
        <SettingsSectionContainer>

            {/* ── Logo de la Organización ── */}
            <SettingsSection
                icon={Building2}
                title="Logo"
                description="Imagen que representa tu organización. Se usa en documentos PDF, portal de clientes y encabezados."
            >
                <OrganizationLogoUpload
                    organizationId={organization.id}
                    initialLogoUrl={logoUrl}
                    organizationName={organization.name}
                />
            </SettingsSection>

            {/* ── Información General ── */}
            <SettingsSection
                icon={FileText}
                title="Información General"
                description="Nombre y descripción de tu organización. El nombre aparece en toda la plataforma."
            >
                <div className="space-y-4">
                    <TextField
                        label="Nombre de la Organización"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="Ej: Constructora Norte S.A."
                        required
                    />
                    <NotesField
                        label="Descripción"
                        value={description}
                        onChange={handleDescriptionChange}
                        placeholder="Una breve descripción de tu empresa, actividad principal..."
                        rows={4}
                    />
                </div>
            </SettingsSection>

            {/* ── Datos de Contacto ── */}
            <SettingsSection
                icon={Phone}
                title="Datos de Contacto"
                description="Información fiscal y de contacto. Se usa en presupuestos, facturas y documentos generados."
            >
                <div className="space-y-4">
                    <TextField
                        label="CUIT / CIF"
                        value={taxId}
                        onChange={handleTaxIdChange}
                        placeholder="Ej: 30-12345678-9"
                    />
                    <TextField
                        label="Correo Electrónico"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="contacto@empresa.com"
                    />
                    <PhoneField
                        label="Teléfono"
                        value={phone}
                        onChange={handlePhoneChange}
                    />
                    <TextField
                        label="Sitio Web"
                        value={website}
                        onChange={handleWebsiteChange}
                        placeholder="https://www.ejemplo.com"
                    />
                </div>
            </SettingsSection>

        </SettingsSectionContainer>
    );
}
