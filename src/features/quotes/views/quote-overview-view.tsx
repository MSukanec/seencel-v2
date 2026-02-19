"use client";

import { useState, useRef, useCallback } from "react";
import { QuoteView, ContractSummary, QuoteItemView } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Building2,
    FileSignature,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Hash,
    Calculator,
    Pencil,
    Check,
    X,
    Receipt,
    Percent,
    ArrowLeftRight,
    TrendingUp,
} from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { updateQuoteDocumentTerms } from "../actions";
import { toast } from "sonner";
import { parseDateFromDB, formatDateForDB } from "@/lib/timezone-data";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
    SettingsSection,
    SettingsSectionContainer,
} from "@/components/shared/settings-section";

interface QuoteOverviewViewProps {
    quote: QuoteView;
    contractSummary?: ContractSummary | null;
    items?: QuoteItemView[];
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

// ── Helper: formatear fecha para display ─────────────────────────────────────
function formatDateDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const d = parseDateFromDB(dateStr);
    if (!d) return "—";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── InlineField ───────────────────────────────────────────────────────────────
interface InlineFieldProps {
    label: string;
    icon?: React.ReactNode;
    value: string;
    displayValue?: string;
    onSave: (value: string) => Promise<void>;
    type?: "text" | "number";
    step?: string;
    min?: string;
    max?: string;
    suffix?: string;
    className?: string;
}

function InlineField({
    label, icon, value, displayValue, onSave,
    type = "text", step, min, max, suffix, className
}: InlineFieldProps) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const startEdit = () => {
        setLocal(value);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const cancel = () => {
        setLocal(value);
        setEditing(false);
    };

    const save = async () => {
        if (local === value) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(local);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") cancel();
    };

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                {icon}
                {label}
            </p>
            {editing ? (
                <div className="flex items-center gap-1">
                    <Input
                        ref={inputRef}
                        type={type}
                        step={step}
                        min={min}
                        max={max}
                        value={local}
                        onChange={(e) => setLocal(e.target.value)}
                        onBlur={save}
                        onKeyDown={handleKeyDown}
                        className="h-7 text-sm py-0"
                        disabled={saving}
                    />
                    {suffix && <span className="text-xs text-muted-foreground shrink-0">{suffix}</span>}
                    <button onClick={save} disabled={saving} className="text-[#758a57] hover:opacity-70">
                        <Check className="h-4 w-4" />
                    </button>
                    <button onClick={cancel} className="text-muted-foreground hover:opacity-70">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={startEdit}
                    className="group flex items-center gap-1.5 text-sm font-medium hover:text-foreground/70 transition-colors text-left w-full"
                >
                    <span>{(displayValue ?? value) || "—"}</span>
                    {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                </button>
            )}
        </div>
    );
}

// ── InlineDateField ───────────────────────────────────────────────────────────
interface InlineDateFieldProps {
    label: string;
    icon?: React.ReactNode;
    value: string | null | undefined;
    onSave: (value: string | null) => Promise<void>;
    minDate?: Date;
    className?: string;
}

function InlineDateField({ label, icon, value, onSave, minDate, className }: InlineDateFieldProps) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState<Date | undefined>(
        value ? (parseDateFromDB(value) ?? undefined) : undefined
    );
    const [saving, setSaving] = useState(false);

    const save = async (date: Date | undefined) => {
        setLocal(date);
        setSaving(true);
        try {
            await onSave(date ? formatDateForDB(date) : null);
        } finally {
            setSaving(false);
            setEditing(false);
        }
    };

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                {icon}
                {label}
            </p>
            {editing ? (
                <DatePicker
                    value={local}
                    onChange={save}
                    minDate={minDate}
                    placeholder="Sin fecha"
                    className="h-7 text-sm"
                />
            ) : (
                <button
                    onClick={() => setEditing(true)}
                    className="group flex items-center gap-1.5 text-sm font-medium hover:text-foreground/70 transition-colors text-left"
                    disabled={saving}
                >
                    <span>{formatDateDisplay(value)}</span>
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                </button>
            )}
        </div>
    );
}

// ── InlineTextarea ────────────────────────────────────────────────────────────
interface InlineTextareaProps {
    value: string | null | undefined;
    onSave: (value: string | null) => Promise<void>;
    placeholder?: string;
}

function InlineTextarea({ value, onSave, placeholder }: InlineTextareaProps) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value || "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(local.trim() || null);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const cancel = () => {
        setLocal(value || "");
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="space-y-2">
                <Textarea
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    rows={4}
                    autoFocus
                    className="text-sm resize-none"
                    disabled={saving}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") cancel();
                        if (e.key === "Enter" && e.metaKey) save();
                    }}
                />
                <div className="flex gap-2">
                    <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
                        <Check className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancel} className="h-7 text-xs">
                        Cancelar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <button onClick={() => setEditing(true)} className="group w-full text-left">
            {value ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 group-hover:text-muted-foreground/70 transition-colors">
                    {value}
                    <Pencil className="inline h-3 w-3 opacity-0 group-hover:opacity-40 ml-1 transition-opacity" />
                </p>
            ) : (
                <p className="text-sm text-muted-foreground/40 italic flex items-center gap-1">
                    {placeholder || "Sin descripción"}
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                </p>
            )}
        </button>
    );
}

// ── InlineTaxLabel ────────────────────────────────────────────────────────────
const TAX_LABELS = ["IVA", "VAT", "Sales Tax", "GST", "ICMS", "Tax"];

interface InlineTaxLabelProps {
    value: string | null | undefined;
    onSave: (value: string) => Promise<void>;
    className?: string;
}

