"use client";

/**
 * Contact Form — Panel Self-Contained
 * Hybrid Chip Form — Linear-inspired
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title + desc)    │  ← setPanelMeta
 * ├─────────────────────────────────┤
 * │ Avatar                          │
 * │ Persona / Empresa toggle        │
 * │ Hero: Nombre (big)              │
 * │ Hero: Apellido (big)            │
 * │ Email + Teléfono                │
 * │ Empresa                         │
 * │ ▸ Ver más campos                │
 * ├─────────────────────────────────┤
 * │ Footer: Cancelar + Submit       │  ← container-managed
 * └─────────────────────────────────┘
 */

import { useState, useMemo, useEffect, useTransition, useRef } from "react";
import { ContactWithRelations, ContactCategory, ContactType } from "@/types/contact";
import { usePanel } from "@/stores/panel-store";
import { useRouter } from "@/i18n/routing";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormHeroField } from "@/components/shared/forms/fields/form-hero-field";
import { FormNotesField } from "@/components/shared/forms/fields/form-notes-field";
import { FormReferenceField } from "@/components/shared/forms/fields/form-reference-field";
import { ChipRow, CategoryChip, SelectChip } from "@/components/shared/chips";
import { User, Building2, Loader2, ShieldCheck, Users, Mail, Phone, MapPin, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AttachmentChip } from "@/components/shared/chips";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { getContactFiles } from "@/features/contact/actions/contact-files-actions";

/** Traducción de actor_type a label legible */
const ACTOR_TYPE_LABELS: Record<string, string> = {
    client: "Cliente",
    field_worker: "Trabajador de Campo",
    accountant: "Contador",
    external_site_manager: "Director de Obra Externo",
    subcontractor_portal_user: "Subcontratista",
};
import { toast } from "sonner";

import { ContactAvatarManager } from "@/features/contact/components/contact-avatar-manager";
import { createContact, updateContact, getContactCategories, checkSeencelUser } from "@/actions/contacts";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const CONTACT_TYPE_CHIP_OPTIONS = [
    { value: "person", label: "Persona", icon: <User className="h-3.5 w-3.5 text-muted-foreground" /> },
    { value: "company", label: "Empresa", icon: <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> },
];

/** Simplified company contact for the combobox */
export interface CompanyOption {
    id: string;
    name: string;
}

// ============================================================================
// Props — Panel-compatible: receives formId from PanelProvider
// ============================================================================

interface ContactFormProps {
    organizationId: string;
    /** If provided, form is in EDIT mode */
    initialData?: ContactWithRelations;
    /** Simple callback after successful create/update */
    onSuccess?: () => void;
    /** Injected by PanelProvider — connects form to panel footer submit button */
    formId?: string;

    // ── Data props ──
    contactCategories?: ContactCategory[];
    companyContacts?: CompanyOption[];
}

// ============================================================================
// Component (Panel Self-Contained)
// ============================================================================

