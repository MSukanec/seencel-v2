"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactWithRelations, ContactCategory, ContactType } from "@/types/contact";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { PhoneInput } from "@/components/ui/phone-input";
import { TextField, NotesField, SegmentedField } from "@/components/shared/forms/fields";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "@/components/shared/forms/fields/field-wrapper";
import { Label } from "@/components/ui/label";
import { User, Building2, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";

import { ContactAvatarManager } from "@/features/contact/components/contact-avatar-manager";

const CONTACT_TYPE_OPTIONS = [
    { value: "person" as const, label: "Persona", icon: User },
    { value: "company" as const, label: "Empresa", icon: Building2 },
];

/** Simplified company contact for the combobox */
export interface CompanyOption {
    id: string;
    name: string;
}

interface ContactFormProps {
    organizationId: string;
    contactCategories: ContactCategory[];
    /** Available company contacts for linking */
    companyContacts?: CompanyOption[];
    initialData?: ContactWithRelations;
    /** 🚀 Optimistic callback: parent handles server call + optimistic UI */
    onOptimisticSubmit?: (data: any, categoryIds: string[]) => void;
}

export function ContactForm({ organizationId, contactCategories, companyContacts = [], initialData, onOptimisticSubmit }: ContactFormProps) {
    const { closeModal } = useModal();
    const [contactType, setContactType] = useState<ContactType>(initialData?.contact_type || "person");
    const [showMore, setShowMore] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        first_name: initialData?.first_name || "",
        last_name: initialData?.last_name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        company_name: initialData?.company_name || "",
        company_id: initialData?.company_id || "",
        national_id: initialData?.national_id || "",
        location: initialData?.location || "",
        notes: initialData?.notes || "",
        image_url: initialData?.image_url || "",
        categoryIds: initialData?.contact_categories ? initialData.contact_categories.map(c => c.id) : [] as string[]
    });

    const isPerson = contactType === "person";

    // Filter out current contact from company options (avoid self-reference)
    const availableCompanies = useMemo(() => {
        return companyContacts.filter(c => c.id !== initialData?.id);
    }, [companyContacts, initialData?.id]);

    // Combobox options for company selection
    const companyOptions = useMemo(() => {
        return availableCompanies.map(c => ({
            value: c.id,
            label: c.name,
            fallback: c.name.substring(0, 2).toUpperCase(),
        }));
    }, [availableCompanies]);

    const toggleCategory = (categoryId: string) => {
        setFormData(prev => {
            const exists = prev.categoryIds.includes(categoryId);
            if (exists) return { ...prev, categoryIds: prev.categoryIds.filter(id => id !== categoryId) };
            return { ...prev, categoryIds: [...prev.categoryIds, categoryId] };
        });
    };

    const handleContactTypeChange = (type: ContactType) => {
        setContactType(type);
        if (type === "company") {
            setFormData(prev => ({ ...prev, last_name: "", company_name: "", company_id: "" }));
        }
    };

    const handleCompanySelect = (companyId: string) => {
        if (companyId === formData.company_id) {
            // Deselect
            setFormData(prev => ({ ...prev, company_id: "", company_name: "" }));
        } else {
            const company = availableCompanies.find(c => c.id === companyId);
            setFormData(prev => ({
                ...prev,
                company_id: companyId,
                company_name: company?.name || "",
            }));
        }
    };

    const handleClearCompany = () => {
        setFormData(prev => ({ ...prev, company_id: "", company_name: "" }));
    };

    // 🚀 OPTIMISTIC: Build payload and delegate to parent — no server call here
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = isPerson
            ? `${formData.first_name} ${formData.last_name}`.trim()
            : formData.first_name.trim();

        const dataToSave = {
            contact_type: contactType,
            first_name: formData.first_name,
            last_name: isPerson ? formData.last_name : null,
            full_name: fullName,
            email: formData.email.trim() || null,
            phone: formData.phone || null,
            company_id: isPerson && formData.company_id ? formData.company_id : null,
            company_name: isPerson ? (formData.company_name || null) : null,
            national_id: formData.national_id.trim() || null,
            location: formData.location || null,
            notes: formData.notes || null,
            image_url: formData.image_url || null,
        };

        // Delegate to parent — parent handles optimistic update + server call
        onOptimisticSubmit?.(dataToSave, formData.categoryIds);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-full min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">

                {/* Avatar Section */}
                <div className="flex justify-center pb-2">
                    <ContactAvatarManager
                        initials={formData.first_name?.[0] || formData.last_name?.[0] || "?"}
                        currentPath={formData.image_url}
                        onPathChange={(path) => setFormData(prev => ({ ...prev, image_url: path || "" }))}
                    />
                </div>

                {/* Contact Type Toggle - Below Avatar, Full Width */}
                <SegmentedField
                    value={contactType}
                    onChange={handleContactTypeChange}
                    options={CONTACT_TYPE_OPTIONS}
                />

                {/* Name Fields */}
                {isPerson ? (
                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Nombre"
                            value={formData.first_name}
                            onChange={(val) => setFormData({ ...formData, first_name: val })}
                            placeholder="Ej. Juan"
                            required={true}
                            autoFocus
                        />
                        <TextField
                            label="Apellido"
                            value={formData.last_name}
                            onChange={(val) => setFormData({ ...formData, last_name: val })}
                            placeholder="Ej. Pérez"
                            required={false}
                        />
                    </div>
                ) : (
                    <TextField
                        label="Nombre de la Empresa"
                        value={formData.first_name}
                        onChange={(val) => setFormData({ ...formData, first_name: val })}
                        placeholder="Ej. Constructora ABC"
                        required={true}
                        autoFocus
                    />
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                    <TextField
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(val) => setFormData({ ...formData, email: val })}
                        placeholder={isPerson ? "juan@ejemplo.com" : "info@empresa.com"}
                        required={false}
                    />
                    <FormGroup label={<FactoryLabel label="Teléfono" />} required={false}>
                        <PhoneInput
                            defaultCountry="AR"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                            placeholder="+54 9 11..."
                        />
                    </FormGroup>
                </div>

                {/* Company field (only for person) */}
                {isPerson && (
                    <FormGroup label={<FactoryLabel label="Empresa" />} required={false}>
                        {companyContacts.length > 0 ? (
                            <div className="space-y-2">
                                {formData.company_id ? (
                                    /* Linked company - show selected with clear button */
                                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/30">
                                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm flex-1 truncate">
                                            {availableCompanies.find(c => c.id === formData.company_id)?.name || formData.company_name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleClearCompany}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    /* Combobox to select or type */
                                    <Combobox
                                        value={formData.company_id}
                                        onValueChange={handleCompanySelect}
                                        options={companyOptions}
                                        placeholder="Seleccionar empresa..."
                                        searchPlaceholder="Buscar empresa..."
                                        emptyMessage="No hay empresas registradas"
                                    />
                                )}
                                {!formData.company_id && (
                                    <input
                                        type="text"
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        placeholder="O escribí el nombre manualmente"
                                        className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none h-9 dark:bg-input/30"
                                    />
                                )}
                            </div>
                        ) : (
                            /* No company contacts - simple text field */
                            <input
                                type="text"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                placeholder="Nombre de la empresa"
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none h-9 dark:bg-input/30"
                            />
                        )}
                    </FormGroup>
                )}

                {/* Collapsible: Additional Fields */}
                <Collapsible open={showMore} onOpenChange={setShowMore}>
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2"
                        >
                            <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                showMore && "rotate-180"
                            )} />
                            {showMore ? "Ver menos" : "Ver más campos"}
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-1">
                        {/* Categories */}
                        <FormGroup label={<FactoryLabel label="Categorías" />} required={false}>
                            <div className="flex flex-wrap gap-2 border rounded-md p-3 bg-muted/20">
                                {contactCategories.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No hay categorías disponibles.</p>
                                ) : (
                                    contactCategories.map(category => (
                                        <div key={category.id} className="flex items-center space-x-2 bg-background border px-2 py-1 rounded-sm">
                                            <Checkbox
                                                id={`category-${category.id}`}
                                                checked={formData.categoryIds.includes(category.id)}
                                                onCheckedChange={() => toggleCategory(category.id)}
                                            />
                                            <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                                                {category.name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </FormGroup>

                        <TextField
                            label={isPerson ? "Documento / ID" : "ID Fiscal"}
                            value={formData.national_id}
                            onChange={(val) => setFormData({ ...formData, national_id: val })}
                            placeholder={isPerson ? "Ej. DNI, CUIT, Pasaporte..." : "Ej. CUIT, RFC, NIT, EIN..."}
                            required={false}
                        />
                        <TextField
                            label="Ubicación"
                            value={formData.location}
                            onChange={(val) => setFormData({ ...formData, location: val })}
                            placeholder="Ciudad, País"
                            required={false}
                        />
                        <NotesField
                            value={formData.notes}
                            onChange={(val) => setFormData({ ...formData, notes: val })}
                            placeholder="Información adicional..."
                            rows={4}
                        />
                    </CollapsibleContent>
                </Collapsible>

            </div>

            <FormFooter
                onCancel={closeModal}
                submitLabel={initialData ? "Guardar Cambios" : "Crear Contacto"}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