function InlineTaxLabel({ value, onSave, className }: InlineTaxLabelProps) {
    const [saving, setSaving] = useState(false);

    const handleChange = async (newVal: string) => {
        setSaving(true);
        try { await onSave(newVal); } finally { setSaving(false); }
    };

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                Tipo de impuesto
            </p>
            <Select value={value || "IVA"} onValueChange={handleChange} disabled={saving}>
                <SelectTrigger className="h-7 text-sm border-transparent bg-transparent hover:bg-muted/50 transition-colors px-1 w-auto gap-1 [&>*:last-child]:hidden">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {TAX_LABELS.map((label) => (
                        <SelectItem key={label} value={label}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ── KPI Row: fila de valores clave ────────────────────────────────────────────
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

// ── Vista Principal ───────────────────────────────────────────────────────────
export function QuoteOverviewView({ quote, contractSummary, items = [] }: QuoteOverviewViewProps) {
    const isContract = quote.quote_type === "contract";
    const money = useMoney();
    const statusInfo = STATUS_MAP[quote.status] || { label: quote.status, variant: "secondary" as const, icon: null };
    const showExchangeRate = !!quote.exchange_rate && quote.exchange_rate !== 1;

    const saveField = useCallback(
        async (field: Parameters<typeof updateQuoteDocumentTerms>[1]) => {
            const result = await updateQuoteDocumentTerms(quote.id, field);
            if (result.error) toast.error("Error al guardar: " + result.error);
        },
        [quote.id]
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

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

                {/* ── Identificación ────────────────────────────────────────── */}
                <SettingsSection
                    icon={Building2}
                    title="Identificación"
                    description="Cliente, proyecto y estado del documento."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Cliente */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Cliente</p>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    {(quote.client_name || "SC").substring(0, 2).toUpperCase()}
                                </div>
                                <p className="text-sm font-medium truncate">{quote.client_name || "Sin cliente"}</p>
                            </div>
                        </div>

                        {/* Proyecto */}
                        {quote.project_name && (
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Proyecto</p>
                                <p className="text-sm font-medium">{quote.project_name}</p>
                            </div>
                        )}

                        {/* Estado */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Estado</p>
                            <Badge variant={statusInfo.variant} className="gap-1">
                                {statusInfo.icon}
                                {statusInfo.label}
                            </Badge>
                        </div>

                        {/* Versión */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Versión</p>
                            <p className="text-sm font-medium">v{quote.version}</p>
                        </div>
                    </div>
                </SettingsSection>

                {/* ── Descripción / Alcance ─────────────────────────────────── */}
                <SettingsSection
                    icon={FileText}
                    title={isContract ? "Alcance del Contrato" : "Descripción"}
                    description="Hacé click en el texto para editar."
                >
                    <InlineTextarea
                        value={quote.description}
                        onSave={(description) => saveField({ description })}
                        placeholder="Agregar descripción del alcance..."
                    />
                </SettingsSection>

                {/* ── Términos del Documento ────────────────────────────────── */}
                <SettingsSection
                    icon={Receipt}
                    title="Términos del Documento"
                    description="Fechas, impuesto, descuento y tipo de cambio. Hacé click para editar."
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                        <InlineDateField
                            label="Fecha del documento"
                            icon={<Calendar className="h-3 w-3" />}
                            value={quote.quote_date}
                            onSave={(quote_date) => saveField({ quote_date })}
                        />
                        <InlineDateField
                            label="Válido hasta"
                            icon={<Clock className="h-3 w-3" />}
                            value={quote.valid_until}
                            onSave={(valid_until) => saveField({ valid_until })}
                            minDate={quote.quote_date ? (parseDateFromDB(quote.quote_date) ?? undefined) : undefined}
                        />
                        <InlineField
                            label="Impuesto %"
                            icon={<Percent className="h-3 w-3" />}
                            value={String(quote.tax_pct ?? 0)}
                            displayValue={`${quote.tax_pct ?? 0}%`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            onSave={(v) => saveField({ tax_pct: parseFloat(v) || 0 })}
                        />
                        <InlineField
                            label="Descuento %"
                            icon={<Percent className="h-3 w-3" />}
                            value={String(quote.discount_pct ?? 0)}
                            displayValue={`${quote.discount_pct ?? 0}%`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            onSave={(v) => saveField({ discount_pct: parseFloat(v) || 0 })}
                        />
                        <InlineTaxLabel
                            value={quote.tax_label}
                            onSave={(tax_label) => saveField({ tax_label })}
                        />
                        {showExchangeRate && (
                            <InlineField
                                label="Tipo de cambio"
                                icon={<ArrowLeftRight className="h-3 w-3" />}
                                value={String(quote.exchange_rate ?? 1)}
                                displayValue={String(quote.exchange_rate ?? 1)}
                                type="number"
                                step="0.000001"
                                min="0"
                                onSave={(v) => saveField({ exchange_rate: parseFloat(v) || 1 })}
                            />
                        )}
                    </div>
                </SettingsSection>

                {/* ── Financiero: Contrato ──────────────────────────────────── */}
                {isContract && contractSummary && (
                    <SettingsSection
                        icon={DollarSign}
                        title="Valor del Contrato"
                        description={
                            <>
                                <span>Contrato original congelado al momento de la aprobación.</span>
                                {contractSummary.change_order_count > 0 && (
                                    <span>{contractSummary.change_order_count} orden{contractSummary.change_order_count !== 1 ? "es" : ""} de cambio registrada{contractSummary.change_order_count !== 1 ? "s" : ""}.</span>
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

                {/* ── Financiero: Cotización / Adicional ───────────────────── */}
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

                {/* ── Financiero: Adicional (change_order) extra info ───────── */}
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
        </div>
    );
}
