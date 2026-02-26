/**
 * QuoteForm — Formulario para crear/editar presupuestos y change orders
 *
 * Panel self-contained: define su propia presentación via setPanelMeta.
 * Soporta 3 modos: create quote, create change order, edit.
 */
"use client";

import { useState, useEffect } from "react";
import { usePanel } from "@/stores/panel-store";
import { ProjectField, ContactField, TextField, NotesField } from "@/components/shared/forms/fields";
import { toast } from "sonner";
import { createQuote, updateQuote, createChangeOrder } from "../actions";
import { QuoteView } from "../types";
import { OrganizationFinancialData } from "@/features/clients/types";
import { FileText, Info } from "lucide-react";

interface QuoteFormProps {
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
    // Panel
    formId?: string;
    onSuccess?: (data?: any) => void;
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
    formId,
    onSuccess,
}: QuoteFormProps) {
    const { closePanel, setPanelMeta } = usePanel();
    const [isLoading, setIsLoading] = useState(false);
    const [clientId, setClientId] = useState<string>(initialData?.client_id || "");
    const [projectIdState, setProjectIdState] = useState<string>(
        initialData?.project_id || "none"
    );

    const isEditing = mode === "edit";
    const isChangeOrder = !!parentQuoteId || initialData?.quote_type === "change_order";
    const isProjectContext = !!projectId;
    const { defaultCurrencyId, currencies, defaultTaxLabel } = financialData ?? { defaultCurrencyId: '', currencies: [], defaultTaxLabel: 'IVA' };

    const [name, setName] = useState<string>(initialData?.name || "");
    const [description, setDescription] = useState<string>(initialData?.description || "");

    // 🚨 OBLIGATORIO: Self-describe al panel
    useEffect(() => {
        let title: string;
        let desc: string;
        let submitLabel: string;

        if (isChangeOrder) {
            title = isEditing ? "Editar Adicional" : "Nuevo Adicional";
            desc = isEditing
                ? "Modificá los datos del adicional"
                : `Vinculado a ${parentQuoteName || "contrato"}`;
            submitLabel = isEditing ? "Guardar Cambios" : "Crear Adicional";
        } else {
            title = isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto";
            desc = isEditing
                ? "Modificá los datos del presupuesto"
                : "Completá los campos para crear un presupuesto";
            submitLabel = isEditing ? "Guardar Cambios" : "Crear Presupuesto";
        }

        setPanelMeta({
            icon: FileText,
            title,
            description: desc,
            size: "md",
            footer: { submitLabel },
        });
    }, [isEditing, isChangeOrder, parentQuoteName, setPanelMeta]);

    const handleSuccess = (data?: any) => {
        closePanel();
        onSuccess?.(data);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // ── CHANGE ORDER ──────────────────────────────────────────────
            if (parentQuoteId && mode === "create") {
                const result = await createChangeOrder(parentQuoteId, { name, description });
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                toast.success("Adicional creado");
                handleSuccess(result.data);
                return;
            }

            // Build FormData
            const formData = new FormData();
            formData.set("organization_id", organizationId);
            formData.set("quote_type", isChangeOrder ? "change_order" : (initialData?.quote_type ?? "quote"));
            formData.set("version", String(initialData?.version || 1));
            formData.set("name", name);

            // ── CREATE ────────────────────────────────────────────────────
            if (mode === "create") {
                formData.set("status", "draft");
                formData.set("exchange_rate", "1");
                formData.set("tax_pct", "0");
                formData.set("tax_label", defaultTaxLabel || "IVA");
                formData.set("discount_pct", "0");
                formData.set("currency_id", defaultCurrencyId || currencies[0]?.id || "");
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
                handleSuccess(result.data);
                return;
            }

            const result = await createQuote(formData);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success("Presupuesto creado");
            handleSuccess(result.data);
        } catch (error: any) {
            console.error("QuoteForm error:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 🚨 OBLIGATORIO: <form id={formId}> — conecta con el footer del container
    return (
        <form id={formId} onSubmit={handleSubmit}>
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

            <div className="grid grid-cols-1 gap-4">
                {parentQuoteId ? (
                    // ── CHANGE ORDER: Nombre + Descripción ────────────────────────
                    <>
                        <TextField
                            label="Nombre del Adicional"
                            value={name}
                            onChange={setName}
                            placeholder="Ej: Adicional #1 – Cambio de pisos"
                            autoFocus
                            disabled={isLoading}
                            helpText={'Si lo dejás vacío se genera automáticamente como "CO #N"'}
                        />

                        <NotesField
                            label="Descripción / Motivo del cambio"
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe por qué se realiza este adicional..."
                            disabled={isLoading}
                        />
                    </>
                ) : (
                    // ── FORM REGULAR: Nombre + Proyecto + Cliente ────────────
                    <>
                        <TextField
                            label="Nombre del Presupuesto"
                            value={name}
                            onChange={setName}
                            placeholder='Ej: "Presupuesto General" o "Llave en Mano – Planta Baja"'
                            required
                            autoFocus
                            disabled={isLoading}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ProjectField
                                value={isProjectContext ? projectId! : projectIdState}
                                onChange={setProjectIdState}
                                projects={projects ?? []}
                                label="Proyecto"
                                required={false}
                                disabled={isLoading || isProjectContext}
                                placeholder="Sin proyecto"
                            />

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
        </form>
    );
}
