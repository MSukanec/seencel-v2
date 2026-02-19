
"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { ContactField, type Contact } from "@/components/shared/forms/fields/contact-field";
import { SelectField } from "@/components/shared/forms/fields/select-field";
import { NotesField } from "@/components/shared/forms/fields/notes-field";
import { ProjectField, type Project } from "@/components/shared/forms/fields/project-field";
import { Input } from "@/components/ui/input";
import { createClientAction, updateClientAction, inviteClientToProjectAction } from "@/features/clients/actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { Info, UserPlus, Users } from "lucide-react";
import type { ClientRole, ProjectClientView } from "../types";

// ============================================================================
// Types
// ============================================================================

type FormMode = "contact" | "email";

interface ClientFormProps {
    orgId: string;
    roles: ClientRole[];
    /** When provided, project field is hidden (implicit) */
    projectId?: string;
    /** If provided, form is in EDIT mode */
    initialData?: ProjectClientView;
    /** Custom submit button label (default: "Agregar Cliente") */
    submitLabel?: string;
}

// ============================================================================
// Component (Semi-Autonomous)
// ============================================================================

export function ClientForm({
    orgId,
    roles,
    projectId,
    initialData,
    submitLabel,
}: ClientFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData;

    // ── Mode toggle (only for create, not edit) ─────────────────────────
    const [mode, setMode] = useState<FormMode>("contact");

    // ── Form State (shared) ─────────────────────────────────────────────
    const [selectedProjectId, setSelectedProjectId] = useState(initialData?.project_id || projectId || "");
    const [clientRoleId, setClientRoleId] = useState(initialData?.client_role_id || "");
    const [notes, setNotes] = useState(initialData?.notes || "");

    // ── Mode A: Contact existing ────────────────────────────────────────
    const [contactId, setContactId] = useState(initialData?.contact_id || "");

    // ── Mode B: Email invite ────────────────────────────────────────────
    const [email, setEmail] = useState("");
    const [contactName, setContactName] = useState("");

    // ── Fetched Data ────────────────────────────────────────────────────
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    // Fetch contacts (and projects if needed) on mount
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createSupabaseClient();

            // Fetch contacts (not deleted)
            const { data: contactsData } = await supabase
                .from("contacts")
                .select("id, full_name, company_name, email, image_url")
                .eq("organization_id", orgId)
                .eq("is_deleted", false)
                .order("full_name");

            if (contactsData) {
                setContacts(
                    contactsData.map((c) => ({
                        id: c.id,
                        name: c.full_name || c.email || "Sin nombre",
                        company_name: c.company_name,
                        avatar_url: c.image_url,
                    }))
                );
            }

            // Fetch projects only if projectId is NOT provided
            if (!projectId) {
                const { data: projectsData } = await supabase
                    .from("projects")
                    .select("id, name")
                    .eq("organization_id", orgId)
                    .eq("is_active", true)
                    .order("name");

                if (projectsData) setProjects(projectsData);
            }
        };

        fetchData();
    }, [orgId, projectId]);

    // ── Callbacks internos ──────────────────────────────────────────────
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    // ── Validation ──────────────────────────────────────────────────────
    const effectiveProjectId = projectId || selectedProjectId;

    const isValidModeA = effectiveProjectId && contactId;
    const isValidModeB = effectiveProjectId && email.trim();
    const isValid = mode === "contact" ? isValidModeA : isValidModeB;

    // ── Submit ───────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        if (mode === "contact" || isEditing) {
            // Mode A: Link existing contact
            const values = {
                organization_id: orgId,
                project_id: effectiveProjectId,
                contact_id: contactId,
                client_role_id: clientRoleId || undefined,
                notes: notes || undefined,
                is_primary: true,
            };

            // Optimistic: close and show success immediately
            closeModal();
            toast.success(isEditing ? "Cliente actualizado correctamente" : "Cliente vinculado correctamente");

            startTransition(async () => {
                try {
                    if (isEditing && initialData) {
                        await updateClientAction({ ...values, id: initialData.id });
                    } else {
                        await createClientAction(values);
                    }
                    router.refresh();
                } catch (error: any) {
                    toast.error(error.message || "Error al guardar el cliente");
                }
            });
        } else {
            // Mode B: Invite by email
            startTransition(async () => {
                try {
                    const result = await inviteClientToProjectAction({
                        organization_id: orgId,
                        project_id: effectiveProjectId,
                        email: email.trim(),
                        contact_name: contactName.trim() || undefined,
                        client_role_id: clientRoleId || undefined,
                        notes: notes || undefined,
                    });

                    if (!result.success) {
                        toast.error(result.error || "Error al invitar al cliente");
                        return;
                    }

                    closeModal();

                    if (result.access_granted) {
                        toast.success("Cliente vinculado y acceso otorgado directamente.");
                    } else if (result.invited) {
                        toast.success("Cliente vinculado. Se envió una invitación por email.");
                    } else {
                        toast.success("Cliente vinculado al proyecto.");
                    }

                    // Show secondary feedback if there was a partial error
                    if (result.error) {
                        toast.warning(result.error);
                    }

                    router.refresh();
                } catch (error: any) {
                    toast.error(error.message || "Error al invitar al cliente");
                }
            });
        }
    };

    // ── Default submit label ────────────────────────────────────────────
    const defaultLabel = isEditing
        ? "Guardar Cambios"
        : mode === "contact"
            ? "Vincular Cliente"
            : "Invitar Cliente";

    // ── Rol options for SelectField ─────────────────────────────────────
    const roleOptions = roles.map((r) => ({
        value: r.id,
        label: r.name,
    }));

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">

                {/* Mode toggle — only shown in CREATE mode */}
                {!isEditing && (
                    <div className="flex rounded-lg border bg-muted/30 p-0.5">
                        <button
                            type="button"
                            onClick={() => setMode("contact")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "contact"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Contacto existente
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("email")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${mode === "email"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <UserPlus className="h-4 w-4" />
                            Invitar por email
                        </button>
                    </div>
                )}

                {/* Project — only shown when projectId is NOT provided */}
                {!projectId && (
                    <ProjectField
                        value={selectedProjectId}
                        onChange={setSelectedProjectId}
                        projects={projects}
                        required
                    />
                )}

                {/* Mode A: Contact Selector */}
                {(mode === "contact" || isEditing) && (
                    <ContactField
                        value={contactId}
                        onChange={setContactId}
                        contacts={contacts}
                        required
                        allowNone={false}
                        placeholder="Buscar contacto..."
                        searchPlaceholder="Escribí para buscar..."
                        emptyMessage="No se encontraron contactos."
                    />
                )}

                {/* Mode B: Email + Name */}
                {mode === "email" && !isEditing && (
                    <>
                        <FormGroup label="Email del cliente" required>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@ejemplo.com"
                                autoComplete="off"
                                autoFocus
                            />
                        </FormGroup>

                        <FormGroup label="Nombre (opcional)">
                            <Input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="Nombre del contacto"
                                autoComplete="off"
                            />
                        </FormGroup>
                    </>
                )}

                {/* Role (always visible) */}
                <SelectField
                    value={clientRoleId}
                    onChange={setClientRoleId}
                    options={roleOptions}
                    label="Rol"
                    placeholder="Seleccionar rol..."
                    required={false}
                    clearable
                />

                {/* Notes */}
                <NotesField
                    value={notes}
                    onChange={setNotes}
                    placeholder="Notas adicionales sobre el cliente..."
                />

                {/* Info box — only in email mode */}
                {mode === "email" && !isEditing && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                                <strong className="text-foreground">Los clientes no ocupan asientos del plan.</strong> Podés agregar clientes ilimitados.
                            </p>
                            <p>
                                Si la persona ya tiene cuenta en Seencel, se la agrega directamente.
                                Si no, se le envía un email de invitación para que se registre.
                            </p>
                        </div>
                    </div>
                )}

            </div>

            <FormFooter
                onCancel={handleCancel}
                isLoading={isPending}
                submitLabel={submitLabel || defaultLabel}
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
