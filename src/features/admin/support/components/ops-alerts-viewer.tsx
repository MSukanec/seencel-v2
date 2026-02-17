"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    Eye,
    ExternalLink,
    Loader2,
    Mail,
    MessageCircle,
    RefreshCw,
    ShieldAlert,
    User,
    Wrench,
} from "lucide-react";
import {
    getOpsAlerts,
    getOpsRepairActions,
    executeOpsRepair,
    resolveOpsAlert,
    ackOpsAlert,
    type OpsAlert,
    type OpsRepairAction,
} from "../monitoring-actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusFilter = 'all' | 'open' | 'ack' | 'resolved';

export function OpsAlertsViewer() {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<OpsAlert[]>([]);
    const [repairActions, setRepairActions] = useState<OpsRepairAction[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        alertId: string;
        actionId: string;
        actionLabel: string;
        isDangerous: boolean;
    } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [alertsResult, actionsResult] = await Promise.all([
            getOpsAlerts(statusFilter),
            getOpsRepairActions(),
        ]);
        if (alertsResult.success && alertsResult.alerts) {
            setAlerts(alertsResult.alerts);
        }
        if (actionsResult.success && actionsResult.actions) {
            setRepairActions(actionsResult.actions);
        }
        setLoading(false);
    }, [statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getActionsForAlert = (alertType: string) => {
        return repairActions.filter((a) => a.alertType === alertType);
    };

    const handleRepair = async (alertId: string, actionId: string) => {
        setActionLoading(`${alertId}-${actionId}`);
        const result = await executeOpsRepair(alertId, actionId);
        if (result.success) {
            toast.success("Reparación ejecutada correctamente");
            await fetchData();
        } else {
            toast.error("Error al ejecutar reparación", { description: result.error });
        }
        setActionLoading(null);
        setConfirmDialog(null);
    };

    const handleResolve = async (alertId: string) => {
        setActionLoading(`${alertId}-resolve`);
        const result = await resolveOpsAlert(alertId);
        if (result.success) {
            toast.success("Alerta resuelta");
            await fetchData();
        } else {
            toast.error("Error", { description: result.error });
        }
        setActionLoading(null);
    };

    const handleAck = async (alertId: string) => {
        setActionLoading(`${alertId}-ack`);
        const result = await ackOpsAlert(alertId);
        if (result.success) {
            toast.success("Alerta acknowledgeada");
            await fetchData();
        } else {
            toast.error("Error", { description: result.error });
        }
        setActionLoading(null);
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Crítico</Badge>;
            case 'high':
                return <Badge className="gap-1 bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"><AlertTriangle className="h-3 w-3" />Alto</Badge>;
            default:
                return <Badge variant="secondary" className="gap-1">{severity}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500"><Clock className="h-3 w-3" />Abierta</Badge>;
            case 'ack':
                return <Badge variant="outline" className="gap-1 border-blue-500/30 text-blue-500"><Eye className="h-3 w-3" />Acknowledgeada</Badge>;
            case 'resolved':
                return <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-500"><CheckCircle2 className="h-3 w-3" />Resuelta</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
        { value: 'open', label: 'Abiertas', count: alerts.length },
        { value: 'ack', label: 'Acknowledgeadas', count: 0 },
        { value: 'resolved', label: 'Resueltas', count: 0 },
        { value: 'all', label: 'Todas', count: 0 },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Header con filtros */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === tab.value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Actualizar
                </Button>
            </div>

            {/* Content */}
            <div>
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!loading && alerts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <CheckCircle2 className="h-10 w-10 text-emerald-500/60" />
                        <p className="text-sm">
                            {statusFilter === 'open' ? 'No hay alertas abiertas' : 'Sin alertas con este filtro'}
                        </p>
                    </div>
                )}

                {!loading && alerts.length > 0 && (
                    <div className="space-y-3">
                        {alerts.map((alert) => {
                            const availableActions = getActionsForAlert(alert.alertType);
                            // Lo genérico siempre disponible
                            const alwaysActions = repairActions.filter(a => a.id === 'force_resolve_alert');

                            return (
                                <div
                                    key={alert.id}
                                    className={`border rounded-xl p-5 space-y-3 transition-colors ${alert.status === 'resolved'
                                        ? 'bg-muted/20 opacity-60'
                                        : alert.severity === 'critical'
                                            ? 'bg-red-500/5 border-red-500/20'
                                            : 'bg-muted/30 hover:bg-muted/50'
                                        }`}
                                >
                                    {/* Row 1: Badges + Time */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getSeverityBadge(alert.severity)}
                                            {getStatusBadge(alert.status)}
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                                {alert.alertType}
                                            </code>
                                        </div>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>

                                    {/* Row 2: Title + Description */}
                                    <div>
                                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                                        {alert.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                                        )}
                                    </div>

                                    {/* Row 3: Human Context */}
                                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                                        {(alert.userName || alert.userEmail) && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <User className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground">
                                                    {alert.userName || 'Sin nombre'}
                                                </span>
                                                {alert.userEmail && (
                                                    <span className="text-xs">({alert.userEmail})</span>
                                                )}
                                            </div>
                                        )}
                                        {alert.orgName && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground">{alert.orgName}</span>
                                                {alert.orgPlanName && (
                                                    <Badge variant="outline" className="text-[10px] h-4">{alert.orgPlanName}</Badge>
                                                )}
                                            </div>
                                        )}
                                        {alert.paymentAmount != null && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <CreditCard className="h-3.5 w-3.5" />
                                                <span className="font-medium text-foreground">
                                                    ${alert.paymentAmount} {alert.paymentCurrency}
                                                </span>
                                                {alert.provider && (
                                                    <span className="text-xs">via {alert.provider}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Row 4: Evidence (collapsible) */}
                                    {alert.evidence && Object.keys(alert.evidence).length > 0 && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                                Ver evidencia ({Object.keys(alert.evidence).length} campos)
                                            </summary>
                                            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                                                {JSON.stringify(alert.evidence, null, 2)}
                                            </pre>
                                        </details>
                                    )}

                                    {/* Row 5: Resolution info */}
                                    {alert.resolvedAt && (
                                        <div className="flex items-center gap-2 text-xs text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span>
                                                Resuelto por {alert.resolvedByName || 'sistema'}{' '}
                                                {formatDistanceToNow(new Date(alert.resolvedAt), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Row 6: Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-dashed flex-wrap">
                                        {/* Repair actions — solo si no está resuelto */}
                                        {alert.status !== 'resolved' && (
                                            <>
                                                {availableActions.map((action) => (
                                                    <Button
                                                        key={action.id}
                                                        variant={action.isDangerous ? "destructive" : "outline"}
                                                        size="sm"
                                                        className="gap-1.5 text-xs h-7"
                                                        disabled={actionLoading === `${alert.id}-${action.id}`}
                                                        onClick={() => {
                                                            if (action.requiresConfirmation) {
                                                                setConfirmDialog({
                                                                    alertId: alert.id,
                                                                    actionId: action.id,
                                                                    actionLabel: action.label,
                                                                    isDangerous: action.isDangerous,
                                                                });
                                                            } else {
                                                                handleRepair(alert.id, action.id);
                                                            }
                                                        }}
                                                    >
                                                        {actionLoading === `${alert.id}-${action.id}`
                                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                                            : <Wrench className="h-3 w-3" />
                                                        }
                                                        {action.label}
                                                    </Button>
                                                ))}

                                                {/* Acknowledge */}
                                                {alert.status === 'open' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1.5 text-xs h-7"
                                                        disabled={actionLoading === `${alert.id}-ack`}
                                                        onClick={() => handleAck(alert.id)}
                                                    >
                                                        {actionLoading === `${alert.id}-ack`
                                                            ? <Loader2 className="h-3 w-3 animate-spin" />
                                                            : <Eye className="h-3 w-3" />
                                                        }
                                                        Acknowledger
                                                    </Button>
                                                )}

                                                {/* Resolve */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-xs h-7 text-emerald-600 hover:text-emerald-700"
                                                    disabled={actionLoading === `${alert.id}-resolve`}
                                                    onClick={() => handleResolve(alert.id)}
                                                >
                                                    {actionLoading === `${alert.id}-resolve`
                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                        : <Check className="h-3 w-3" />
                                                    }
                                                    Resolver
                                                </Button>

                                                {/* Divider */}
                                                <div className="w-px h-4 bg-border" />
                                            </>
                                        )}

                                        {/* Contact buttons — SIEMPRE visibles si hay email */}
                                        {alert.userEmail && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1.5 text-xs h-7"
                                                    asChild
                                                >
                                                    <a href={`mailto:${alert.userEmail}?subject=Soporte Seencel - ${alert.title}&body=Hola ${alert.userName || ''},%0D%0A%0D%0AEstamos contactándote desde el equipo de Seencel.`}>
                                                        <Mail className="h-3 w-3" />
                                                        Email
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-xs h-7"
                                                    onClick={() => copyToClipboard(alert.userEmail!)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                    Copiar email
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1.5 text-xs h-7"
                                                    asChild
                                                >
                                                    <a href="/admin/support" target="_blank">
                                                        <MessageCircle className="h-3 w-3" />
                                                        Chat Soporte
                                                    </a>
                                                </Button>
                                            </>
                                        )}

                                        {/* Ver perfil */}
                                        {alert.userId && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="gap-1.5 text-xs h-7"
                                                asChild
                                            >
                                                <a href={`/admin/directory/${alert.userId}`} target="_blank">
                                                    <ExternalLink className="h-3 w-3" />
                                                    Ver perfil
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog?.isDangerous ? '⚠️ Acción peligrosa' : 'Confirmar acción'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Ejecutar &quot;{confirmDialog?.actionLabel}&quot;? Esta acción modificará datos en la base de datos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={confirmDialog?.isDangerous ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                            onClick={() => {
                                if (confirmDialog) {
                                    handleRepair(confirmDialog.alertId, confirmDialog.actionId);
                                }
                            }}
                        >
                            Ejecutar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
