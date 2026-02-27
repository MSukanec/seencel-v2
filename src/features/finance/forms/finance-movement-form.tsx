"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Receipt, Users, RefreshCcw, ArrowRightLeft, DollarSign } from "lucide-react";
import { useRouter } from "@/i18n/routing";

import { formatDateForDB } from "@/lib/timezone-data";
import { createGeneralCostPayment } from "@/features/general-costs/actions";

// Panel lifecycle
import { usePanel } from "@/stores/panel-store";

// Field Factories — Standard 19.10
import {
    DateField,
    SelectField,
    WalletField,
    AmountField,
    CurrencyField,
    ExchangeRateField,
    NotesField,
    ReferenceField,
    UploadField,
} from "@/components/shared/forms/fields";
import type { UploadedFile } from "@/components/shared/multi-file-upload";

// Import sub-forms
import { PaymentForm as ClientPaymentForm } from "@/features/clients/forms/clients-payment-form";
import { CurrencyExchangeForm } from "@/features/finance/forms/finance-currency-exchange-form";
import { WalletTransferForm } from "@/features/finance/forms/finance-wallet-transfer-form";

// === Movement Types ===
type MovementTypeId = "general_cost" | "client_payment" | "currency_exchange" | "wallet_transfer";

const MOVEMENT_TYPE_OPTIONS = [
    { id: "general_cost" as const, label: "Gasto General", icon: Receipt },
    { id: "client_payment" as const, label: "Cobro de Cliente", icon: Users },
    { id: "currency_exchange" as const, label: "Cambio de Moneda", icon: RefreshCcw },
    { id: "wallet_transfer" as const, label: "Transferencia entre Billeteras", icon: ArrowRightLeft },
];

// Convert to SelectField options with icons
const MOVEMENT_TYPE_SELECT_OPTIONS = MOVEMENT_TYPE_OPTIONS.map(o => ({
    value: o.id,
    label: o.label,
}));

// === Props ===
interface FinanceMovementFormProps {
    organizationId: string;
    concepts?: { id: string; name: string }[];
    wallets?: { id: string; wallet_name: string }[];
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    projects?: { id: string; name: string }[];
    clients?: any[];
    financialData?: any;
    initialMovementType?: MovementTypeId;
    onSuccess?: () => void;
    onCancel?: () => void;
    formId?: string; // ← from PanelProvider
}

