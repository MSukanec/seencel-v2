"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactWithRelations, ContactCategory, ContactType } from "@/types/contact";
import { useModal } from "@/stores/modal-store";
import { useRouter } from "@/i18n/routing";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { PhoneInput } from "@/components/ui/phone-input";
import { TextField, NotesField, SegmentedField } from "@/components/shared/forms/fields";
import { FormGroup } from "@/components/ui/form-group";
import { FactoryLabel } from "@/components/shared/forms/fields/field-wrapper";
import { Label } from "@/components/ui/label";
import { User, Building2, ChevronDown, X, Loader2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Traducción de actor_type a label legible */
const ACTOR_TYPE_LABELS: Record<string, string> = {
    client: "Cliente",
    field_worker: "Trabajador de Campo",
    accountant: "Contador",
    external_site_manager: "Director de Obra Externo",
    subcontractor_portal_user: "Subcontratista",
};
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";

import { ContactAvatarManager } from "@/features/contact/components/contact-avatar-manager";
import { createContact, updateContact, getContactCategories, checkSeencelUser } from "@/actions/contacts";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const CONTACT_TYPE_OPTIONS = [
    { value: "person" as const, label: "Persona", icon: User },
    { value: "company" as const, label: "Empresa", icon: Building2 },
];

/** Simplified company contact for the combobox */
export interface CompanyOption {
    id: string;
    name: string;
}

// ============================================================================
// Props — Minimal: el form fetchea sus datos auxiliares internamente
// ============================================================================

interface ContactFormProps {
    organizationId: string;
    /** If provided, form is in EDIT mode */
    initialData?: ContactWithRelations;
    /** Simple callback after successful create/update — parent does refresh */
    onSuccess?: () => void;

    // ── Legacy props (backward compat) ──────────────────────────────────
    // Cuando se pasan, se usan directamente en vez de fetchear.
    // Esto permite que las vistas existentes sigan funcionando sin cambios.
    contactCategories?: ContactCategory[];
    companyContacts?: CompanyOption[];
    /** @deprecated — Use onSuccess instead. Kept for backward compat with ContactsList. */
    onOptimisticSubmit?: (data: any, categoryIds: string[]) => void;
}

// ============================================================================
// Component (Semi-Autonomous)
// ============================================================================

export function ContactForm({
    organizationId,
    initialData,
    onSuccess,
    // Legacy props
    contactCategories: externalCategories,
    companyContacts: externalCompanyContacts,
    onOptimisticSubmit,
}: ContactFormProps) {
    const { closeModal } = useModal();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    const [contactType, setContactType] = useState<ContactType>(initialData?.contact_type || "person");
    const [showMore, setShowMore] = useState(false);

    // ── Fetched Data (solo si NO se pasan como props) ───────────────────
    const [fetchedCategories, setFetchedCategories] = useState<ContactCategory[]>([]);
    const [fetchedCompanies, setFetchedCompanies] = useState<CompanyOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Use external data if provided, otherwise use fetched data
    const contactCategories = externalCategories ?? fetchedCategories;
    const companyContacts = externalCompanyContacts ?? fetchedCompanies;

    // Fetch categories + company contacts if not provided externally
    useEffect(() => {
        if (externalCategories && externalCompanyContacts) return; // Already provided

        const fetchAuxData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch categories if not provided
                if (!externalCategories) {
                    const categories = await getContactCategories(organizationId);
                    setFetchedCategories(categories);
                }

                // Fetch company contacts if not provided
                if (!externalCompanyContacts) {
                    const supabase = createSupabaseClient();
                    const { data: companiesData } = await supabase
                        .schema("contacts").from("contacts")
                        .select("id, full_name, first_name")
                        .eq("organization_id", organizationId)
                        .eq("contact_type", "company")
                        .eq("is_deleted", false)
                        .order("full_name");

                    if (companiesData) {
                        setFetchedCompanies(
                            companiesData.map((c: any) => ({
                                id: c.id,
                                name: c.full_name || c.first_name || "",
                            }))
                        );
                    }
                }
            } catch (error) {
                console.error("Error fetching contact form data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAuxData();
    }, [organizationId, externalCategories, externalCompanyContacts]);

    // ── Form State ──────────────────────────────────────────────────────

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
    const isLinkedToUser = !!initialData?.linked_user_id;

    // ── Seencel User Match (email lookup) ──────────────────────────────
    const [seencelUserMatch, setSeencelUserMatch] = useState<{
        userId: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
        avatarUrl: string | null;
    } | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const lastCheckedEmail = useState<string>("")[0];

    const handleEmailBlur = async () => {
        const email = formData.email.trim();
        // Skip if: no email, already linked, same email already checked, or editing a linked contact
        if (!email || !email.includes('@') || isLinkedToUser || email === lastCheckedEmail) return;

        setIsCheckingEmail(true);
        try {
            const result = await checkSeencelUser(email);
            setSeencelUserMatch(result);

            // Auto-fill name and avatar if we found a match and fields are empty
            if (result) {
                const updates: Partial<typeof formData> = {};
                if (!formData.first_name && result.firstName) {
                    updates.first_name = result.firstName;
                }
                if (!formData.last_name && result.lastName) {
                    updates.last_name = result.lastName;
                }
                if (!formData.image_url && result.avatarUrl) {
                    updates.image_url = result.avatarUrl;
                }
                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates }));
                }
                toast.success("Usuario de Seencel detectado", {
                    description: `${result.firstName || ''} ${result.lastName || ''} será vinculado automáticamente al guardar.`.trim(),
                });
            }
        } catch {
            // Silently fail - not critical
        } finally {
            setIsCheckingEmail(false);
        }
    };

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

    // ── Submit ───────────────────────────────────────────────────────────

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

        // ── Legacy path: delegate to parent via onOptimisticSubmit ───────
        if (onOptimisticSubmit) {
            onOptimisticSubmit(dataToSave, formData.categoryIds);
            return;
        }

        // ── Autonomous path: form handles server call + lifecycle ────────
        closeModal();
        toast.success(isEditing ? "Contacto actualizado" : "Contacto creado");

        startTransition(async () => {
            try {
                if (isEditing && initialData) {
                    await updateContact(initialData.id, dataToSave, formData.categoryIds);
                } else {
                    await createContact(organizationId, dataToSave, formData.categoryIds);
                }
                onSuccess?.();
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Error al guardar el contacto");
                router.refresh();
            }
        });
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
                        readOnly={isLinkedToUser}
                    />
                </div>

                {/* Status Badges (linked contacts) */}
                {isLinkedToUser && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            En Seencel
                        </Badge>
                        {initialData?.is_organization_member && initialData?.member_role_name && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {initialData.member_role_name}
                            </Badge>
                        )}
                        {initialData?.external_actor_type && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                {ACTOR_TYPE_LABELS[initialData.external_actor_type] || initialData.external_actor_type}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Contact Type Toggle - Below Avatar, Full Width */}
                <SegmentedField
                    value={contactType}
                    onChange={handleContactTypeChange}
                    options={CONTACT_TYPE_OPTIONS}
                    disabled={isLinkedToUser}
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
                            autoFocus={!isLinkedToUser}
                            disabled={isLinkedToUser}
                            helpText={isLinkedToUser ? "Sincronizado desde el perfil del usuario" : undefined}
                        />
                        <TextField
                            label="Apellido"
                            value={formData.last_name}
                            onChange={(val) => setFormData({ ...formData, last_name: val })}
                            placeholder="Ej. Pérez"
                            required={false}
                            disabled={isLinkedToUser}
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
                        onChange={(val) => {
                            setFormData({ ...formData, email: val });
                            // Clear match if email changed
                            if (seencelUserMatch) setSeencelUserMatch(null);
                        }}
                        onBlur={handleEmailBlur}
                        placeholder={isPerson ? "juan@ejemplo.com" : "info@empresa.com"}
                        required={false}
                        disabled={isLinkedToUser}
                        helpText={
                            isLinkedToUser
                                ? "Sincronizado desde el perfil del usuario"
                                : seencelUserMatch
                                    ? "✓ Usuario de Seencel detectado — se vinculará al guardar"
                                    : isCheckingEmail
                                        ? "Verificando..."
                                        : undefined
                        }
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
                        ) : isLoadingData ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Cargando empresas...</span>
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
                            {isLoadingData && !externalCategories ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Cargando categorías...</span>
                                </div>
                            ) : (
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
                            )}
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
                isLoading={isPending}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
