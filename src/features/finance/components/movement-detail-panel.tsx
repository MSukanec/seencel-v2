"use client";

/**
 * Movement Detail Panel
 * 
 * Read-only panel for viewing financial movement details.
 * Adapted from MovementDetailModal to work with the Panel system.
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { DetailField, DetailGrid, DetailSection } from "@/components/shared/forms/detail-field";
import { AttachmentList, AttachmentItem } from "@/components/shared/attachments/attachment-list";
import { useMoney } from "@/hooks/use-money";
import { cn } from "@/lib/utils";
import { parseDateFromDB } from "@/lib/timezone-data";
import { getMovementAttachments, getAttachmentUrl } from "@/features/finance/actions";
import { usePanel } from "@/stores/panel-store";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_STATUS_CONFIG } from "../tables/movements-columns";
import {
    CalendarDays,
    Wallet,
    Building2,
    FileText,
    ArrowUpCircle,
    ArrowDownCircle,
    User,
    Eye,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────

interface MovementDetailPanelProps {
    movement: any;
    walletName?: string;
    projectName?: string;
    onEdit?: () => void;
}

// ─── Variant classes (reuse from status-column) ──────────

const STATUS_CLASS_MAP = new Map(
    MOVEMENT_STATUS_CONFIG.map(opt => [opt.value, {
        label: opt.label,
        className: opt.variant === "positive"
            ? "bg-amount-positive/10 text-amount-positive border-amount-positive/20"
            : opt.variant === "negative"
                ? "bg-amount-negative/10 text-amount-negative border-amount-negative/20"
                : opt.variant === "warning"
                    ? "bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20"
                    : "bg-muted text-muted-foreground border-border",
    }])
);

// ─── Component ───────────────────────────────────────────

export function MovementDetailPanel({
    movement,
    walletName,
    projectName,
    onEdit,
}: MovementDetailPanelProps) {
    const money = useMoney();
    const { setPanelMeta, closePanel } = usePanel();

    // Set panel meta on mount
    useEffect(() => {
        setPanelMeta({
            title: "Detalle del Movimiento",
            description: "Información completa del movimiento financiero.",
            icon: Eye,
            footer: {
                actions: [
                    ...(onEdit ? [{
                        label: "Editar",
                        onClick: () => { closePanel(); onEdit(); },
                        variant: "default" as const,
                    }] : []),
                    {
                        label: "Cerrar",
                        onClick: () => { closePanel(); },
                        variant: "outline" as const,
                    },
                ],
            },
        });
    }, [setPanelMeta, onEdit, closePanel]);

    // Attachments state
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [loadingAttachments, setLoadingAttachments] = useState(false);

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

    const isPositive = Number(movement.amount_sign ?? 1) > 0;
    const amount = Number(movement.amount);
    const exchangeRate = Number(movement.exchange_rate);
    const typeLabel = MOVEMENT_TYPE_LABELS[movement.movement_type] || movement.movement_type;
    const statusConfig = STATUS_CLASS_MAP.get(movement.status);

    return (
        <div className="flex flex-col h-full min-h-0">
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
                            <p className="font-semibold text-lg">{typeLabel}</p>
                            <p className="text-sm text-muted-foreground">
                                {movement.entity_name || "-"}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className={statusConfig?.className || ""}>
                        {statusConfig?.label || movement.status}
                    </Badge>
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
                        {isPositive ? "+" : "-"}{money.format(Math.abs(amount), movement.currency_code)}
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
                                    {format(parseDateFromDB(movement.payment_date) || new Date(), "dd 'de' MMMM, yyyy", { locale: es })}
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
        </div>
    );
}
