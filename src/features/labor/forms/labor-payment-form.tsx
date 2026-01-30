"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Wallet, FileText, ArrowDownCircle } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { formatDateForDB } from "@/lib/timezone-data";
import { LaborPaymentView, LaborType, ProjectLaborView, LABOR_PAYMENT_STATUS_LABELS } from "../types";
import { createLaborPayment, updateLaborPayment } from "../actions";
import { useMoney } from "@/hooks/use-money";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FormattedWallet {
    id: string;
    wallet_id: string;
    name: string;
    balance: number;
    currency_symbol: string;
    currency_code?: string;
    is_default: boolean;
}

interface FormattedCurrency {
    id: string;
    name: string;
    code: string;
    symbol: string;
    is_default: boolean;
    exchange_rate: number;
}

interface LaborPaymentFormProps {
    initialData?: LaborPaymentView | null;
    workers: ProjectLaborView[];
    laborTypes: LaborType[];
    wallets: FormattedWallet[];
    currencies: FormattedCurrency[];
    projectId: string;
    organizationId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function LaborPaymentForm({
    initialData,
    workers,
    laborTypes,
    wallets,
    currencies,
    projectId,
    organizationId,
    onSuccess,
    onCancel,
}: LaborPaymentFormProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const money = useMoney();

    // Get default currency and wallet
    const defaultCurrency = currencies.find(c => c.is_default) || currencies[0];
    const defaultWallet = wallets.find(w => w.is_default) || wallets[0];

    // Form state
    const [paymentDate, setPaymentDate] = useState<Date>(
        initialData?.payment_date ? new Date(initialData.payment_date) : new Date()
    );
    const [laborId, setLaborId] = useState<string>(initialData?.labor_id || "");
    const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
    const [status, setStatus] = useState<string>(initialData?.status || "confirmed");
    const [currencyId, setCurrencyId] = useState<string>(initialData?.currency_id || defaultCurrency?.id || "");
    const [walletId, setWalletId] = useState<string>(initialData?.wallet_id || defaultWallet?.id || "");
    const [notes, setNotes] = useState<string>(initialData?.notes || "");
    const [reference, setReference] = useState<string>(initialData?.reference || "");
    const [exchangeRate, setExchangeRate] = useState<string>(
        initialData?.exchange_rate?.toString() || defaultCurrency?.exchange_rate?.toString() || "1"
    );

    // Update exchange rate when currency changes
    const handleCurrencyChange = (newCurrencyId: string) => {
        setCurrencyId(newCurrencyId);
        const selectedCurrency = currencies.find(c => c.id === newCurrencyId);
        if (selectedCurrency) {
            setExchangeRate(selectedCurrency.exchange_rate?.toString() || "1");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("El monto debe ser mayor a 0");
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
                labor_id: laborId || null,
                amount: parseFloat(amount),
                status,
                currency_id: currencyId,
                exchange_rate: parseFloat(exchangeRate) || 1,
                wallet_id: walletId || null,
                notes: notes || null,
                reference: reference || null,
            };

            if (isEditing && initialData) {
                await updateLaborPayment(initialData.id, payload, projectId);
                toast.success("Pago actualizado");
            } else {
                await createLaborPayment({
                    ...payload,
                    project_id: projectId,
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

    // Get labor type name from worker
    const getLaborTypeName = (worker: ProjectLaborView) => {
        return worker.labor_type_name || null;
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

                    {/* Trabajador */}
                    <FormGroup label="Trabajador">
                        <Select value={laborId || "none"} onValueChange={(v) => setLaborId(v === "none" ? "" : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar trabajador" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin asignar (Varios)</SelectItem>
                                {workers.map((worker) => (
                                    <SelectItem key={worker.id} value={worker.id}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5 border border-border/50">
                                                {worker.contact_image_url && (
                                                    <AvatarImage src={worker.contact_image_url} alt={worker.contact_display_name || ""} />
                                                )}
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                                    {(worker.contact_display_name || "?").slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{worker.contact_display_name || "Sin nombre"}</span>
                                            {getLaborTypeName(worker) && (
                                                <Badge variant="outline" className="text-xs ml-1">
                                                    {getLaborTypeName(worker)}
                                                </Badge>
                                            )}
                                        </div>
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
                        <Select value={currencyId} onValueChange={handleCurrencyChange}>
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

                    {/* Billetera */}
                    <FormGroup label="Billetera">
                        <Select value={walletId || "none"} onValueChange={(v) => setWalletId(v === "none" ? "" : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar billetera" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sin especificar</SelectItem>
                                {wallets.map((wallet) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name}
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
                                <SelectItem value="rejected">Rechazado</SelectItem>
                                <SelectItem value="void">Anulado</SelectItem>
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
                            placeholder="Ej: RBO-001"
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
