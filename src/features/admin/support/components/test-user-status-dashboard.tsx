"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, User, Building, CreditCard, GraduationCap, Receipt, Ticket, Crown, XCircle, CheckCircle2 } from "lucide-react";
import { getTestUserStatus, TestUserStatus } from "../actions";

function StatusBadge({ value, trueLabel = "Sí", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
    return value ? (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {trueLabel}
        </Badge>
    ) : (
        <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            {falseLabel}
        </Badge>
    );
}

function DataRow({ label, value, badge }: { label: string; value: React.ReactNode; badge?: React.ReactNode }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                {badge}
                <span className="text-sm font-medium">{value}</span>
            </div>
        </div>
    );
}

export function TestUserStatusDashboard() {
    const [status, setStatus] = useState<TestUserStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        const result = await getTestUserStatus();
        if (result.success && result.data) {
            setStatus(result.data);
        } else {
            setError(result.error || "Error desconocido");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Cargando estado...</span>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full border-destructive">
                <CardContent className="py-6 text-center text-destructive">
                    {error}
                </CardContent>
            </Card>
        );
    }

    if (!status) return null;

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Estado de Usuario de Prueba
                    </CardTitle>
                    <CardDescription>
                        {status.user?.email}
                    </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refrescar
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Usuario */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Usuario
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        <DataRow label="ID" value={<code className="text-xs">{status.user?.id?.slice(0, 8)}...</code>} />
                        <DataRow label="Nombre" value={status.user?.fullName || "Sin nombre"} />
                        <DataRow label="Email" value={status.user?.email} />
                    </CardContent>
                </Card>

                {/* Organización */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Organización
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        <DataRow label="Nombre" value={status.organization?.name || "Sin org"} />
                        <DataRow
                            label="Plan"
                            value={status.organization?.planName || "Sin plan"}
                            badge={status.organization?.planId ? (
                                <Badge variant="default" className="bg-primary/10 text-primary">Activo</Badge>
                            ) : (
                                <Badge variant="secondary">Sin plan</Badge>
                            )}
                        />
                        <DataRow
                            label="Fundador"
                            value=""
                            badge={
                                status.organization?.isFounder ? (
                                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                        <Crown className="h-3 w-3 mr-1" />
                                        Sí
                                    </Badge>
                                ) : <StatusBadge value={false} />
                            }
                        />
                    </CardContent>
                </Card>

                {/* Suscripción */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Suscripción
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {status.subscription ? (
                            <>
                                <DataRow
                                    label="Estado"
                                    value={status.subscription.status}
                                    badge={
                                        <Badge className={status.subscription.status === "active" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                            {status.subscription.status}
                                        </Badge>
                                    }
                                />
                                <DataRow label="Plan" value={status.subscription.planName} />
                                <DataRow label="Período" value={status.subscription.billingPeriod} />
                            </>
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                Sin suscripción activa
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enrollments */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Cursos Inscriptos
                            <Badge variant="secondary">{status.enrollments.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {status.enrollments.length > 0 ? (
                            status.enrollments.map(e => (
                                <DataRow
                                    key={e.id}
                                    label={e.courseName}
                                    value=""
                                    badge={<Badge variant="outline">{e.status}</Badge>}
                                />
                            ))
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                Sin inscripciones
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagos */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Pagos Recientes
                            <Badge variant="secondary">{status.payments.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {status.payments.length > 0 ? (
                            status.payments.slice(0, 3).map(p => (
                                <DataRow
                                    key={p.id}
                                    label={`${p.currency} ${p.amount}`}
                                    value={p.productType}
                                    badge={
                                        <Badge className={p.status === "approved" ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}>
                                            {p.status}
                                        </Badge>
                                    }
                                />
                            ))
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                Sin pagos
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cupones */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Ticket className="h-4 w-4" />
                            Cupones Usados
                            <Badge variant="secondary">{status.couponRedemptions.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {status.couponRedemptions.length > 0 ? (
                            status.couponRedemptions.map(c => (
                                <DataRow
                                    key={c.id}
                                    label={c.couponCode}
                                    value={new Date(c.redeemedAt).toLocaleDateString("es")}
                                />
                            ))
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                Sin cupones usados
                            </div>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}
