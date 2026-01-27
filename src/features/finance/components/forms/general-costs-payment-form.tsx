"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";

import { cn } from "@/lib/utils";
import { GeneralCost, GeneralCostPaymentView } from "@/types/general-costs";
import { createGeneralCostPayment, updateGeneralCostPayment } from "@/actions/general-costs";

interface PaymentFormProps {
    initialData?: GeneralCostPaymentView | null;
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; code: string; symbol: string }[];
    organizationId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function PaymentForm({
    initialData,
    concepts,
    wallets,
    currencies,
    organizationId,
    onSuccess,
    onCancel
}: PaymentFormProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [paymentDate, setPaymentDate] = useState<Date>(
        initialData?.payment_date ? new Date(initialData.payment_date) : new Date()
    );
    const [generalCostId, setGeneralCostId] = useState<string>(initialData?.general_cost_id || "");
    const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
    const [status, setStatus] = useState<string>(initialData?.status || "confirmed");
    const [currencyId, setCurrencyId] = useState<string>(initialData?.currency_id || currencies[0]?.id || "");
    const [walletId, setWalletId] = useState<string>(initialData?.wallet_id || wallets[0]?.id || "");
    const [notes, setNotes] = useState<string>(initialData?.notes || "");
    const [reference, setReference] = useState<string>(initialData?.reference || "");
    const [exchangeRate, setExchangeRate] = useState<string>(
        initialData?.exchange_rate?.toString() || ""
    );

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
                payment_date: paymentDate.toISOString(),
                general_cost_id: generalCostId || undefined,
                amount: parseFloat(amount),
                status,
                currency_id: currencyId,
                wallet_id: walletId,
                notes: notes || undefined,
                reference: reference || undefined,
                exchange_rate: exchangeRate ? parseFloat(exchangeRate) : undefined,
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
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el pago");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
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
                                    {paymentDate ? format(paymentDate, "PPP", { locale: es }) : "Seleccionar"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={paymentDate}
                                    onSelect={(date) => date && setPaymentDate(date)}
                                    locale={es}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </FormGroup>

                    {/* Concepto */}
                    <FormGroup label="Concepto">
                        <Select value={generalCostId || "none"} onValueChange={(v) => setGeneralCostId(v === "none" ? "" : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar concepto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin concepto (Varios)</SelectItem>
                                {concepts.map((concept) => (
                                    <SelectItem key={concept.id} value={concept.id}>
                                        {concept.name}
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
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </FormGroup>

                    {/* Moneda */}
                    <FormGroup label="Moneda" required>
                        <Select value={currencyId} onValueChange={setCurrencyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((curr) => (
                                    <SelectItem key={curr.id} value={curr.id}>
                                        {curr.code} ({curr.symbol})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormGroup>

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

                    {/* Estado */}
                    <FormGroup label="Estado">
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="confirmed">Confirmado</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="overdue">Vencido</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormGroup>

                    {/* Cotización (opcional) */}
                    <FormGroup label="Cotización" helpText="Tipo de cambio si aplica">
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Ej: 1050.50"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                        />
                    </FormGroup>

                    {/* Referencia */}
                    <FormGroup label="Referencia" helpText="Nro. de recibo, factura, etc.">
                        <Input
                            placeholder="Ej: FAC-001"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                        />
                    </FormGroup>

                    {/* Notas - Full width */}
                    <FormGroup label="Descripción / Notas" className="md:col-span-2">
                        <Textarea
                            placeholder="Descripción del pago..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </FormGroup>
                </div>
            </div>

            {/* Sticky Footer */}
            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={isEditing ? "Guardar Cambios" : "Registrar Pago"}
                onCancel={onCancel}
            />
        </form>
    );
}