export function ContactForm({
    organizationId,
    initialData,
    onSuccess,
    formId,
    contactCategories: externalCategories,
    companyContacts: externalCompanyContacts,
}: ContactFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    const [contactType, setContactType] = useState<ContactType>(initialData?.contact_type || "person");
    const [showMore, setShowMore] = useState(false);

    // ── Files / Attachments State ───────────────────────────────────────
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [tempId] = useState(() => `temp_${Math.random().toString(36).substring(2, 9)}`);
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    // Load existing files if editing
    useEffect(() => {
        if (!isEditing || !initialData) return;
        getContactFiles(initialData.id, organizationId).then(serverFiles => {
            setFiles(serverFiles.map(f => ({
                id: f.id,
                url: f.url,
                name: f.name,
                type: f.type,
                size: f.size,
                path: f.path,
                bucket: f.bucket,
            })));
        }).catch(console.error);
    }, [isEditing, initialData, organizationId]);

    // 🚨 OBLIGATORIO: Self-describe via setPanelMeta
    useEffect(() => {
        setPanelMeta({
            icon: Users,
            title: isEditing ? "Editar Contacto" : "Nuevo Contacto",
            description: isEditing
                ? `Modificando a ${initialData?.full_name || 'contacto'}`
                : "Agrega un nuevo contacto a tu organización.",
            size: "lg",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Crear Contacto",
            },
        });
    }, [isEditing, initialData?.full_name, setPanelMeta]);

    // ── Fetched Data (solo si NO se pasan como props) ───────────────────
    const [fetchedCategories, setFetchedCategories] = useState<ContactCategory[]>([]);
    const [fetchedCompanies, setFetchedCompanies] = useState<CompanyOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Use external data if provided, otherwise use fetched data
    const contactCategories = externalCategories ?? fetchedCategories;
    const companyContacts = externalCompanyContacts ?? fetchedCompanies;

    // Fetch categories + company contacts if not provided externally
    useEffect(() => {
        if (externalCategories && externalCompanyContacts) return;

        const fetchAuxData = async () => {
            setIsLoadingData(true);
            try {
                if (!externalCategories) {
                    const categories = await getContactCategories(organizationId);
                    setFetchedCategories(categories);
                }

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
        if (!email || !email.includes('@') || isLinkedToUser || email === lastCheckedEmail) return;

        setIsCheckingEmail(true);
        try {
            const result = await checkSeencelUser(email);
            setSeencelUserMatch(result);

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
            media_files: files.length > 0 ? files : undefined,
        };

        closePanel();
        toast.success(isEditing ? "Contacto actualizado" : "Contacto creado");

        startTransition(async () => {
            try {
                if (isEditing && initialData) {
                    await updateContact(initialData.id, dataToSave, formData.categoryIds);
                } else {
                    await createContact(organizationId, dataToSave, formData.categoryIds);
                }
                onSuccess?.();
            } catch (error: any) {
                toast.error(error.message || "Error al guardar el contacto");
                router.refresh();
            }
        });
    };

    // 🚨 OBLIGATORIO: <form id={formId}> — conecta con el footer del container
    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col flex-1">

            {/* ── Chips (SIEMPRE arriba de todo) ──────────── */}
            <ChipRow>
                <SelectChip
                    value={contactType}
                    onChange={(val) => handleContactTypeChange(val as ContactType)}
                    options={CONTACT_TYPE_CHIP_OPTIONS}
                    icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Tipo"
                    disabled={isLinkedToUser}
                    popoverWidth={160}
                />
                {isPerson && (
                    <SelectChip
                        value={formData.company_id}
                        onChange={(val) => {
                            const company = availableCompanies.find(c => c.id === val);
                            setFormData(prev => ({
                                ...prev,
                                company_id: val,
                                company_name: company?.name || "",
                            }));
                        }}
                        options={availableCompanies.map(c => ({
                            value: c.id,
                            label: c.name,
                            icon: <Building2 className="h-3.5 w-3.5 text-muted-foreground" />,
                        }))}
                        icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                        emptyLabel="Empresa"
                        searchPlaceholder="Buscar empresa..."
                        popoverWidth={220}
                        onCreateNew={async (name) => {
                            try {
                                const newCompany = await createContact(organizationId, {
                                    contact_type: "company",
                                    first_name: name,
                                    full_name: name,
                                }, []);
                                if (newCompany?.id) {
                                    setFormData(prev => ({
                                        ...prev,
                                        company_id: newCompany.id,
                                        company_name: name,
                                    }));
                                    toast.success(`Empresa "${name}" creada`);
                                    return newCompany.id;
                                }
                            } catch {
                                toast.error("Error al crear la empresa");
                            }
                        }}
                        createLabel="Crear empresa"
                    />
                )}
                <CategoryChip
                    value={formData.categoryIds}
                    onChange={toggleCategory}
                    options={contactCategories.map(c => ({ value: c.id, label: c.name }))}
                    manageRoute={{ pathname: "/organization/contacts/categories" as any }}
                    manageLabel="Gestionar categorías"
                />
                <AttachmentChip
                    value={files}
                    onChange={setFiles}
                    bucket="private-assets"
                    folderPath={`organizations/${organizationId}/contacts/attachments/${isEditing ? initialData.id : tempId}`}
                    maxSizeMB={10}
                    cleanupRef={uploadCleanupRef}
                />
            </ChipRow>

            {/* ── Avatar + Type Toggle ─────────────────── */}
            <div className="space-y-4 mb-2">
                {/* Avatar Section */}
                <div className="flex justify-center pt-2">
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

            </div>

            {/* ── Hero: Name Fields (stacked) ────────────── */}
            {isPerson ? (
                <>
                    <FormHeroField
                        value={formData.first_name}
                        onChange={(val) => setFormData(prev => ({ ...prev, first_name: val }))}
                        placeholder="Nombre..."
                        autoFocus={!isLinkedToUser}
                    />
                    <FormHeroField
                        value={formData.last_name}
                        onChange={(val) => setFormData(prev => ({ ...prev, last_name: val }))}
                        placeholder="Apellido..."
                        className="border-t-0"
                    />
                </>
            ) : (
                <FormHeroField
                    value={formData.first_name}
                    onChange={(val) => setFormData(prev => ({ ...prev, first_name: val }))}
                    placeholder="Nombre de la Empresa..."
                    autoFocus
                />
            )}

            {/* ── Borderless fields below hero ──────────── */}
            <div className="flex-1 mt-4 space-y-1">

                {/* Email */}
                <div className="border-t border-border/10 pt-2 mt-1">
                    <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (seencelUserMatch) setSeencelUserMatch(null);
                            }}
                            onBlur={handleEmailBlur}
                            placeholder={isPerson ? "juan@ejemplo.com" : "info@empresa.com"}
                            disabled={isLinkedToUser}
                            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none border-none disabled:opacity-50"
                        />
                    </div>
                    {(isLinkedToUser || seencelUserMatch || isCheckingEmail) && (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 ml-5.5">
                            {isLinkedToUser
                                ? "Sincronizado desde el perfil del usuario"
                                : seencelUserMatch
                                    ? "✓ Usuario de Seencel detectado — se vinculará al guardar"
                                    : "Verificando..."}
                        </p>
                    )}
                </div>

                {/* Phone */}
                <div className="border-t border-border/10 pt-2 mt-1">
                    <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <PhoneInput
                            defaultCountry="AR"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                            placeholder="+54 9 11..."
                            className="[&_button]:h-7 [&_button]:text-xs [&_button]:border-none [&_button]:bg-transparent [&_button]:shadow-none [&_button]:px-1 [&_input]:h-7 [&_input]:text-sm [&_input]:border-none [&_input]:bg-transparent [&_input]:shadow-none [&_input]:placeholder:text-muted-foreground/30"
                        />
                    </div>
                </div>

                {/* Documento / ID */}
                <FormReferenceField
                    value={formData.national_id}
                    onChange={(val) => setFormData({ ...formData, national_id: val })}
                    placeholder={isPerson ? "DNI, CUIT, Pasaporte..." : "CUIT, RFC, NIT, EIN..."}
                    prefix={<FileText className="h-3.5 w-3.5 text-muted-foreground/50" />}
                />

                {/* Ubicación */}
                <FormReferenceField
                    value={formData.location}
                    onChange={(val) => setFormData({ ...formData, location: val })}
                    placeholder="Ciudad, País"
                    prefix={<MapPin className="h-3.5 w-3.5 text-muted-foreground/50" />}
                />

                {/* Notas */}
                <div className="border-t border-border/10 pt-2 mt-1">
                    <FormNotesField
                        value={formData.notes}
                        onChange={(val) => setFormData({ ...formData, notes: val })}
                        placeholder="Información adicional..."
                        rows={3}
                    />
                </div>
            </div>
        </form>
    );
}
