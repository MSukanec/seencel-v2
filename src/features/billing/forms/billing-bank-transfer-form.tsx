"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/forms/form-footer";
import {
    Upload,
    Copy,
    Check,
    Landmark,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    FileText,
} from "lucide-react";
import {
    createBankTransferPayment,
    uploadTransferReceipt,
} from "@/features/billing/payments/actions/bank-transfer-actions";
import { cn } from "@/lib/utils";

interface BankTransferFormProps {
    productName: string;
    amount: number;
    currency: string;
    // For course purchases
    courseId?: string;
    courseSlug?: string; // For redirect after success
    // For plan/subscription purchases
    planId?: string;
    organizationId?: string;
    billingPeriod?: "monthly" | "annual";
    // For seat purchases
    seatsQuantity?: number;
    // Styling
    planColor?: string;
    // Price breakdown
    originalAmount?: number;   // Original subtotal (in display currency)
    annualSavings?: number;    // Annual plan savings (in display currency)
    // Coupon info
    couponCode?: string;
    discountAmount?: number;   // Coupon discount in USD
    exchangeRate?: number;     // For ARS conversion
    // Callbacks
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Bank account info
const BANK_INFO = {
    bankName: "Banco Galicia",
    alias: "MATIAS.SUKANEC",
    accountNumber: "4026691-4 063-1",
    cbu: "0070063430004026691416",
    cuil: "20-32322767-6",
};

export function BankTransferForm({
    productName,
    amount,
    currency,
    courseId,
    courseSlug,
    planId,
    organizationId,
    billingPeriod,
    seatsQuantity,
    planColor,
    originalAmount,
    annualSavings,
    couponCode,
    discountAmount,
    exchangeRate,
    onSuccess,
    onCancel,
}: BankTransferFormProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Form state
    const [payerName, setPayerName] = useState("");
    const [payerNote, setPayerNote] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const copyToClipboard = async (text: string, field: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!selectedFile || !payerName.trim()) {
                setError("Por favor completa todos los campos requeridos");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // 1. Upload receipt
                const formData = new FormData();
                formData.append("file", selectedFile);
                const uploadResult = await uploadTransferReceipt(formData);

                if (!uploadResult.success || !uploadResult.data) {
                    throw new Error(uploadResult.error || "Error al subir comprobante");
                }

                // 2. Create payment record & activate subscription/enrollment
                const result = await createBankTransferPayment({
                    courseId,
                    planId,
                    organizationId,
                    billingPeriod,
                    seatsQuantity,
                    amount,
                    currency,
                    payerName: payerName.trim(),
                    payerNote: payerNote.trim() || undefined,
                    receiptUrl: uploadResult.data.url,
                    exchangeRate: exchangeRate || undefined,
                });

                if (!result.success) {
                    throw new Error(result.error || "Error al registrar transferencia");
                }

                setStep(3);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error desconocido");
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Step 3: Success - show brief confirmation then redirect to celebration page
    if (step === 3) {
        const isCourse = !!courseId;
        const isSeats = !courseId && !planId && !!organizationId;

        // Build success page URL with product params
        const successParams = new URLSearchParams({ source: "transfer" });
        if (isCourse) {
            successParams.set("product_type", "course");
            if (courseId) successParams.set("course_id", courseId);
        } else if (isSeats) {
            successParams.set("product_type", "seats");
            if (organizationId) successParams.set("org_id", organizationId);
        } else {
            successParams.set("product_type", "subscription");
            if (organizationId) successParams.set("org_id", organizationId);
        }
        const celebrationUrl = `/checkout/success?${successParams.toString()}`;

        const handleContinue = () => {
            onSuccess?.();
            window.location.href = celebrationUrl;
        };

        return (
            <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto">
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">¡Comprobante Enviado!</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Tu pago está siendo revisado por nuestro equipo.
                        </p>

                        {/* Immediate access message */}
                        <Alert className="bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-left mb-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 dark:text-green-300 text-sm">
                                <strong>¡Ya tenés acceso!</strong> Mientras verificamos tu pago, podés comenzar a usar
                                {isCourse ? " el curso" : isSeats ? " los nuevos asientos" : " tu suscripción"} inmediatamente.
                            </AlertDescription>
                        </Alert>

                        {/* Verification info */}
                        <Alert className="bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-left">
                            <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                <p>
                                    El proceso de verificación puede tomar hasta <strong>24 horas hábiles</strong>.
                                    Te notificaremos por email cuando tu pago sea confirmado.
                                </p>
                                <p className="text-xs opacity-80">
                                    Si el pago no pudiera ser verificado, nuestro equipo se comunicará contigo
                                    para resolver la situación. En ese caso, tu acceso será pausado temporalmente
                                    hasta confirmar el pago.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>

                {/* Footer with single button */}
                <div className="border-t -mx-4 -mb-4 mt-4 p-4 bg-muted/50">
                    <Button className="w-full" onClick={handleContinue}>
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                    <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>1</span>
                    <span className={cn(step >= 1 ? "text-foreground" : "text-muted-foreground")}>
                        Datos de cuenta
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>2</span>
                    <span className={cn(step >= 2 ? "text-foreground" : "text-muted-foreground")}>
                        Subir comprobante
                    </span>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        {/* Product & Amount */}
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Producto:</span>
                                <span className={cn("font-medium", planColor)}>{productName}</span>
                            </div>
                            {/* Show subtotal if there are discounts */}
                            {(annualSavings || (couponCode && discountAmount)) && originalAmount && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span>
                                            {currency} ${currency === "ARS"
                                                ? originalAmount.toLocaleString("es-AR")
                                                : originalAmount.toFixed(2)
                                            }
                                        </span>
                                    </div>
                                </>
                            )}
                            {/* Annual savings */}
                            {annualSavings && annualSavings > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-green-500">
                                        <span>Ahorro Anual (20%)</span>
                                        <span>
                                            -{currency} ${currency === "ARS"
                                                ? annualSavings.toLocaleString("es-AR")
                                                : annualSavings.toFixed(2)
                                            }
                                        </span>
                                    </div>
                                </>
                            )}
                            {/* Coupon discount */}
                            {couponCode && discountAmount && discountAmount > 0 && (
                                <>
                                    <div className="flex justify-between text-sm text-primary">
                                        <span>Cupón ({couponCode})</span>
                                        <span>
                                            -{currency} ${currency === "ARS" && exchangeRate
                                                ? Math.round(discountAmount * exchangeRate).toLocaleString("es-AR")
                                                : discountAmount.toFixed(2)
                                            }
                                        </span>
                                    </div>
                                </>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total a transferir:</span>
                                <span className="text-primary">
                                    {currency} ${currency === "ARS"
                                        ? amount.toLocaleString("es-AR")
                                        : amount.toFixed(2)
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Bank Account Info */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                                <Landmark className="h-4 w-4" />
                                Datos bancarios:
                            </h4>
                            <div className="space-y-2">
                                {[
                                    { label: "Banco", value: BANK_INFO.bankName },
                                    { label: "Alias", value: BANK_INFO.alias },
                                    { label: "Número de Cuenta", value: BANK_INFO.accountNumber },
                                    { label: "CBU", value: BANK_INFO.cbu },
                                    { label: "CUIL", value: BANK_INFO.cuil },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 group"
                                    >
                                        <div>
                                            <span className="text-xs text-muted-foreground">{item.label}</span>
                                            <p className="text-sm font-mono">{item.value}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-50 group-hover:opacity-100"
                                            onClick={() => copyToClipboard(item.value, item.label)}
                                        >
                                            {copiedField === item.label ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        {/* File Upload */}
                        <FormGroup label="Comprobante de transferencia *">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {selectedFile ? (
                                <div className="relative">
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Comprobante"
                                            width={400}
                                            height={300}
                                            className="w-full h-48 object-contain rounded-lg border bg-muted"
                                        />
                                    ) : (
                                        <div className="w-full h-24 rounded-lg border bg-muted flex items-center justify-center gap-2">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedFile.name}
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="absolute bottom-2 right-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Cambiar archivo
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                        Click para subir comprobante
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Imagen o PDF hasta 5MB
                                    </p>
                                </div>
                            )}
                        </FormGroup>

                        {/* Payer Name */}
                        <FormGroup label="Nombre del titular de la cuenta *">
                            <Input
                                value={payerName}
                                onChange={(e) => setPayerName(e.target.value)}
                                placeholder="Juan Pérez"
                            />
                        </FormGroup>

                        {/* Payer Note */}
                        <FormGroup label="Nota adicional (opcional)">
                            <Textarea
                                value={payerNote}
                                onChange={(e) => setPayerNote(e.target.value)}
                                placeholder="Información adicional sobre tu transferencia..."
                                rows={2}
                            />
                        </FormGroup>
                    </div>
                )}
            </div>

            <FormFooter
                className="-mx-4 -mb-4 mt-6"
                isLoading={isLoading}
                submitLabel={step === 1 ? "Ya realicé la transferencia" : "Enviar comprobante"}
                cancelLabel={step === 1 ? "Cancelar" : "Volver"}
                onCancel={step === 1 ? onCancel : () => setStep(1)}
                submitDisabled={step === 2 && (!selectedFile || !payerName.trim())}
            />
        </form>
    );
}
