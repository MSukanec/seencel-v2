"use client";

import { useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { QuoteView, ContractSummary, QuoteItemView } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";

import {
    TextField,
    AmountField,
    NotesField,
    SelectField,
    DateField,
    ContactField,
    ProjectField,
    type SelectOption,
} from "@/components/shared/forms/fields";
import {
    FileText,
    Building2,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Calculator,
    Receipt,
    ArrowLeftRight,
    TrendingUp,
    Send,
    XCircle,
    Loader2,
    FileCheck,
    FileSignature,
    Settings2,
    Lock,
    ShieldAlert,
    Info,
} from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { useAutoSave } from "@/hooks/use-auto-save";
import { updateQuoteDocumentTerms, updateQuoteStatus, approveQuote, convertQuoteToContract } from "../actions";
import { toast } from "sonner";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";
import { cn } from "@/lib/utils";
import { useOrganizationStore } from "@/stores/organization-store";
import {
    SettingsSection,
    SettingsSectionContainer,
} from "@/components/shared/settings-section";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuoteOverviewViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
    items?: QuoteItemView[];
    /** All org contacts for the client dropdown (override for ContactField) */
    allContacts?: { id: string; name: string; resolved_avatar_url?: string | null; company_name?: string | null }[];
}

// ── Estado badges ─────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
}> = {
    draft: { label: "Borrador", variant: "secondary", icon: <FileText className="h-3.5 w-3.5" /> },
    sent: { label: "Enviado", variant: "outline", icon: <Clock className="h-3.5 w-3.5" /> },
    approved: { label: "Aprobado", variant: "default", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    rejected: { label: "Rechazado", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
    expired: { label: "Vencido", variant: "destructive", icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

// ── Tax Label Options ─────────────────────────────────────────────────────────
const TAX_LABEL_OPTIONS: SelectOption[] = [
    { value: "IVA", label: "IVA" },
    { value: "VAT", label: "VAT" },
    { value: "Sales Tax", label: "Sales Tax" },
    { value: "GST", label: "GST" },
    { value: "ICMS", label: "ICMS" },
    { value: "Tax", label: "Tax" },
];

// ── KPI Row ───────────────────────────────────────────────────────────────────
function KpiRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className={cn(
            "flex items-center justify-between py-2 border-b last:border-b-0",
            highlight && "bg-primary/5 -mx-3 px-3 rounded-md border-0"
        )}>
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("text-sm font-semibold tabular-nums", highlight && "text-primary text-base")}>{value}</span>
        </div>
    );
}

// ── Confirmation dialog config ────────────────────────────────────────────────
interface StatusTransitionConfig {
    title: string;
    description: string;
    consequences: string[];
    confirmLabel: string;
    confirmVariant?: "default" | "destructive";
}

function getTransitionConfig(
    currentStatus: string,
    targetStatus: string,
    quoteType: string,
    money: ReturnType<typeof useMoney>,
    quote: QuoteView,
    items: QuoteItemView[],
): StatusTransitionConfig {
    const itemCount = items.length;
    const total = money.format(quote.total_with_tax || 0);
    const symbol = quote.currency_symbol || "$";

    if (targetStatus === "sent") {
        return {
            title: "Marcar como Enviado",
            description: `Estás a punto de enviar este ${quoteType === "contract" ? "contrato" : "presupuesto"} al cliente.`,
            consequences: [
                `Los precios de los ${itemCount} ítems se congelarán con los costos actuales del catálogo.`,
                "Los campos del documento (nombre, condiciones, ítems) se bloquearán para edición.",
                "Los costos del catálogo ya no afectarán este documento.",
                `El valor total congelado será: ${total}`,
                "Si ya fue enviado antes, la versión se incrementará automáticamente.",
                "Podrás volver a Borrador si necesitás hacer cambios.",
            ],
            confirmLabel: "Enviar al cliente",
        };
    }

    if (targetStatus === "approved" && currentStatus === "draft") {
        const consequences = [
            `Se crearán ${itemCount} tareas de obra en el proyecto vinculado.`,
            "Los precios se congelarán con los costos actuales.",
            "El documento quedará bloqueado permanentemente.",
            `El valor total del presupuesto es: ${total}`,
            "Esta acción no se puede deshacer.",
        ];
        if (!quote.client_id) {
            consequences.push("⚠️ No hay cliente asignado. No se podrán generar compromisos de pago hasta asignar uno.");
        }
        return {
            title: "Aprobar Presupuesto",
            description: "Estás a punto de aprobar este presupuesto directamente desde borrador.",
            consequences,
            confirmLabel: "Aprobar y crear tareas",
            confirmVariant: "default",
        };
    }

    if (targetStatus === "approved" && currentStatus === "sent") {
        const consequences = [
            `Se crearán ${itemCount} tareas de obra en el proyecto vinculado.`,
            "Los precios ya están congelados desde el envío.",
            "El documento quedará bloqueado permanentemente.",
            `El valor total aprobado será: ${total}`,
            "Esta acción no se puede deshacer.",
        ];
        if (!quote.client_id) {
            consequences.push("⚠️ No hay cliente asignado. No se podrán generar compromisos de pago hasta asignar uno.");
        }
        return {
            title: "Aprobar Presupuesto",
            description: "El cliente aceptó — estás a punto de aprobar este presupuesto.",
            consequences,
            confirmLabel: "Aprobar y crear tareas",
            confirmVariant: "default",
        };
    }

    if (targetStatus === "rejected") {
        return {
            title: "Rechazar Presupuesto",
            description: "Estás a punto de rechazar este presupuesto.",
            consequences: [
                "El presupuesto se marcará como rechazado.",
                "No se crearán tareas de obra.",
                "El documento quedará bloqueado para edición.",
                "Podrás volver a Borrador si el cliente cambia de opinión.",
            ],
            confirmLabel: "Rechazar",
            confirmVariant: "destructive",
        };
    }

    if (targetStatus === "draft") {
        return {
            title: "Volver a Borrador",
            description: "Estás a punto de revertir este presupuesto a borrador.",
            consequences: [
                "Los campos se desbloquearán para edición.",
                "Los precios volverán a calcularse en vivo desde el catálogo.",
                "Los snapshots de costos se perderán y se recalcularán al re-enviar.",
                `El valor puede cambiar si los costos del catálogo cambiaron.`,
            ],
            confirmLabel: "Volver a borrador",
        };
    }

    if (targetStatus === "contract") {
        return {
            title: "Convertir a Contrato",
            description: "Estás a punto de convertir este presupuesto aprobado en un contrato formal.",
            consequences: [
                "El tipo de documento cambiará de Cotización a Contrato.",
                `El valor original del contrato se congelará en: ${total}`,
                "Podrás crear Adicionales (Change Orders) vinculados.",
                "El valor revisado del contrato se calculará automáticamente.",
                "Esta acción no se puede deshacer.",
            ],
            confirmLabel: "Convertir a contrato",
        };
    }

    // Fallback
    return {
        title: "Cambiar Estado",
        description: `Cambiar a "${STATUS_MAP[targetStatus]?.label || targetStatus}".`,
        consequences: [],
        confirmLabel: "Confirmar",
    };
}

// ============================================================================
// Component
// ============================================================================

export function QuoteOverviewView({ quote, contractSummary, items = [], allContacts }: QuoteOverviewViewProps) {
    const isContract = quote.quote_type === "contract";
    const money = useMoney();
    const router = useRouter();
    const statusInfo = STATUS_MAP[quote.status] || { label: quote.status, variant: "secondary" as const, icon: null };
    const showExchangeRate = !!quote.exchange_rate && quote.exchange_rate !== 1;
    const [statusLoading, setStatusLoading] = useState(false);

    // ── Read-only enforcement ─────────────────────────────────────────────────
    const isReadOnly = quote.status !== "draft";

    // ── Confirmation dialog state ─────────────────────────────────────────────
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        config: StatusTransitionConfig;
        onConfirm: () => void;
    }>({ open: false, config: { title: "", description: "", consequences: [], confirmLabel: "" }, onConfirm: () => { } });

    // ── Editable State ────────────────────────────────────────────────────────
    const [name, setName] = useState(quote.name || "");
    const [description, setDescription] = useState(quote.description || "");
    const [clientId, setClientId] = useState(quote.client_id || "");
    const [projectId, setProjectId] = useState(quote.project_id || "");
    const [quoteDate, setQuoteDate] = useState<Date | undefined>(
        parseDateFromDB(quote.quote_date) ?? undefined
    );
    const [validUntil, setValidUntil] = useState<Date | undefined>(
        parseDateFromDB(quote.valid_until) ?? undefined
    );
    const [taxPct, setTaxPct] = useState(String(quote.tax_pct ?? 0));
    const [discountPct, setDiscountPct] = useState(String(quote.discount_pct ?? 0));
    const [taxLabel, setTaxLabel] = useState(quote.tax_label || "IVA");
    const [exchangeRate, setExchangeRate] = useState(String(quote.exchange_rate ?? 1));

    // ── Auto-save via useAutoSave ─────────────────────────────────────────────
    const { triggerAutoSave } = useAutoSave<Record<string, any>>({
        saveFn: async (data) => {
            const result = await updateQuoteDocumentTerms(quote.id, data);
            if (result.error) throw new Error(result.error);
        },
        delay: 800,
        successMessage: "¡Cambios guardados!",
        errorMessage: "Error al guardar los cambios.",
    });

    // ── Field change handlers (only active in draft) ──────────────────────────
    const handleNameChange = (v: string) => {
        if (isReadOnly) return;
        setName(v);
        triggerAutoSave({ name: v.trim() });
    };

    const handleDescriptionChange = (v: string) => {
        if (isReadOnly) return;
        setDescription(v);
        triggerAutoSave({ description: v.trim() || null });
    };

    const handleClientChange = (v: string) => {
        if (isReadOnly) return;
        setClientId(v);
        // quotes.client_id FK → contacts.contacts.id directly
        triggerAutoSave({ client_id: v || null });
    };

    const handleProjectChange = (v: string) => {
        if (isReadOnly) return;
        setProjectId(v);
        triggerAutoSave({ project_id: v || null });
    };

    const handleQuoteDateChange = (d: Date | undefined) => {
        if (isReadOnly) return;
        setQuoteDate(d);
        triggerAutoSave({ quote_date: d ? formatDateForDB(d) : null });
    };

    const handleValidUntilChange = (d: Date | undefined) => {
        if (isReadOnly) return;
        setValidUntil(d);
        triggerAutoSave({ valid_until: d ? formatDateForDB(d) : null });
    };

    const handleTaxPctChange = (v: string) => {
        if (isReadOnly) return;
        setTaxPct(v);
        triggerAutoSave({ tax_pct: parseFloat(v) || 0 });
    };

    const handleDiscountPctChange = (v: string) => {
        if (isReadOnly) return;
        setDiscountPct(v);
        triggerAutoSave({ discount_pct: parseFloat(v) || 0 });
    };

    const handleTaxLabelChange = (v: string) => {
        if (isReadOnly) return;
        setTaxLabel(v);
        triggerAutoSave({ tax_label: v });
    };

    const handleExchangeRateChange = (v: string) => {
        if (isReadOnly) return;
        setExchangeRate(v);
        triggerAutoSave({ exchange_rate: parseFloat(v) || 1 });
    };

    // ── Status transition handlers ────────────────────────────────────────────
    const handleStatusChange = async (newStatus: string) => {
        setStatusLoading(true);
        try {
            const result = await updateQuoteStatus(quote.id, newStatus);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Estado cambiado a "${STATUS_MAP[newStatus]?.label || newStatus}"`);
                router.refresh();
            }
        } finally {
            setStatusLoading(false);
        }
    };

    const handleApprove = async () => {
        setStatusLoading(true);
        try {
            const result = await approveQuote(quote.id);
            if (!result.success) {
                toast.error(result.error || "Error al aprobar");
            } else {
                toast.success(`Aprobado. ${result.tasksCreated ? `${result.tasksCreated} tareas creadas.` : ""}`);
                router.refresh();
            }
        } finally {
            setStatusLoading(false);
        }
    };

    const handleConvertToContract = async () => {
        setStatusLoading(true);
        try {
            const result = await convertQuoteToContract(quote.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Convertido a contrato");
                router.refresh();
            }
        } finally {
            setStatusLoading(false);
        }
    };

    // ── Show confirmation dialog before executing ─────────────────────────────
    const requestTransition = (targetStatus: string, onConfirm: () => void) => {
        const config = getTransitionConfig(quote.status, targetStatus, quote.quote_type, money, quote, items);
        setConfirmDialog({ open: true, config, onConfirm });
    };

    // ── Toolbar actions (status transitions) ──────────────────────────────────
    const buildToolbarActions = () => {
        const actions: { label: string; icon: any; onClick: () => void; disabled?: boolean }[] = [];

        // Approval requires project + items
        const canApprove = !!quote.project_id && items.length > 0;
        const handleApproveClick = () => {
            if (!quote.project_id) {
                toast.warning("Asigná un proyecto antes de aprobar. La aprobación crea tareas de obra que necesitan un proyecto destino.");
                return;
            }
            if (items.length === 0) {
                toast.warning("Agregá al menos un ítem antes de aprobar.");
                return;
            }
            requestTransition("approved", handleApprove);
        };

        if (quote.status === "draft") {
            actions.push({ label: "Marcar como Enviado", icon: Send, onClick: () => requestTransition("sent", () => handleStatusChange("sent")), disabled: statusLoading });
            actions.push({ label: "Aprobar", icon: CheckCircle2, onClick: handleApproveClick, disabled: statusLoading });
            actions.push({ label: "Rechazar", icon: XCircle, onClick: () => requestTransition("rejected", () => handleStatusChange("rejected")), disabled: statusLoading });
        } else if (quote.status === "sent") {
            actions.push({ label: "Aprobar", icon: CheckCircle2, onClick: handleApproveClick, disabled: statusLoading });
            actions.push({ label: "Rechazar", icon: XCircle, onClick: () => requestTransition("rejected", () => handleStatusChange("rejected")), disabled: statusLoading });
            actions.push({ label: "Volver a Borrador", icon: FileText, onClick: () => requestTransition("draft", () => handleStatusChange("draft")), disabled: statusLoading });
        } else if (quote.status === "approved" && quote.quote_type === "quote" && quote.project_id) {
            actions.push({ label: "Convertir a Contrato", icon: FileCheck, onClick: () => requestTransition("contract", handleConvertToContract), disabled: statusLoading });
        } else if (quote.status === "rejected") {
            actions.push({ label: "Volver a Borrador", icon: FileText, onClick: () => requestTransition("draft", () => handleStatusChange("draft")), disabled: statusLoading });
        }

        return actions;
    };

    const toolbarActions = buildToolbarActions();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ── Toolbar: acciones de estado en el header ────────────── */}
            {toolbarActions.length > 0 && (
                <Toolbar
                    portalToHeader
                    actions={toolbarActions}
                    actionsMode="dropdown"
                    actionsLabel={statusInfo.label}
                />
            )}

            {/* ── Read-only banner ─────────────────────────────────────── */}
            {isReadOnly && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3 mb-2">
                    <div className="bg-amber-500/15 p-2 rounded-full shrink-0">
                        <Lock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-200">
                            Documento bloqueado — Estado: {statusInfo.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {quote.status === "sent" && "Los campos están bloqueados porque el presupuesto fue enviado al cliente. Volvé a Borrador para editarlo."}
                            {quote.status === "approved" && "Los campos están bloqueados porque el presupuesto fue aprobado. Las tareas de obra ya fueron creadas."}
                            {quote.status === "rejected" && "Los campos están bloqueados porque el presupuesto fue rechazado. Volvé a Borrador para editarlo."}
                        </p>
                    </div>
                </div>
            )}

            {/* Banner: Adicional (Change Order) */}
            {quote.quote_type === "change_order" && quote.parent_quote_id && (
                <div className="bg-[#7c72ab]/10 border border-[#7c72ab]/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#7c72ab]/15 p-2.5 rounded-full">
                            <FileSignature className="h-5 w-5 text-[#7c72ab]" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Adicional al Contrato</h3>
                            <p className="text-sm text-muted-foreground">Este documento es un anexo al contrato principal.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/organization/quotes/${quote.parent_quote_id}`}>Ver Contrato Principal</a>
                    </Button>
                </div>
            )}

            <SettingsSectionContainer>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN 1: Identificación                               */}
                {/* ¿Qué es? Nombre, descripción, cliente, proyecto          */}
                {/* ══════════════════════════════════════════════════════════ */}
                <SettingsSection
                    icon={Building2}
                    title="Identificación"
                    description="Información general del documento."
                >
                    <div className="space-y-4">
                        {/* Fila 1: Estado / Versión (2 columnas) */}
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                value={quote.status}
                                onChange={(newStatus) => {
                                    if (newStatus === quote.status) return;
                                    const action = toolbarActions.find(a => {
                                        if (newStatus === "sent") return a.label === "Marcar como Enviado";
                                        if (newStatus === "approved") return a.label === "Aprobar";
                                        if (newStatus === "rejected") return a.label === "Rechazar";
                                        if (newStatus === "draft") return a.label === "Volver a Borrador";
                                        return false;
                                    });
                                    if (action) action.onClick();
                                }}
                                options={[
                                    { value: quote.status, label: statusInfo.label },
                                    ...toolbarActions.map(a => ({
                                        value: a.label === "Marcar como Enviado" ? "sent"
                                            : a.label === "Aprobar" ? "approved"
                                                : a.label === "Rechazar" ? "rejected"
                                                    : a.label === "Volver a Borrador" ? "draft"
                                                        : a.label === "Convertir a Contrato" ? "contract"
                                                            : "",
                                        label: a.label,
                                    })),
                                ]}
                                label="Estado"
                                disabled={statusLoading || toolbarActions.length === 0}
                            />
                            <TextField
                                value={`v${quote.version}`}
                                onChange={() => { }}
                                label="Versión"
                                disabled
                            />
                        </div>

                        {/* Fila 2: Nombre (full width) */}
                        <TextField
                            value={name}
                            onChange={handleNameChange}
                            label="Nombre"
                            placeholder="Nombre del presupuesto"
                            required
                            disabled={isReadOnly}
                        />

                        {/* Fila 3: Proyecto / Cliente (2 columnas) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ProjectField
                                value={projectId}
                                onChange={handleProjectChange}
                                label="Proyecto"
                                disabled={isReadOnly}
                            />
                            <ContactField
                                value={clientId}
                                onChange={handleClientChange}
                                contacts={allContacts}
                                label="Cliente"
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Fila 4: Descripción */}
                        <NotesField
                            value={description}
                            onChange={handleDescriptionChange}
                            label={isContract ? "Alcance del Contrato" : "Descripción"}
                            placeholder="Agregar descripción del alcance..."
                            required={false}
                            disabled={isReadOnly}
                        />
                    </div>
                </SettingsSection>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN 2: Condiciones                                   */}
                {/* Fechas, impuesto, descuento y tipo de cambio             */}
                {/* ══════════════════════════════════════════════════════════ */}
                <SettingsSection
                    icon={Settings2}
                    title="Condiciones"
                    description="Fechas, impuesto, descuento y tipo de cambio aplicados al documento."
                >
                    <div className="space-y-4">
                        {/* Fila 1: Fechas (2 columnas) */}
                        <div className="grid grid-cols-2 gap-4">
                            <DateField
                                value={quoteDate}
                                onChange={handleQuoteDateChange}
                                label="Fecha del documento"
                                required={false}
                                placeholder="Sin fecha"
                                disabled={isReadOnly}
                            />
                            <DateField
                                value={validUntil}
                                onChange={handleValidUntilChange}
                                label="Válido hasta"
                                required={false}
                                placeholder="Sin fecha"
                                startMonth={quoteDate}
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Fila 2: Tipo de impuesto / Impuesto % / Descuento % (3 columnas) */}
                        <div className="grid grid-cols-3 gap-4">
                            <SelectField
                                value={taxLabel}
                                onChange={handleTaxLabelChange}
                                options={TAX_LABEL_OPTIONS}
                                label="Tipo de impuesto"
                                required={false}
                                disabled={isReadOnly}
                            />
                            <AmountField
                                value={taxPct}
                                onChange={handleTaxPctChange}
                                label="Impuesto %"
                                placeholder="21"
                                min={0}
                                step={0.01}
                                suffix="%"
                                disabled={isReadOnly}
                            />
                            <AmountField
                                value={discountPct}
                                onChange={handleDiscountPctChange}
                                label="Descuento %"
                                placeholder="0"
                                min={0}
                                step={0.01}
                                suffix="%"
                                disabled={isReadOnly}
                            />
                        </div>

                        {/* Fila 3: Tipo de cambio (solo si aplica) */}
                        {showExchangeRate && (
                            <div className="grid grid-cols-3 gap-4">
                                <AmountField
                                    value={exchangeRate}
                                    onChange={handleExchangeRateChange}
                                    label="Tipo de cambio"
                                    placeholder="1"
                                    min={0}
                                    step={0.000001}
                                    disabled={isReadOnly}
                                />
                            </div>
                        )}
                    </div>
                </SettingsSection>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* SECCIÓN 4: Resumen Financiero                            */}
                {/* ¿Cuánto sale?                                            */}
                {/* ══════════════════════════════════════════════════════════ */}

                {/* Financiero: Contrato */}
                {isContract && contractSummary && (
                    <SettingsSection
                        icon={DollarSign}
                        title="Valor del Contrato"
                        description={
                            <>
                                <span>Contrato original congelado al momento de la aprobación.</span>
                                {contractSummary.change_order_count > 0 && (
                                    <span> {contractSummary.change_order_count} orden{contractSummary.change_order_count !== 1 ? "es" : ""} de cambio registrada{contractSummary.change_order_count !== 1 ? "s" : ""}.</span>
                                )}
                            </>
                        }
                    >
                        <div className="space-y-0.5">
                            <KpiRow
                                label="Contrato Original"
                                value={money.format(contractSummary.original_contract_value || 0)}
                            />
                            {contractSummary.approved_changes_value > 0 && (
                                <KpiRow
                                    label={`Adicionales aprobados (${contractSummary.approved_change_order_count})`}
                                    value={`+${money.format(contractSummary.approved_changes_value)}`}
                                />
                            )}
                            {contractSummary.pending_changes_value > 0 && (
                                <KpiRow
                                    label={`Adicionales pendientes (${contractSummary.pending_change_order_count})`}
                                    value={`+${money.format(contractSummary.pending_changes_value)}`}
                                />
                            )}
                            <KpiRow
                                label="Valor Revisado del Contrato"
                                value={money.format(contractSummary.revised_contract_value || 0)}
                                highlight
                            />
                            {contractSummary.potential_contract_value !== contractSummary.revised_contract_value && (
                                <KpiRow
                                    label="Valor Potencial (incl. pendientes)"
                                    value={money.format(contractSummary.potential_contract_value || 0)}
                                />
                            )}
                        </div>
                    </SettingsSection>
                )}

                {/* Financiero: Cotización / Adicional */}
                {!isContract && (
                    <SettingsSection
                        icon={Calculator}
                        title="Resumen Financiero"
                        description="Totales calculados a partir de los ítems del documento."
                    >
                        <div className="space-y-0.5">
                            <KpiRow
                                label="Subtotal (sin impuestos)"
                                value={money.format(quote.subtotal_with_markup || 0)}
                            />
                            {(quote.discount_pct ?? 0) > 0 && (
                                <KpiRow
                                    label={`Descuento (${quote.discount_pct}%)`}
                                    value={`-${money.format((quote.subtotal_with_markup || 0) - (quote.total_after_discount || 0))}`}
                                />
                            )}
                            <KpiRow
                                label={`${quote.tax_label || "IVA"} (${quote.tax_pct}%)`}
                                value={money.format((quote.total_with_tax || 0) - (quote.total_after_discount || 0))}
                            />
                            <KpiRow
                                label="Total"
                                value={money.format(quote.total_with_tax || 0)}
                                highlight
                            />
                        </div>
                    </SettingsSection>
                )}

                {/* Financiero: Contrato sin summary */}
                {quote.quote_type === "contract" && !contractSummary && (
                    <SettingsSection
                        icon={TrendingUp}
                        title="Resumen Financiero"
                        description="Totales del contrato."
                    >
                        <div className="space-y-0.5">
                            <KpiRow
                                label="Subtotal (sin impuestos)"
                                value={money.format(quote.subtotal_with_markup || 0)}
                            />
                            <KpiRow
                                label={`${quote.tax_label || "IVA"} (${quote.tax_pct}%)`}
                                value={money.format((quote.total_with_tax || 0) - (quote.total_after_discount || 0))}
                            />
                            <KpiRow
                                label="Total del Contrato"
                                value={money.format(quote.total_with_tax || 0)}
                                highlight
                            />
                        </div>
                    </SettingsSection>
                )}

            </SettingsSectionContainer>

            {/* ── Confirmation Dialog ──────────────────────────────────── */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-primary" />
                            {confirmDialog.config.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            {confirmDialog.config.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {confirmDialog.config.consequences.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium flex items-center gap-1.5">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                ¿Qué va a pasar?
                            </p>
                            <ul className="space-y-1.5">
                                {confirmDialog.config.consequences.map((c, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({ ...prev, open: false }));
                            }}
                            className={cn(
                                confirmDialog.config.confirmVariant === "destructive" &&
                                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            )}
                        >
                            {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {confirmDialog.config.confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
