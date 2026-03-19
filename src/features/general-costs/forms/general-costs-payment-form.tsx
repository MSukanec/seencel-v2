"use client";

/**
 * General Costs — Payment Form (Modal)
 * Hybrid Chip Form — Linear-inspired
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Header (icon + title)           │
 * ├─────────────────────────────────┤
 * │ Chips (metadata)                │
 * │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 * │ Hero: Amount (big, bg accent)   │
 * │                                 │
 * │ Exchange rate (borderless)      │
 * │ Notes (borderless textarea)     │
 * │ Reference (borderless)          │
 * │ Upload                          │
 * ├─────────────────────────────────┤
 * │ Footer (cancel + submit)        │
 * └─────────────────────────────────┘
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { usePanel } from "@/stores/panel-store";
import { Receipt, FileText } from "lucide-react";
import { toast } from "sonner";
import {
    ChipRow,
    SelectChip,
    StatusChip,
    WalletChip,
    CurrencyChip,
    DateChip,
    PeriodChip,
    AttachmentChip,
} from "@/components/shared/chips";
import type { StatusOption } from "@/components/shared/chips";
import type { PeriodGranularity } from "@/components/shared/chips";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { GeneralCost, GeneralCostPaymentView } from "@/features/general-costs/types";
import { createGeneralCostPayment, updateGeneralCostPayment } from "@/features/general-costs/actions";
import { FormTextField } from "@/components/shared/forms/fields/form-text-field";

// ─── Types ───────────────────────────────────────────────

interface PaymentFormProps {
    organizationId: string;
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; name: string; code: string; symbol: string }[];
    initialData?: GeneralCostPaymentView | null;
    onSuccess?: () => void;
    formId?: string;
}

// ─── Status options ──────────────────────────────────────

const STATUS_OPTIONS: StatusOption[] = [
    { value: "confirmed", label: "Confirmado", variant: "positive" },
    { value: "pending", label: "Pendiente", variant: "warning" },
    { value: "overdue", label: "Vencido", variant: "negative" },
    { value: "cancelled", label: "Cancelado", variant: "neutral" },
];

/** Format amount with thousand separators for display (AR format: 150.000,50) */
function formatAmountDisplay(raw: string): string {
    const [integer, decimal] = raw.split(".");
    const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return decimal !== undefined ? `${formatted},${decimal}` : formatted;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsPaymentForm({
    organizationId,
    concepts,
    wallets,
    currencies,
    initialData,
    onSuccess,
    formId,
}: PaymentFormProps) {
    const { closePanel, setPanelMeta, completePanel } = usePanel();
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const uploadCleanupRef = useRef<(() => void) | null>(null);

    // ─── Form state ──────────────────────────────────────
    const [paymentDate, setPaymentDate] = useState<Date>(
        parseDateFromDB(initialData?.payment_date) || new Date()
    );
    const [generalCostId, setGeneralCostId] = useState(initialData?.general_cost_id || "");
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [status, setStatus] = useState(initialData?.status || "confirmed");
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || currencies?.[0]?.id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || wallets?.[0]?.id || "");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate?.toString() || "");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [coversPeriod, setCoversPeriod] = useState(
        initialData?.covers_period || ""
    );

    // Reset form for "create another"
    const resetForm = () => {
        setAmount("");
        setNotes("");
        setReference("");
        setFiles([]);
        setExchangeRate("");
        setPaymentDate(new Date());
        setCoversPeriod("");
    };

    // ─── Derived state ───────────────────────────────────
    const selectedConcept = useMemo(
        () => (concepts || []).find(c => c.id === generalCostId),
        [concepts, generalCostId]
    );
    const isRecurring = selectedConcept?.is_recurring ?? false;

    const periodGranularity = useMemo((): PeriodGranularity => {
        switch (selectedConcept?.recurrence_interval) {
            case 'monthly': return 'month';
            case 'quarterly': return 'quarter';
            case 'yearly': return 'year';
            default: return 'month';
        }
    }, [selectedConcept?.recurrence_interval]);

    const selectedCurrency = currencies?.find(c => c.id === currencyId);
    const currencySymbol = selectedCurrency?.symbol || "$";

    // Auto-set/clear covers_period when concept changes
    useEffect(() => {
        if (isRecurring && !coversPeriod) {
            const d = paymentDate || new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            setCoversPeriod(`${y}-${m}-01`);
        }
        if (!isRecurring && coversPeriod) {
            setCoversPeriod("");
        }
    }, [isRecurring]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: Receipt,
            title: isEditing ? "Editar Pago" : "Nuevo Pago de Gastos Generales",
            description: isEditing
                ? "Modificá los datos del pago de gasto general."
                : "Registrá un pago de gasto general.",
            size: "lg",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Registrar Pago",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Chip options ────────────────────────────────────
    const conceptChipOptions = useMemo(() =>
        (concepts || []).map((c) => ({
            value: c.id,
            label: c.name,
            icon: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
        })),
        [concepts]
    );

    const walletChipOptions = useMemo(() =>
        (wallets || []).map((w) => ({ value: w.id, label: w.wallet_name })),
        [wallets]
    );

    const currencyChipOptions = useMemo(() =>
        (currencies || []).map((c) => ({
            value: c.id,
            label: `${c.name} (${c.symbol})`,
            symbol: c.symbol,
        })),
        [currencies]
    );

    // ─── Submit ──────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("El monto debe ser mayor a 0");
            return;
        }
        if (!walletId) {
            toast.error("Seleccioná una billetera");
            return;
        }
        if (!currencyId) {
            toast.error("Seleccioná una moneda");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                payment_date: formatDateForDB(paymentDate)!,
                general_cost_id: generalCostId || undefined,
                amount: parseFloat(amount),
                status,
                currency_id: currencyId,
                wallet_id: walletId,
                notes: notes || undefined,
                reference: reference || undefined,
                exchange_rate: exchangeRate ? parseFloat(exchangeRate) : undefined,
                covers_period: isRecurring && coversPeriod ? coversPeriod : undefined,
                media_files: files && files.length > 0 ? files : undefined,
            };

            if (isEditing && initialData) {
                await updateGeneralCostPayment(initialData.id, payload);
                toast.success("Pago actualizado");
            } else {
                await createGeneralCostPayment({
                    ...payload,
                    organization_id: organizationId,
                });
                toast.success("Pago registrado");
            }
            onSuccess?.();

            // If "create another" is active and we're creating (not editing), reset form
            if (isEditing) {
                closePanel();
            } else {
                completePanel(resetForm);
            }
        } catch {
            toast.error("Error al guardar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit} className="flex flex-col flex-1">
            {/* ── Chips: Metadata ───────────────────────── */}
            <ChipRow>
                <DateChip
                    value={paymentDate}
                    onChange={(d) => d && setPaymentDate(d)}
                />
                <SelectChip
                    value={generalCostId}
                    onChange={setGeneralCostId}
                    options={conceptChipOptions}
                    icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    emptyLabel="Concepto"
                    searchPlaceholder="Buscar concepto..."
                    popoverWidth={240}
                />
                <PeriodChip
                    value={coversPeriod}
                    onChange={setCoversPeriod}
                    granularity={periodGranularity}
                    disabled={!isRecurring}
                />
                <StatusChip
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS}
                />
                <WalletChip
                    value={walletId}
                    onChange={setWalletId}
                    options={walletChipOptions}
                />
                <CurrencyChip
                    value={currencyId}
                    onChange={setCurrencyId}
                    options={currencyChipOptions}
                />
                <AttachmentChip
                    value={files}
                    onChange={setFiles}
                    bucket="private-assets"
                    folderPath={`organizations/${organizationId}/finance/general-costs`}
                    maxSizeMB={5}
                    cleanupRef={uploadCleanupRef}
                />
            </ChipRow>

            {/* ── Hero: Amount ──────────────────────────── */}
            <FormTextField
                variant="hero"
                value={amount ? formatAmountDisplay(amount) : ""}
                onChange={(v) => {
                    const raw = v.replace(/\./g, "").replace(",", ".");
                    if (raw === "" || /^\d*\.?\d*$/.test(raw)) setAmount(raw);
                }}
                placeholder="0.00"
                prefix={currencySymbol}
                inputMode="decimal"
                size="lg"
                autoFocus
            >
                {/* Exchange rate inline */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="select-none">Tasa de Cambio</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={exchangeRate ? formatAmountDisplay(exchangeRate) : ""}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/\./g, "").replace(",", ".");
                            if (raw === "" || /^\d*\.?\d*$/.test(raw)) setExchangeRate(raw);
                        }}
                        placeholder="1,0000"
                        className="w-20 bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/30 outline-none border-none text-right font-mono"
                    />
                </div>
            </FormTextField>

            {/* ── Borderless fields ─────────────────────── */}
            <div className="flex-1 mt-4 space-y-1">
                {/* Notes */}
                <FormTextField
                    variant="body"
                    value={notes}
                    onChange={setNotes}
                />

                {/* Reference */}
                <FormTextField
                    variant="caption"
                    value={reference}
                    onChange={setReference}
                />
            </div>
        </form>
    );
}
