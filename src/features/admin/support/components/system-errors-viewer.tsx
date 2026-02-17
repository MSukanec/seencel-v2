"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Bug,
} from "lucide-react";
import { getEnrichedSystemErrors, type EnrichedSystemError } from "../monitoring-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// =============================================================================
// Helpers
// =============================================================================

/** Traduce el severity slug a label legible */
function severityLabel(severity: string): string {
    switch (severity) {
        case 'critical': return 'Crítico';
        case 'warning': return 'Advertencia';
        case 'info': return 'Info';
        case 'high': return 'Alto';
        default: return severity;
    }
}

/** Variante visual del badge según severity */
function SeverityBadge({ severity }: { severity: string }) {
    switch (severity) {
        case 'critical':
            return <Badge variant="destructive">{severityLabel(severity)}</Badge>;
        case 'warning':
        case 'high':
            return (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">
                    {severityLabel(severity)}
                </Badge>
            );
        default:
            return <Badge variant="outline">{severityLabel(severity)}</Badge>;
    }
}

/** Construye el "path" legible del error: function_name > step: xxx */
function buildErrorPath(err: EnrichedSystemError): string {
    let path = err.functionName;
    if (err.errorStep) {
        path += ` › step: ${err.errorStep}`;
    }
    return path;
}

/** Determina si es error de suscripción (tiene org) o de curso (solo user) */
function isSubscriptionError(err: EnrichedSystemError): boolean {
    return err.functionName.includes('subscription') || err.domain === 'subscription';
}

/** Construye la línea de contexto humano: "Org - Usuario" o solo "Usuario" */
function buildHumanContext(err: EnrichedSystemError): string | null {
    const parts: string[] = [];

    // Si es suscripción: ORGANIZACION - USUARIO
    if (isSubscriptionError(err) && err.orgName) {
        let orgPart = err.orgName;
        if (err.planName) orgPart += ` (${err.planName})`;
        parts.push(orgPart);
    }

    // Usuario
    if (err.userName || err.userEmail) {
        parts.push(err.userName || err.userEmail || '');
    }

    return parts.length > 0 ? parts.join(' — ') : null;
}

/** Construye la línea de pago: "$148 ARS via mercadopago" */
function buildPaymentInfo(err: EnrichedSystemError): string | null {
    if (err.paymentAmount == null) return null;
    let info = `$${err.paymentAmount} ${err.paymentCurrency || ''}`.trim();
    if (err.paymentProvider) {
        info += ` via ${err.paymentProvider}`;
    }
    return info;
}

/** Determina el link de "Ver perfil" — user o org */
function getProfileLink(err: EnrichedSystemError): string | null {
    if (typeof err.context?.user_id === 'string') {
        return `/admin/directory/${err.context.user_id}`;
    }
    if (typeof err.context?.organization_id === 'string') {
        return `/admin/directory?org=${err.context.organization_id}`;
    }
    return null;
}

// =============================================================================
// Main Component
// =============================================================================

export function SystemErrorsViewer() {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<EnrichedSystemError[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [openId, setOpenId] = useState<string | null>(null);

    const fetchErrors = async () => {
        setLoading(true);
        setError(null);
        const result = await getEnrichedSystemErrors(48);
        if (result.success && result.errors) {
            setErrors(result.errors);
        } else {
            setError(result.error || "Error desconocido");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchErrors();
    }, []);

    const handleToggle = (id: string) => {
        setOpenId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-destructive" />
                        <h2 className="text-lg font-semibold">Errores del Sistema</h2>
                        {!loading && errors.length > 0 && (
                            <Badge variant="destructive" className="ml-1">
                                {errors.length}
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Errores capturados en funciones SQL (últimas 48h)
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Content */}
            <div>
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && errors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <CheckCircle2 className="h-10 w-10 text-green-500/60" />
                        <p className="text-sm">Sin errores en las últimas 48 horas</p>
                    </div>
                )}

                {!loading && errors.length > 0 && (
                    <div className="space-y-2">
                        {errors.map((err) => (
                            <ErrorAccordionItem
                                key={err.id}
                                error={err}
                                isOpen={openId === err.id}
                                onToggle={() => handleToggle(err.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// Error Accordion Item
// =============================================================================

function ErrorAccordionItem({
    error: err,
    isOpen,
    onToggle,
}: {
    error: EnrichedSystemError;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const profileLink = getProfileLink(err);
    const humanContext = buildHumanContext(err);
    const paymentInfo = buildPaymentInfo(err);

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <div className="border rounded-lg bg-card overflow-hidden">
                {/* Trigger — siempre visible */}
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-3">
                            {/* Left side */}
                            <div className="flex-1 min-w-0 space-y-1">
                                {/* Row 1: Badge + error path */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <SeverityBadge severity={err.severity} />
                                    <span className="text-sm text-muted-foreground truncate">
                                        {buildErrorPath(err)}
                                    </span>
                                </div>

                                {/* Row 2: Error message (foreground / blanco) */}
                                <p className="text-sm font-medium text-foreground leading-snug">
                                    {err.message}
                                </p>

                                {/* Row 3: Contexto humano + pago */}
                                {(humanContext || paymentInfo) && (
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground pt-0.5">
                                        {humanContext && (
                                            <span>{humanContext}</span>
                                        )}
                                        {humanContext && paymentInfo && (
                                            <span className="text-muted-foreground/40">·</span>
                                        )}
                                        {paymentInfo && (
                                            <span>{paymentInfo}</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right side */}
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                {/* Timestamp */}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(err.createdAt), { addSuffix: true, locale: es })}
                                </span>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1">
                                    {profileLink && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 text-xs h-6 px-2"
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <a href={profileLink} target="_blank">
                                                <ExternalLink className="h-3 w-3" />
                                                Ver perfil
                                            </a>
                                        </Button>
                                    )}

                                    <ChevronDown
                                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </button>
                </CollapsibleTrigger>

                {/* Contenido expandido — contexto técnico */}
                <CollapsibleContent>
                    <div className="border-t px-4 py-3 bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                            Contexto técnico ({Object.keys(err.context || {}).length} campos)
                        </p>
                        <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto font-mono leading-relaxed text-foreground/80">
                            {JSON.stringify(err.context, null, 2)}
                        </pre>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