// === Main Component ===
export function FinanceMovementForm({
    organizationId,
    concepts = [],
    wallets = [],
    currencies = [],
    projects = [],
    clients = [],
    financialData,
    initialMovementType,
    onSuccess,
    onCancel,
    formId,
}: FinanceMovementFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta } = usePanel();

    // Panel-managed lifecycle
    const handleSuccess = useCallback(() => {
        if (onSuccess) {
            onSuccess();
        } else {
            closePanel();
            router.refresh();
        }
    }, [onSuccess, closePanel, router]);

    const handleCancel = useCallback(() => {
        if (onCancel) {
            onCancel();
        } else {
            closePanel();
        }
    }, [onCancel, closePanel]);

    const [isLoading, setIsLoading] = useState(false);

    // Movement type selector
    const [movementType, setMovementType] = useState<MovementTypeId | "">(initialMovementType || "");

    // ─── Panel meta: header + footer ─────────────────────
    useEffect(() => {
        const typeOption = MOVEMENT_TYPE_OPTIONS.find(o => o.id === movementType);

        // Sub-forms set their own footer → only set footer for empty state or general_cost
        const footerConfig = (() => {
            if (movementType === "") {
                // No type selected: cancel-only
                return { cancelLabel: "Cancelar" };
            }
            if (movementType === "general_cost") {
                // Inline form: cancel + submit via formId
                return { submitLabel: "Registrar Pago" };
            }
            // Sub-forms manage their own footer
            return undefined;
        })();

        setPanelMeta({
            title: typeOption ? `Nuevo ${typeOption.label}` : "Nuevo Movimiento",
            description: "Seleccioná el tipo de movimiento y completá los datos.",
            icon: typeOption?.icon || DollarSign,
            footer: footerConfig,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movementType]);

    // ─── Form state (Gasto General) ─────────────────────
    const [paymentDate, setPaymentDate] = useState<Date>(new Date());
    const [generalCostId, setGeneralCostId] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [status, setStatus] = useState<string>("confirmed");
    const [currencyId, setCurrencyId] = useState<string>(currencies[0]?.id || "");
    const [walletId, setWalletId] = useState<string>(wallets[0]?.id || "");
    const [notes, setNotes] = useState<string>("");
    const [reference, setReference] = useState<string>("");
    const [exchangeRate, setExchangeRate] = useState<string>("");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Update default currency/wallet when data loads
    useEffect(() => {
        if (!currencyId && currencies.length > 0) setCurrencyId(currencies[0].id);
    }, [currencies, currencyId]);

    useEffect(() => {
        if (!walletId && wallets.length > 0) setWalletId(wallets[0].id);
    }, [wallets, walletId]);

    // Concept options for SelectField
    const conceptOptions = [
        { value: "", label: "Sin concepto (Varios)" },
        ...concepts.map(c => ({ value: c.id, label: c.name }))
    ];

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
                organization_id: organizationId,
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

            await createGeneralCostPayment(payload);
            toast.success("Pago registrado correctamente");
            handleSuccess();
        } catch (error) {
            console.error("Error creating payment:", error);
            toast.error("Error al registrar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Type Selector (shared across all branches) ─────
    const TypeSelector = () => (
        <SelectField
            label="Tipo de Movimiento"
            required
            value={movementType}
            onChange={(v) => setMovementType(v as MovementTypeId | "")}
            options={MOVEMENT_TYPE_SELECT_OPTIONS}
            placeholder="Seleccionar tipo de movimiento"
            renderOption={(option) => {
                const typeOpt = MOVEMENT_TYPE_OPTIONS.find(o => o.id === option.value);
                const Icon = typeOpt?.icon;
                return (
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <span>{option.label}</span>
                    </div>
                );
            }}
        />
    );

    // ─── Sub-form: Currency Exchange ─────────────────────
    if (movementType === "currency_exchange") {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="shrink-0 mb-4">
                    <TypeSelector />
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                    <CurrencyExchangeForm
                        organizationId={organizationId}
                        wallets={wallets}
                        currencies={currencies}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        );
    }

    // ─── Sub-form: Wallet Transfer ───────────────────────
    if (movementType === "wallet_transfer") {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="shrink-0 mb-4">
                    <TypeSelector />
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                    <WalletTransferForm
                        organizationId={organizationId}
                        wallets={wallets}
                        currencies={currencies}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        );
    }

    // ─── Sub-form: Client Payment ────────────────────────
    if (movementType === "client_payment" && financialData) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="shrink-0 mb-4">
                    <TypeSelector />
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                    <ClientPaymentForm
                        organizationId={organizationId}
                        clients={clients}
                        financialData={financialData}
                        projects={projects}
                        showProjectSelector={true}
                        onSuccess={handleSuccess}
                    />
                </div>
            </div>
        );
    }

    if (movementType === "client_payment" && !financialData) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="shrink-0 mb-4">
                    <TypeSelector />
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        No hay datos financieros disponibles para registrar cobros.
                    </p>
                </div>
            </div>
        );
    }

    // ─── Inline form: General Cost (or empty type) ──────
    return (
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
            {/* Movement Type Selector */}
            <TypeSelector />

            {/* General Cost Fields — only show when selected */}
            {movementType === "general_cost" && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateField
                            label="Fecha de Pago"
                            value={paymentDate}
                            onChange={(date) => date && setPaymentDate(date)}
                        />

                        <SelectField
                            label="Estado"
                            value={status}
                            onChange={setStatus}
                            options={[
                                { value: "confirmed", label: "Confirmado" },
                                { value: "pending", label: "Pendiente" },
                            ]}
                        />
                    </div>

                    {/* Concepto */}
                    <SelectField
                        label="Concepto"
                        value={generalCostId}
                        onChange={setGeneralCostId}
                        options={conceptOptions}
                        placeholder="Buscar concepto..."
                        searchable
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WalletField
                            value={walletId}
                            onChange={setWalletId}
                            wallets={wallets}
                        />

                        <AmountField
                            value={amount}
                            onChange={setAmount}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CurrencyField
                            value={currencyId}
                            onChange={setCurrencyId}
                            currencies={currencies}
                        />

                        <ExchangeRateField
                            value={exchangeRate}
                            onChange={setExchangeRate}
                        />
                    </div>

                    <NotesField
                        value={notes}
                        onChange={setNotes}
                        placeholder="Descripción del pago..."
                    />

                    <ReferenceField
                        value={reference}
                        onChange={setReference}
                    />

                    <UploadField
                        label="Comprobante"
                        mode="multi-file"
                        value={files}
                        onChange={(val) => setFiles(val ? (Array.isArray(val) ? val : [val]) : [])}
                        folderPath={`organizations/${organizationId}/payments`}
                        maxSizeMB={5}
                        cleanupRef={cleanupRef}
                    />
                </>
            )}
        </form>
    );
}
