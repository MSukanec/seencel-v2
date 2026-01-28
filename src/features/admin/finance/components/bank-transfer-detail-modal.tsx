"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ViewFormFooter } from "@/components/shared/forms/view-form-footer";
import { DetailField, DetailGrid, DetailSection } from "@/components/shared/forms/detail-field";
import { cn } from "@/lib/utils";
import type { AdminBankTransfer } from "../queries";
import {
    CalendarDays,
    Landmark,
    BookOpen,
    User,
    FileText,
    ExternalLink,
    Receipt
} from "lucide-react";

interface BankTransferDetailModalProps {
    transfer: AdminBankTransfer;
    onEdit?: () => void;
    onClose: () => void;
}

/**
 * Read-only modal content for viewing bank transfer details
 * Follows the MovementDetailModal pattern
 */
export function BankTransferDetailModal({
    transfer,
    onEdit,
    onClose
}: BankTransferDetailModalProps) {

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            approved: { label: "Aprobado", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            pending: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            rejected: { label: "Rechazado", className: "bg-destructive/10 text-destructive border-destructive/20" },
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
                        <div className="p-2.5 rounded-lg bg-amber-500/10">
                            <Landmark className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg">
                                Transferencia Bancaria
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {transfer.user?.full_name || transfer.user?.email || "—"}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge(transfer.status)}
                </div>

                {/* Amount Section */}
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Monto
                    </p>
                    <p className="text-3xl font-bold font-mono text-amount-positive">
                        +{formatCurrency(transfer.amount, transfer.currency)}
                    </p>
                    {transfer.discount_percent && transfer.discount_percent > 0 && (
                        <p className="text-sm text-emerald-500 mt-1">
                            -{transfer.discount_percent}% descuento aplicado
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
                                    {format(new Date(transfer.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            }
                        />
                        {transfer.course && (
                            <DetailField
                                label="Curso"
                                value={
                                    <span className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        {transfer.course.title}
                                    </span>
                                }
                            />
                        )}
                        {transfer.payer_name && (
                            <DetailField
                                label="Nombre del pagador"
                                value={
                                    <span className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {transfer.payer_name}
                                    </span>
                                }
                            />
                        )}
                    </DetailGrid>
                </DetailSection>

                {/* Note from user */}
                {transfer.payer_note && (
                    <DetailSection title="Nota del usuario">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-foreground">{transfer.payer_note}</p>
                        </div>
                    </DetailSection>
                )}

                {/* Review reason (if rejected or has notes) */}
                {transfer.review_reason && (
                    <DetailSection title="Motivo de revisión">
                        <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-foreground">{transfer.review_reason}</p>
                        </div>
                    </DetailSection>
                )}

                {/* Receipt link */}
                {transfer.receipt_url && (
                    <DetailSection title="Comprobante">
                        <a
                            href={transfer.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <Receipt className="h-4 w-4" />
                            Ver comprobante
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </DetailSection>
                )}

                {/* User Info */}
                {transfer.user && (
                    <DetailSection title="Usuario">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                {transfer.user.avatar_url ? (
                                    <img
                                        src={transfer.user.avatar_url}
                                        alt={transfer.user.full_name || ""}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{transfer.user.full_name || "Sin nombre"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {transfer.user.email}
                                </p>
                            </div>
                        </div>
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
