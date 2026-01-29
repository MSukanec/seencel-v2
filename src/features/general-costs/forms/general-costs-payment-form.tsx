"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Wallet, FileText, ArrowDownCircle, User } from "lucide-react";

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
import { ViewFormFooter } from "@/components/shared/forms/view-form-footer";
import { DetailField, DetailGrid, DetailSection } from "@/components/shared/forms/detail-field";
import { Badge } from "@/components/ui/badge";
import { AttachmentList, AttachmentItem } from "@/components/shared/attachments/attachment-list";

import { cn } from "@/lib/utils";
import { GeneralCost, GeneralCostPaymentView } from "@/features/general-costs/types";
import { createGeneralCostPayment, updateGeneralCostPayment } from "@/features/general-costs/actions";
import { useMoney } from "@/hooks/use-money";
import { getMovementAttachments, getAttachmentUrl } from "@/features/finance/actions";

interface PaymentFormProps {
    initialData?: GeneralCostPaymentView | null;
    concepts: GeneralCost[];
    wallets: { id: string; wallet_name: string }[];
    currencies: { id: string; code: string; symbol: string }[];
    organizationId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    onEdit?: () => void;
    viewMode?: boolean;
}

export function PaymentForm({
    initialData,
    concepts,
    wallets,
    currencies,
    organizationId,
    onSuccess,
    onCancel,
    onEdit,
    viewMode = false
}: PaymentFormProps) {
    const isEditing = !!initialData;
    const [isLoading, setIsLoading] = useState(false);
    const money = useMoney();

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

    // === VIEW MODE: Read-only detail view ===
    if (viewMode && initialData) {
        const walletName = wallets.find(w => w.id === initialData.wallet_id)?.wallet_name || "-";
        const conceptName = concepts.find(c => c.id === initialData.general_cost_id)?.name || "Varios";
        const currencyCode = currencies.find(c => c.id === initialData.currency_id)?.code || "";
        const amountValue = Number(initialData.amount);
        const exchangeRateValue = Number(initialData.exchange_rate);

        // Attachments state and fetch logic for view mode
        const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
        const [loadingAttachments, setLoadingAttachments] = useState(false);

        useEffect(() => {
            if (initialData.has_attachments) {
                setLoadingAttachments(true);
                getMovementAttachments(initialData.id, 'general_cost_payment')
                    .then(({ attachments: data }) => setAttachments(data as AttachmentItem[]))
                    .finally(() => setLoadingAttachments(false));
            }
        }, [initialData.id, initialData.has_attachments]);

        const handleGetUrl = async (bucket: string, filePath: string): Promise<string | null> => {
            const { url } = await getAttachmentUrl(bucket, filePath);
            return url;
        };

        const getStatusBadge = (status: string) => {
            const configs: Record<string, { label: string; className: string }> = {
                confirmed: { label: "Confirmado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
                pending: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
                overdue: { label: "Vencido", className: "bg-destructive/10 text-destructive border-destructive/20" },
                cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" },
            };
            const config = configs[status] || { label: status, className: "" };
            return (
                <Badge variant="outline" className={config.className}>
                    {config.label}
                </Badge>
            );
        };

        return (
            <div className="flex flex-col h-full min-h-0">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Header Section - Type & Status */}
                    <div className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-amount-negative/10">
                                <ArrowDownCircle className="h-5 w-5 text-amount-negative" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">Gastos Generales</p>
                                <p className="text-sm text-muted-foreground">{conceptName}</p>
                            </div>
                        </div>
                        {getStatusBadge(initialData.status)}
                    </div>

                    {/* Amount Section */}
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Monto
                        </p>
                        <p className="text-3xl font-bold font-mono text-amount-negative">
                            -{money.format(Math.abs(amountValue), currencyCode)}
                        </p>
                        {exchangeRateValue && exchangeRateValue !== 1 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Cotización: {exchangeRateValue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>

                    {/* Details Grid */}
                    <DetailSection title="Detalles">
                        <DetailGrid cols={2}>
                            <DetailField
                                label="Fecha"
                                value={
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {format(new Date(initialData.payment_date), "dd 'de' MMMM, yyyy", { locale: es })}
                                    </span>
                                }
                            />
                            <DetailField
                                label="Billetera"
                                value={
                                    <span className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        {walletName}
                                    </span>
                                }
                            />
                            {initialData.reference && (
                                <DetailField
                                    label="Referencia"
                                    value={initialData.reference}
                                />
                            )}
                        </DetailGrid>
                    </DetailSection>

                    {/* Description */}
                    {initialData.notes && (
                        <DetailSection title="Descripción">
                            <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <p className="text-sm text-foreground">{initialData.notes}</p>
                            </div>
                        </DetailSection>
                    )}

                    {/* Creator Info */}
                    {(initialData as any).creator_full_name && (
                        <DetailSection title="Creado por">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    {(initialData as any).creator_avatar_url ? (
                                        <img
                                            src={(initialData as any).creator_avatar_url}
                                            alt={(initialData as any).creator_full_name}
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{(initialData as any).creator_full_name}</p>
                                    {(initialData as any).created_at && (
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date((initialData as any).created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </DetailSection>
                    )}

                    {/* Attachments Section */}
                    {(initialData.has_attachments || attachments.length > 0) && (
                        <DetailSection title="Adjuntos">
                            <AttachmentList
                                attachments={attachments}
                                onGetUrl={handleGetUrl}
                                isLoading={loadingAttachments}
                            />
                        </DetailSection>
                    )}
                </div>

                {/* Footer */}
                <ViewFormFooter
                    className="-mx-4 -mb-4 mt-6"
                    onEdit={onEdit}
                    onClose={onCancel || (() => { })}
                    showEdit={!!onEdit}
                />
            </div>
        );
    }

    // === EDIT MODE: Form with inputs ===
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
