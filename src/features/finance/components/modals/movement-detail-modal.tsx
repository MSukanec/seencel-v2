"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ViewFormFooter } from "@/components/shared/forms/view-form-footer";
import { DetailField, DetailGrid, DetailSection } from "@/components/shared/forms/detail-field";
import { AttachmentList, AttachmentItem } from "@/components/shared/attachments/attachment-list";
import { useCurrencyOptional } from "@/providers/currency-context";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { cn } from "@/lib/utils";
import { getMovementAttachments, getAttachmentUrl } from "@/features/finance/actions";
import {
    CalendarDays,
    Wallet,
    Building2,
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    User
} from "lucide-react";

interface MovementDetailModalProps {
    movement: any;
    walletName?: string;
    projectName?: string;
    onEdit?: () => void;
    onClose: () => void;
}

/**
 * Read-only modal content for viewing financial movement details
 */
export function MovementDetailModal({
    movement,
    walletName,
    projectName,
    onEdit,
    onClose
}: MovementDetailModalProps) {
    const currencyContext = useCurrencyOptional();
    const decimalPlaces = currencyContext?.decimalPlaces ?? 2;

    // Attachments state
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);

    // Fetch attachments on mount if has_attachments is true
    useEffect(() => {
        if (movement.has_attachments) {
            setLoadingAttachments(true);
            getMovementAttachments(movement.id, movement.movement_type)
                .then(({ attachments: data }) => setAttachments(data))
                .finally(() => setLoadingAttachments(false));
        }
    }, [movement.id, movement.movement_type, movement.has_attachments]);

    const handleGetUrl = async (bucket: string, filePath: string): Promise<string | null> => {
        const { url } = await getAttachmentUrl(bucket, filePath);
        return url;
    };

    const formatCurrency = (amount: number, currencyCode?: string) => {
        return formatCurrencyUtil(
            amount,
            currencyCode || currencyContext?.primaryCurrency?.code || 'ARS',
            'es-AR',
            decimalPlaces
        );
    };

    const getMovementTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'client_payment': 'Pago de Cliente',
            'material_payment': 'Pago de Material',
            'personnel_payment': 'Pago de Personal',
            'partner_contribution': 'Aporte de Socio',
            'partner_withdrawal': 'Retiro de Socio',
            'general_cost_payment': 'Gastos Generales',
            'wallet_transfer': 'Transferencia',
            'currency_exchange': 'Cambio de Moneda',
        };
        return labels[type] || type;
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            confirmed: { label: "Confirmado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            completed: { label: "Completado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            paid: { label: "Pagado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            pending: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            rejected: { label: "Rechazado", className: "bg-destructive/10 text-destructive border-destructive/20" },
            cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" },
            void: { label: "Anulado", className: "bg-muted text-muted-foreground border-muted" },
        };
        const config = configs[status] || { label: status, className: "" };
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const isPositive = Number(movement.amount_sign ?? 1) > 0;
    const amount = Number(movement.amount);
    const exchangeRate = Number(movement.exchange_rate);

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6">
                {/* Header Section - Type & Status */}
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-lg",
                            isPositive ? "bg-amount-positive/10" : "bg-amount-negative/10"
                        )}>
                            {isPositive ? (
                                <ArrowUpCircle className="h-5 w-5 text-amount-positive" />
                            ) : (
                                <ArrowDownCircle className="h-5 w-5 text-amount-negative" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-lg">
                                {getMovementTypeLabel(movement.movement_type)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {movement.entity_name || "-"}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge(movement.status)}
                </div>

                {/* Amount Section */}
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Monto
                    </p>
                    <p className={cn(
                        "text-3xl font-bold font-mono",
                        isPositive ? "text-amount-positive" : "text-amount-negative"
                    )}>
                        {isPositive ? "+" : "-"}{formatCurrency(Math.abs(amount), movement.currency_code)}
                    </p>
                    {exchangeRate && exchangeRate !== 1 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Cotización: {exchangeRate.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
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
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(movement.payment_date), "dd 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            }
                        />
                        <DetailField
                            label="Billetera"
                            value={
                                <span className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    {walletName || "-"}
                                </span>
                            }
                        />
                        {projectName && (
                            <DetailField
                                label="Proyecto"
                                value={
                                    <span className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {projectName}
                                    </span>
                                }
                            />
                        )}
                        {movement.reference && (
                            <DetailField
                                label="Referencia"
                                value={movement.reference}
                            />
                        )}
                    </DetailGrid>
                </DetailSection>

                {/* Description */}
                {movement.description && (
                    <DetailSection title="Descripción">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-foreground">{movement.description}</p>
                        </div>
                    </DetailSection>
                )}

                {/* Creator Info */}
                {movement.creator_full_name && (
                    <DetailSection title="Creado por">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                {movement.creator_avatar_url ? (
                                    <img
                                        src={movement.creator_avatar_url}
                                        alt={movement.creator_full_name}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{movement.creator_full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(movement.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                </p>
                            </div>
                        </div>
                    </DetailSection>
                )}

                {/* Attachments Section */}
                {(movement.has_attachments || attachments.length > 0) && (
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
                onClose={onClose}
                showEdit={!!onEdit}
            />
        </div>
    );
}
