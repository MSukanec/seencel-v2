/**
 * QuoteForm — Formulario semi-autónomo para crear/editar presupuestos
 *
 * Según skill seencel-forms-modals:
 * - Semi-autónomo: maneja closeModal() y router.refresh() internamente
 * - NO recibe onSuccess ni onCancel como props
 * - Usa Field Factories para campos estándar (ProjectField)
 * - Sticky footer con flex flex-col h-full min-h-0
 */
"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useModal } from "@/stores/modal-store";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjectField } from "@/components/shared/forms/fields";
import { ContactField } from "@/components/shared/forms/fields/contact-field";
import { TextField } from "@/components/shared/forms/fields/text-field";
import { toast } from "sonner";
import { createQuote, updateQuote, createChangeOrder } from "../actions";
import { QuoteView } from "../types";
import { OrganizationFinancialData } from "@/features/clients/types";
import { Info } from "lucide-react";

interface QuoteFormProps {
    // Datos — pasados como props (no hay access a Context Providers en el Portal)
    mode: "create" | "edit";
    initialData?: QuoteView;
    organizationId: string;
    financialData: OrganizationFinancialData;
    clients: { id: string; name: string; resolved_avatar_url?: string | null }[];

    projects?: { id: string; name: string; image_url?: string | null; color?: string | null }[];
    projectId?: string;

    // Change Orders
    parentQuoteId?: string;
    parentQuoteName?: string;

    // ❌ NO HAY onSuccess ni onCancel — el form es semi-autónomo
}

