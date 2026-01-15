"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/providers/modal-store";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/form-footer";
import { FormGroup } from "@/components/ui/form-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SingleImageDropzone } from "@/components/ui/single-image-dropzone";
import { createPaymentAction } from "@/features/clients/actions";

interface PaymentFormProps {
    projectId: string;
    organizationId: string;
    clients: any[];
    financialData: any; // Unified data
    initialData?: any;
    onSuccess?: () => void;
}

export function PaymentForm({
    projectId,
    organizationId,
    clients,
    financialData,
    initialData,
    onSuccess
}: PaymentFormProps) {
    const { closeModal } = useModal();
    const t = useTranslations('Clients.payments'); // Assuming translations exist or fallback
    const [isLoading, setIsLoading] = useState(false);

    const { wallets, currencies, defaultWalletId, defaultCurrencyId } = financialData;

    // Form State
    const [date, setDate] = useState<Date | undefined>(
        initialData?.payment_date ? new Date(initialData.payment_date) : new Date()
    );
    const [clientId, setClientId] = useState(initialData?.client_id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || defaultWalletId || "");
    const [amount, setAmount] = useState(initialData?.amount || "");
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || defaultCurrencyId || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate || "1.0000");
    const [status, setStatus] = useState(initialData?.status || "confirmed");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");
    const [file, setFile] = useState<File | undefined>();
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || ""); // For receipts

    // Auto-select currency if wallet changes and has a currency
    useEffect(() => {
        if (walletId) {
            const wallet = wallets.find((w: any) => w.id === walletId);
            // In unified query we map wallet.currency_id but let's check structure
            // We mapped: currency_symbol, currency_code, NOT currency_id directly in the top level of formattedWallets
            // But we can infer it or we should add it to formattedWallets in queries.ts if strictly needed.
            // Using logic: find currency with matching symbol/code?
            // Actually, let's fix queries.ts to include currency_id in the formatted wallet if possible, or just look up by symbol.

            // Allow manual override, but hint default.
            // If the wallet has a specific currency related to it in the system, we might want to auto-select it.
            // For now, let's assume the user selects currency manually if default isn't enough, 
            // OR if we want to be smart:
            if (wallet?.currency_code) {
                const matchingCurrency = currencies.find((c: any) => c.code === wallet.currency_code);
                if (matchingCurrency) {
                    setCurrencyId(matchingCurrency.id);
                }
            }
        }
    }, [walletId, wallets, currencies]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('organization_id', organizationId);
            formData.append('payment_date', date ? date.toISOString() : new Date().toISOString());
            formData.append('client_id', clientId);
            formData.append('wallet_id', walletId);
            formData.append('amount', amount);
            formData.append('currency_id', currencyId);
            formData.append('exchange_rate', exchangeRate);
            formData.append('status', status);
            if (notes) formData.append('notes', notes);
            if (reference) formData.append('reference', reference);

            // TODO: Handle file upload logic for receipts if needed, similar to ProjectForm
            // For now assuming basic form submission logic exists in actions

            await createPaymentAction(formData as any);

            toast.success("Pago registrado correctamente");
            if (onSuccess) onSuccess();
            closeModal();

        } catch (error: any) {
            console.error("Error submitting payment:", error);
            toast.error(error.message || "Error al registrar pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-1 px-2">
                {/* Row 1: Date & Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Fecha de Pago" required>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </FormGroup>

                    <FormGroup label="Cliente" required>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients
                                    .sort((a, b) => (a.contact_full_name || "").localeCompare(b.contact_full_name || ""))
                                    .map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.contact_full_name || "Cliente sin nombre"}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>
                </div>

                {/* Row 2: Wallet & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Billetera" required>
                        <Select value={walletId} onValueChange={setWalletId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar billetera" />
                            </SelectTrigger>
                            <SelectContent>
                                {wallets.map((wallet: any) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Monto" required>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </FormGroup>
                </div>

                {/* Row 3: Currency & Exchange Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Moneda" required>
                        <Select value={currencyId} onValueChange={setCurrencyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((curr: any) => (
                                    <SelectItem key={curr.id} value={curr.id}>
                                        {curr.name} ({curr.symbol})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Tipo de Cambio (opcional)">
                        <Input
                            type="number"
                            step="0.0001"
                            placeholder="1.0000"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                        />
                    </FormGroup>
                </div>

                {/* Row 4: Commitment & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormGroup label="Compromiso" helpText="Selecciona un cliente primero">
                        <Select disabled>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar compromiso" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Future: Dynamic commitments based on client */}
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    <FormGroup label="Estado" required>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                                <SelectItem value="void">Anulado</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>
                </div>

                {/* Notes */}
                <FormGroup label="Notas (opcional)">
                    <Textarea
                        placeholder="Agregar notas adicionales sobre el pago..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[80px]"
                    />
                </FormGroup>

                {/* Reference */}
                <FormGroup label="Referencia (opcional)">
                    <Input
                        placeholder="Ej: TRX-12345"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </FormGroup>

                {/* File Upload (Receipt) */}
                <FormGroup>
                    <SingleImageDropzone
                        height={150}
                        value={file}
                        onChange={setFile}
                        dropzoneLabel="Arrastra el comprobante o haz clic para seleccionar"
                        className="w-full"
                    />
                </FormGroup>

            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel="Registrar Pago"
                className="-mx-4 -mb-4 mt-6"
            />
        </form>
    );
}
