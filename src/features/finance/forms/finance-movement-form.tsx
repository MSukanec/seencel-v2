"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Receipt, Users, RefreshCcw, ArrowRightLeft } from "lucide-react";
import { useRouter } from "@/i18n/routing";

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
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import { MultiFileUpload, type UploadedFile, type MultiFileUploadRef } from "@/components/shared/multi-file-upload";

import { cn } from "@/lib/utils";
import { formatDateForDB } from "@/lib/timezone-data";
import { createGeneralCostPayment } from "@/features/general-costs/actions";

// Modal hook for autonomous lifecycle
import { useModal } from "@/stores/modal-store";

// Import other forms
import { PaymentForm as ClientPaymentForm } from "@/features/clients/components/forms/clients-payment-form";
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

// === Props ===
interface FinanceMovementFormProps {
    // Required data (still passed as props from pages/views)
    organizationId: string;
    concepts?: { id: string; name: string }[];
    wallets?: { id: string; wallet_name: string }[];
    currencies?: { id: string; name: string; code: string; symbol: string }[];
    projects?: { id: string; name: string }[];
    clients?: any[];
    financialData?: any;
    // Optional: pre-select a movement type
    initialMovementType?: MovementTypeId;
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
}: FinanceMovementFormProps) {
    const router = useRouter();
    const { closeModal } = useModal();

    // Internal callbacks - form manages its own lifecycle
    const handleSuccess = () => {
        closeModal();
        router.refresh();
    };

    const handleCancel = () => {
        closeModal();
    };

    const [isLoading, setIsLoading] = useState(false);
    const uploadRef = useRef<MultiFileUploadRef>(null);

    // Movement type selector - starts empty or with initial value
    const [movementType, setMovementType] = useState<MovementTypeId | "">(initialMovementType || "");

    // Form state (Gasto General)
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

    // Update default currency/wallet when data loads
    useEffect(() => {
        if (!currencyId && currencies.length > 0) {
            setCurrencyId(currencies[0].id);
        }
    }, [currencies, currencyId]);

    useEffect(() => {
        if (!walletId && wallets.length > 0) {
            setWalletId(wallets[0].id);
        }
    }, [wallets, walletId]);

    // Prepare concepts for combobox
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
            // Upload files first if any are pending
            let finalFiles = files;
            if (uploadRef.current) {
                const uploaded = await uploadRef.current.startUpload();
                if (uploaded) finalFiles = uploaded;
            }

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
                media_files: finalFiles && finalFiles.length > 0 ? finalFiles : undefined,
            };

            await createGeneralCostPayment(payload);
            toast.success("Pago registrado correctamente");
            closeModal();
            router.refresh();
        } catch (error) {
            console.error("Error creating payment:", error);
            toast.error("Error al registrar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper component for rendering type selector
    const TypeSelector = () => (
        <div className="shrink-0 mb-4">
            <FormGroup label="Tipo de Movimiento" required>
                <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementTypeId | "")}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        {MOVEMENT_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <SelectItem key={option.id} value={option.id}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <span>{option.label}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </FormGroup>
        </div>
    );

    // Currency Exchange form
    if (movementType === "currency_exchange") {
        return (
            <div className="flex flex-col h-full min-h-0">
                <TypeSelector />
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

    // Wallet Transfer form
    if (movementType === "wallet_transfer") {
        return (
            <div className="flex flex-col h-full min-h-0">
                <TypeSelector />
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

    // If client_payment is selected and we have the necessary data, render the client payment form
    if (movementType === "client_payment" && financialData) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <TypeSelector />
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

    // Show message if client_payment selected but no financial data
    if (movementType === "client_payment" && !financialData) {
        return (
            <div className="flex flex-col h-full min-h-0">
                <TypeSelector />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                        No hay datos financieros disponibles para registrar cobros.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {/* Movement Type Selector */}
                    <FormGroup label="Tipo de Movimiento" required>
                        <Select value={movementType} onValueChange={(v) => setMovementType(v as MovementTypeId | "")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo de movimiento" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOVEMENT_TYPE_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <SelectItem key={option.id} value={option.id}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                <span>{option.label}</span>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* General Cost Form Fields - only show when selected */}
                    {movementType === "general_cost" && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <FormGroup label="Fecha de Pago" required>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !paymentDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {paymentDate
                                                    ? format(paymentDate, "d 'de' MMMM 'de' yyyy", { locale: es })
                                                    : "Seleccionar fecha"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={paymentDate}
                                                onSelect={(date) => date && setPaymentDate(date)}
                                                initialFocus
                                                locale={es}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormGroup>

                                {/* Estado */}
                                <FormGroup label="Estado">
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="confirmed">Confirmado</SelectItem>
                                            <SelectItem value="pending">Pendiente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormGroup>
                            </div>

                            {/* Concepto */}
                            <FormGroup label="Concepto">
                                <Combobox
                                    options={conceptOptions}
                                    value={generalCostId}
                                    onValueChange={setGeneralCostId}
                                    placeholder="Buscar concepto..."
                                    searchPlaceholder="Buscar..."
                                />
                            </FormGroup>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Billetera */}
                                <FormGroup label="Billetera" required>
                                    <Select value={walletId} onValueChange={setWalletId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar billetera" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {wallets.map((wallet) => (
                                                <SelectItem key={wallet.id} value={wallet.id}>
                                                    {wallet.wallet_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>

                                {/* Monto */}
                                <FormGroup label="Monto" required>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </FormGroup>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Moneda */}
                                <FormGroup label="Moneda" required>
                                    <Select value={currencyId} onValueChange={setCurrencyId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar moneda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((curr) => (
                                                <SelectItem key={curr.id} value={curr.id}>
                                                    {curr.name} ({curr.symbol})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormGroup>

                                {/* Tipo de Cambio */}
                                <FormGroup label="Tipo de Cambio">
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(e.target.value)}
                                        placeholder="Ej: 1050.50"
                                    />
                                </FormGroup>
                            </div>

                            {/* Notas */}
                            <FormGroup label="Notas">
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Descripción del pago..."
                                    rows={3}
                                />
                            </FormGroup>

                            {/* Referencia */}
                            <FormGroup label="Referencia">
                                <Input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Nro. de recibo, factura, etc."
                                />
                            </FormGroup>

                            {/* Comprobante */}
                            <FormGroup label="Comprobante">
                                <MultiFileUpload
                                    ref={uploadRef}
                                    folderPath={`organizations/${organizationId}/payments`}
                                    onUploadComplete={setFiles}
                                    maxSizeMB={5}
                                />
                            </FormGroup>
                        </>
                    )}
                </div>
            </div>

            {/* Sticky Footer - only show when general_cost is selected */}
            {movementType === "general_cost" && (
                <FormFooter
                    className="-mx-4 -mb-4 mt-6"
                    isLoading={isLoading}
                    submitLabel="Registrar Pago"
                    onCancel={handleCancel}
                />
            )}
        </form>
    );
}