export function QuoteForm({
    mode,
    initialData,
    organizationId,
    financialData,
    clients,
    projects,
    projectId,
    parentQuoteId,
    parentQuoteName,
}: QuoteFormProps) {
    // Ciclo de vida manejado internamente — regla seencel-forms-modals §Semi-Autónomo
    const router = useRouter();
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [clientId, setClientId] = useState<string>(initialData?.client_id || "");
    const [projectIdState, setProjectIdState] = useState<string>(
        initialData?.project_id || "none"
    );

    const isChangeOrder = !!parentQuoteId || initialData?.quote_type === "change_order";
    const isProjectContext = !!projectId;
    const { defaultCurrencyId, currencies, defaultTaxLabel } = financialData;

    const [name, setName] = useState<string>(initialData?.name || "");

    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            // ── CHANGE ORDER ──────────────────────────────────────────────
            if (parentQuoteId && mode === "create") {
                const name = formData.get("name") as string;
                const description = formData.get("description") as string;
                const result = await createChangeOrder(parentQuoteId, { name, description });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Adicional creado");
                handleSuccess();
                return;
            }

            // ── CREATE ────────────────────────────────────────────────────
            if (mode === "create") {
                formData.set("status", "draft");
                formData.set("exchange_rate", "1");
                formData.set("tax_pct", "0");
                formData.set("tax_label", defaultTaxLabel || "IVA");
                formData.set("discount_pct", "0");
                // Moneda: usa la default de la org (no se selecciona en el form)
                formData.set("currency_id", defaultCurrencyId || currencies[0]?.id || "");
                // Fecha de hoy como default
                const today = new Date();
                const pad = (n: number) => String(n).padStart(2, "0");
                formData.set("quote_date", `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
            }

            // ── Proyecto ──────────────────────────────────────────────────
            if (isProjectContext && projectId) {
                formData.set("project_id", projectId);
            } else {
                if (projectIdState === "none") {
                    formData.delete("project_id");
                } else {
                    formData.set("project_id", projectIdState);
                }
            }

            formData.set("client_id", clientId);

            // ── EDIT ──────────────────────────────────────────────────────
            if (mode === "edit" && initialData?.id) {
                formData.append("id", initialData.id);
                // Preservar campos del documento que no están en este form
                formData.set("currency_id", initialData.currency_id);
                formData.set("exchange_rate", String(initialData.exchange_rate ?? 1));
                formData.set("tax_pct", String(initialData.tax_pct ?? 0));
                formData.set("tax_label", initialData.tax_label || "IVA");
                formData.set("discount_pct", String(initialData.discount_pct ?? 0));
                formData.set("quote_date", initialData.quote_date || "");
                formData.set("valid_until", initialData.valid_until || "");
                formData.set("status", initialData.status || "draft");
                formData.set("description", initialData.description || "");

                const result = await updateQuote(formData);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Cambios guardados");
                handleSuccess();
                return;
            }

            const result = await createQuote(formData);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Presupuesto creado");
            handleSuccess();
        } catch (error: any) {
            console.error("QuoteForm error:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Estructura obligatoria — skill seencel-forms-modals §Footer Sticky
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <input type="hidden" name="organization_id" value={organizationId} />
            <input type="hidden" name="quote_type" value={isChangeOrder ? "change_order" : (initialData?.quote_type ?? "quote")} />
            <input type="hidden" name="version" value={initialData?.version || 1} />

            {/* Banner: Change Order */}
            {parentQuoteId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-5 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Creando Adicional</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                            Vinculado a <strong>{parentQuoteName}</strong>.
                            Hereda cliente, proyecto, moneda e impuestos del contrato.
                        </p>
                    </div>
                </div>
            )}

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">

                    {parentQuoteId ? (
                        // ── CHANGE ORDER: Nombre + Descripción ────────────────────────
                        <>
                            <FormGroup label="Nombre del Adicional" htmlFor="name">
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ej: Adicional #1 – Cambio de pisos"
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Si lo dejás vacío se genera automáticamente como "CO #N"
                                </p>
                            </FormGroup>

                            <FormGroup label="Descripción / Motivo del cambio" htmlFor="description">
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe por qué se realiza este adicional..."
                                    rows={4}
                                    disabled={isLoading}
                                />
                            </FormGroup>
                        </>
                    ) : (
                        // ── FORM REGULAR: solo Nombre + Proyecto + Cliente ────────────
                        <>
                            {/* Fila 1: Nombre */}
                            <TextField
                                label="Nombre del Presupuesto"
                                value={name}
                                onChange={setName}
                                placeholder='Ej: "Presupuesto General" o "Llave en Mano – Planta Baja"'
                                required
                                autoFocus
                                disabled={isLoading}
                            />
                            {/* Hidden input para que FormData incluya el name (TextField es controlled) */}
                            <input type="hidden" name="name" value={name} />

                            {/* Fila 2: Proyecto + Cliente — 2 columnas en desktop */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ProjectField:
                                    - Org context  → editable, muestra proyectos activos
                                    - Project ctx  → visible pero locked (disabled) con el proyecto actual
                                */}
                                <ProjectField
                                    value={isProjectContext ? projectId! : projectIdState}
                                    onChange={setProjectIdState}
                                    projects={projects ?? []}
                                    label="Proyecto"
                                    required={false}
                                    disabled={isLoading || isProjectContext}
                                    placeholder="Sin proyecto"
                                />

                                {/* Según skill §Field Factories: ContactField, no Combobox manual */}
                                <ContactField
                                    value={clientId}
                                    onChange={setClientId}
                                    contacts={clients}
                                    label="Cliente"
                                    required={false}
                                    disabled={isLoading}
                                    placeholder="Seleccionar cliente"
                                    searchPlaceholder="Buscar cliente..."
                                    emptyMessage="No se encontraron clientes"
                                    allowNone
                                    noneLabel="Sin cliente asignado"
                                />
                            </div>
                        </>
                    )}

                </div>
            </div>

            {/* Footer sticky fuera del div scrolleable — seencel-forms-modals §Footer Sticky */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                onCancel={handleCancel}
                submitLabel={mode === "create" ? (isChangeOrder ? "Crear Adicional" : "Crear Presupuesto") : "Guardar Cambios"}
            />
        </form>
    );
}
