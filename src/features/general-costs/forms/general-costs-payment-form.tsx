"use client";

/**
 * General Costs — Payment Form (Panel)
 * Standard 19.0 - Self-Contained Panel Form
 *
 * Supports edit mode with Field Factories.
 * View mode is handled by a separate detail panel if needed.
 */

import { useState, useEffect, useRef } from "react";
import { usePanel } from "@/stores/panel-store";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import {
    AmountField,
    DateField,
    SelectField,
    WalletField,
    CurrencyField,
    ExchangeRateField,
    NotesField,
    ReferenceField,
    UploadField,
} from "@/components/shared/forms/fields";
import type { UploadedFile } from "@/hooks/use-file-upload";
import { formatDateForDB, parseDateFromDB } from "@/lib/timezone-data";
import { GeneralCost, GeneralCostPaymentView } from "@/features/general-costs/types";
import { createGeneralCostPayment, updateGeneralCostPayment } from "@/features/general-costs/actions";

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

const STATUS_OPTIONS = [
    { value: "confirmed", label: "Confirmado" },
    { value: "pending", label: "Pendiente" },
    { value: "overdue", label: "Vencido" },
    { value: "cancelled", label: "Cancelado" },
];

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
    const { closePanel, setPanelMeta } = usePanel();
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
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || currencies[0]?.id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || wallets[0]?.id || "");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate?.toString() || "");
    const [files, setFiles] = useState<UploadedFile[]>([]);

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            icon: Receipt,
            title: isEditing ? "Editar Pago" : "Nuevo Pago",
            description: isEditing
                ? "Modificá los datos del pago de gasto general."
                : "Registrá un pago de gasto general.",
            size: "lg",
            footer: {
                submitLabel: isEditing ? "Guardar Cambios" : "Registrar Pago",
            },
        });
    }, [isEditing, setPanelMeta]);

    // ─── Concept options ─────────────────────────────────
    const conceptOptions = [
        { value: "", label: "Sin concepto (Varios)" },
        ...concepts.map((c) => ({ value: c.id, label: c.name })),
    ];

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
            closePanel();
        } catch {
            toast.error("Error al guardar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <form id={formId} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <DateField
                    label="Fecha de Pago"
                    value={paymentDate}
                    onChange={(d) => d && setPaymentDate(d)}
                    required
                />

                {/* Estado */}
                <SelectField
                    label="Estado"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS}
                    placeholder="Seleccionar estado"
                />

                {/* Concepto — full width */}
                <SelectField
                    label="Concepto"
                    value={generalCostId}
                    onChange={setGeneralCostId}
                    options={conceptOptions}
                    placeholder="Buscar concepto..."
                    searchable
                    clearable
                    className="md:col-span-2"
                />

                {/* Billetera */}
                <WalletField
                    value={walletId}
                    onChange={setWalletId}
                    wallets={wallets.map((w) => ({ id: w.id, name: w.wallet_name }))}
                    required
                />

                {/* Monto */}
                <AmountField
                    value={amount}
                    onChange={setAmount}
                />

                {/* Moneda */}
                <CurrencyField
                    value={currencyId}
                    onChange={setCurrencyId}
                    currencies={currencies}
                    required
                />

                {/* Cotización */}
                <ExchangeRateField
                    value={exchangeRate}
                    onChange={setExchangeRate}
                />

                {/* Notas — full width */}
                <NotesField
                    value={notes}
                    onChange={setNotes}
                    placeholder="Descripción del pago..."
                    rows={2}
                    className="md:col-span-2"
                />

                {/* Referencia — full width */}
                <ReferenceField
                    value={reference}
                    onChange={setReference}
                    placeholder="Nro. de recibo, factura, etc."
                    className="md:col-span-2"
                />

                {/* Comprobante — full width */}
                <UploadField
                    label="Comprobante"
                    mode="multi-file"
                    value={files}
                    onChange={(f) => setFiles(Array.isArray(f) ? f : f ? [f] : [])}
                    bucket="private-assets"
                    folderPath={`organizations/${organizationId}/finance/general-costs`}
                    maxSizeMB={5}
                    className="md:col-span-2"
                    cleanupRef={uploadCleanupRef}
                />
            </div>
        </form>
    );
}
