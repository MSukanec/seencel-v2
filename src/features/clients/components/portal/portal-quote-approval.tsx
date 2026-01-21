"use client";

import { useState, useRef, useCallback } from "react";
import { SignaturePad, SignatureData, SignaturePadRef } from "@/components/ui/signature-pad";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormGroup } from "@/components/ui/form-group";
import { FormFooter } from "@/components/shared/form-footer";
import { toast } from "sonner";
import { Check, X, CopyPlus } from "lucide-react";
import { approveQuote, rejectQuote } from "./portal-quote-actions";

interface Quote {
    id: string;
    name: string;
    status: string;
    total_with_tax: number;
    currency_symbol?: string;
}

interface PortalQuoteApprovalProps {
    quote: Quote;
    projectId: string;
    clientId: string;
    onSuccess: () => void;
}

export function PortalQuoteApproval({ quote, projectId, clientId, onSuccess }: PortalQuoteApprovalProps) {
    const [approvalOpen, setApprovalOpen] = useState(false);
    const [rejectionOpen, setRejectionOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignatureValid, setIsSignatureValid] = useState(false);
    const signaturePadRef = useRef<SignaturePadRef>(null);

    const formatAmount = (amount: number) => {
        return `${quote.currency_symbol || '$'} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleValidityChange = useCallback((valid: boolean) => {
        setIsSignatureValid(valid);
    }, []);

    const handleApprove = async () => {
        const signatureData = signaturePadRef.current?.getSignatureData();
        if (!signatureData) {
            toast.error("Por favor completa la firma");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Procesando aprobación...");

        try {
            const result = await approveQuote({
                quoteId: quote.id,
                projectId,
                clientId,
                signatureData,
            });

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("¡Presupuesto aprobado exitosamente!", { id: toastId });
                setApprovalOpen(false);
                onSuccess();
            }
        } catch (error: any) {
            toast.error("Error al aprobar: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Por favor indica el motivo del rechazo");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading("Procesando rechazo...");

        try {
            const result = await rejectQuote({
                quoteId: quote.id,
                projectId,
                clientId,
                reason: rejectionReason,
            });

            if (result.error) {
                toast.error(result.error, { id: toastId });
            } else {
                toast.success("Presupuesto rechazado", { id: toastId });
                setRejectionOpen(false);
                setRejectionReason("");
                onSuccess();
            }
        } catch (error: any) {
            toast.error("Error al rechazar: " + error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    // Only show for quotes pending approval
    if (quote.status !== "sent") {
        return null;
    }

    return (
        <>
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700/50">
                <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setRejectionOpen(true)}
                >
                    <X className="h-4 w-4 mr-2" />
                    Rechazar
                </Button>
                <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setApprovalOpen(true)}
                >
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar
                </Button>
            </div>

            {/* Approval Modal */}
            <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
                <DialogContent
                    showCloseButton={false}
                    fullscreenMobile
                    className="sm:w-[600px] p-0"
                >
                    {/* Fixed Header - matches modal-provider style */}
                    <DialogHeader className="flex-none p-3 border-b space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <CopyPlus className="h-5 w-5 text-primary" />
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-sm font-medium text-foreground leading-snug">
                                        Aprobar Presupuesto
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground leading-normal">
                                        Estás por aprobar &quot;{quote.name}&quot; por {formatAmount(quote.total_with_tax)}
                                    </DialogDescription>
                                </div>
                            </div>
                            <button
                                onClick={() => setApprovalOpen(false)}
                                aria-label="Cerrar modal"
                                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                    </DialogHeader>

                    {/* Body with padding */}
                    <div className="flex-1 flex flex-col relative w-full min-h-0 overflow-y-auto p-4">
                        <SignaturePad
                            ref={signaturePadRef}
                            height={150}
                            disclaimer="Al firmar, confirmo que he revisado este presupuesto y acepto los términos y condiciones establecidos."
                            onValidityChange={handleValidityChange}
                        />
                    </div>

                    {/* Footer */}
                    <FormFooter
                        onCancel={() => setApprovalOpen(false)}
                        onSubmit={handleApprove}
                        isLoading={isLoading}
                        submitLabel="Confirmar Aprobación"
                        submitDisabled={!isSignatureValid}
                        variant="default"
                        isForm={false}
                    />
                </DialogContent>
            </Dialog>

            {/* Rejection Modal */}
            <Dialog open={rejectionOpen} onOpenChange={setRejectionOpen}>
                <DialogContent
                    showCloseButton={false}
                    fullscreenMobile
                    className="sm:w-[500px] p-0"
                >
                    {/* Fixed Header */}
                    <DialogHeader className="flex-none p-3 border-b space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <CopyPlus className="h-5 w-5 text-primary" />
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-sm font-medium text-foreground leading-snug">
                                        Rechazar Presupuesto
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground leading-normal">
                                        Por favor indica el motivo del rechazo para &quot;{quote.name}&quot;
                                    </DialogDescription>
                                </div>
                            </div>
                            <button
                                onClick={() => setRejectionOpen(false)}
                                aria-label="Cerrar modal"
                                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                    </DialogHeader>

                    {/* Body */}
                    <div className="flex-1 flex flex-col relative w-full min-h-0 overflow-y-auto p-4">
                        <FormGroup label="Motivo del rechazo" htmlFor="rejection-reason" required>
                            <Textarea
                                id="rejection-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Describe el motivo del rechazo..."
                                rows={4}
                            />
                        </FormGroup>
                    </div>

                    {/* Footer */}
                    <FormFooter
                        onCancel={() => setRejectionOpen(false)}
                        onSubmit={handleReject}
                        isLoading={isLoading}
                        submitLabel="Confirmar Rechazo"
                        submitDisabled={!rejectionReason.trim()}
                        variant="default"
                        isForm={false}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
