"use client";

import { useState, useEffect, useRef } from "react";
import { useModal } from "@/providers/modal-store";
import { toast } from "sonner";
import { FormFooter } from "@/components/shared/forms/form-footer";
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
import { createSubcontractPaymentAction, updateSubcontractPaymentAction } from "@/features/subcontracts/actions";
import { MultiFileUpload, type UploadedFile, type MultiFileUploadRef } from "@/components/shared/multi-file-upload";

interface SubcontractPaymentFormProps {
    projectId: string;
    organizationId: string;
    subcontracts: any[];
    financialData: any;
    initialData?: any;
    onSuccess?: () => void;
}

export function SubcontractPaymentForm({
    projectId,
    organizationId,
    subcontracts,
    financialData,
    initialData,
    onSuccess
}: SubcontractPaymentFormProps) {
    const { closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const uploadRef = useRef<MultiFileUploadRef>(null);

    const { wallets, currencies, defaultWalletId, defaultCurrencyId } = financialData;

    // Form State
    const [date, setDate] = useState<Date | undefined>(
        initialData?.payment_date ? new Date(initialData.payment_date) : new Date()
    );
    const [subcontractId, setSubcontractId] = useState(initialData?.subcontract_id || "");
    const [walletId, setWalletId] = useState(initialData?.wallet_id || defaultWalletId || "");
    const [amount, setAmount] = useState(initialData?.amount || "");
    const [currencyId, setCurrencyId] = useState(initialData?.currency_id || defaultCurrencyId || "");
    const [exchangeRate, setExchangeRate] = useState(initialData?.exchange_rate || "1.0000");
    const [status, setStatus] = useState(initialData?.status || "confirmed");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [reference, setReference] = useState(initialData?.reference || "");

    // File Upload State
    const [files, setFiles] = useState<UploadedFile[]>(
        (initialData?.attachments && initialData.attachments.length > 0)
            ? initialData.attachments.map((att: any) => ({
                id: att.id || `existing-${Math.random()}`,
                url: att.url,
                name: att.name || 'Adjunto',
                type: att.mime || 'application/octet-stream',
                size: att.size || 0,
                path: '',
                bucket: ''
            })) : []
    );

    // Auto-select currency if wallet changes
    useEffect(() => {
        if (walletId) {
            const wallet = wallets.find((w: any) => w.id === walletId);
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
            // Upload pending files
            let finalFiles = files;
            if (uploadRef.current) {
                const uploaded = await uploadRef.current.startUpload();
                if (uploaded) finalFiles = uploaded;
            }

            const formData = new FormData();
            formData.append('project_id', projectId);
            formData.append('organization_id', organizationId);
            formData.append('payment_date', date ? date.toISOString() : new Date().toISOString());
            if (subcontractId) formData.append('subcontract_id', subcontractId);
            formData.append('wallet_id', walletId);
            formData.append('amount', amount);
            formData.append('currency_id', currencyId);
            formData.append('exchange_rate', exchangeRate);
            formData.append('status', status);
            if (notes) formData.append('notes', notes);
            if (reference) formData.append('reference', reference);

            // Pass currency_code directly
            const selectedCurrency = currencies.find((c: any) => c.id === currencyId);
            if (selectedCurrency?.code) {
                formData.append('currency_code', selectedCurrency.code);
            }

            if (finalFiles && finalFiles.length > 0) {
                formData.append('media_files', JSON.stringify(finalFiles));
            }

            if (initialData?.id) {
                formData.append('id', initialData.id);
                await updateSubcontractPaymentAction(formData as any);
                toast.success("Pago actualizado correctamente");
            } else {
                await createSubcontractPaymentAction(formData as any);
                toast.success("Pago registrado correctamente");
            }
            if (onSuccess) onSuccess();
            closeModal();

        } catch (error: any) {
            console.error("Error submitting subcontract payment:", error);
            toast.error(error.message || "Error al registrar pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 p-6">
                {/* Row 1: Date & Subcontract */}
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

                    <FormGroup label="Subcontrato (Proveedor)" required>
                        <Select value={subcontractId} onValueChange={setSubcontractId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar subcontrato" />
                            </SelectTrigger>
                            <SelectContent>
                                {subcontracts
                                    .map((sub: any) => {
                                        // Get contact name safely
                                        const name = sub.contact?.full_name || sub.contact?.company_name || "Desconocido";
                                        return (
                                            <SelectItem key={sub.id} value={sub.id}>
                                                {name}
                                            </SelectItem>
                                        )
                                    })}
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

                {/* Row 4: Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="Agregar notas adicionales..."
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
                <FormGroup label="Comprobante (opcional)">
                    <MultiFileUpload
                        ref={uploadRef}
                        folderPath={`organizations/${organizationId}/finance/subcontract-payments`}
                        onUploadComplete={setFiles}
                        initialFiles={files}
                        autoUpload={false}
                        maxSizeMB={5}
                        className="w-full"
                    />
                </FormGroup>

            </div>

            <FormFooter
                onCancel={closeModal}
                isLoading={isLoading}
                submitLabel="Registrar Pago"
            />
        </form>
    );
}
