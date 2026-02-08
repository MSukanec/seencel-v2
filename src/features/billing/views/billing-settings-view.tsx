"use client";

import { OrganizationSubscription, OrganizationBillingCycle } from "@/types/organization";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContentLayout } from "@/components/layout";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PlanCardsGrid } from "@/features/billing/components/plan-cards-grid";
import type { Plan } from "@/actions/plans";
import type { PlanPurchaseFlags } from "@/features/billing/components/plan-card";
import { getPlanDisplayName } from "@/lib/plan-utils";

interface BillingSettingsViewProps {
    subscription?: OrganizationSubscription | null;
    billingCycles?: OrganizationBillingCycle[];
    organizationId?: string;
    plans: Plan[];
    purchaseFlags: PlanPurchaseFlags;
    isAdmin: boolean;
    currentPlanId?: string | null;
}

export function BillingSettingsView({ subscription, billingCycles = [], organizationId, plans, purchaseFlags, isAdmin, currentPlanId }: BillingSettingsViewProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Badge de método de pago - simple
    const getProviderBadge = (provider: string | undefined | null) => {
        const p = provider?.toLowerCase() || '';
        if (p.includes('paypal')) return <Badge variant="outline">PayPal</Badge>;
        if (p.includes('mercadopago') || p.includes('mercado')) return <Badge variant="outline">MercadoPago</Badge>;
        if (p.includes('bank') || p.includes('transfer') || !provider) return <Badge variant="outline">Transferencia</Badge>;
        return <Badge variant="outline">{provider}</Badge>;
    };

    // Helper para obtener provider del payment (puede venir como array o objeto)
    const getProvider = (payment: { provider: string }[] | { provider: string } | null | undefined): string | undefined => {
        if (!payment) return undefined;
        if (Array.isArray(payment)) return payment[0]?.provider;
        return payment.provider;
    };

    // Extraer nombre del plan del ciclo (puede ser array u objeto por join Supabase)
    const getPlanName = (plan: { name: string }[] | { name: string } | null | undefined): string => {
        if (!plan) return '';
        const name = Array.isArray(plan) ? plan[0]?.name : plan.name;
        return getPlanDisplayName(name || '');
    };

    const displayName = getPlanDisplayName(subscription?.plan?.name || '');
    const isFree = displayName === 'Gratis' || subscription?.amount === 0;

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                {/* Plan Cards Grid - Reusable component */}
                <PlanCardsGrid
                    plans={plans}
                    currentPlanId={currentPlanId}
                    organizationId={organizationId}
                    isAdmin={isAdmin}
                    purchaseFlags={purchaseFlags}
                    isDashboard={true}
                />

                {/* Subscription info */}
                {subscription && !isFree && (
                    <div className="text-sm text-muted-foreground">
                        {subscription.billing_period === 'one-time' ? (
                            <p>Tu plan <strong>{displayName}</strong> está activo hasta el {format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: es })}.</p>
                        ) : (
                            <p>Tu plan <strong>{displayName}</strong> finalizará el {format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: es })}.</p>
                        )}
                    </div>
                )}

                {/* Billing History */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Historial de Pagos</h3>
                            <p className="text-sm text-muted-foreground">Descarga tus facturas y revisa los ciclos anteriores.</p>
                        </div>
                    </div>

                    <Card className="border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Inicio</TableHead>
                                    <TableHead>Fin</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Método</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billingCycles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No hay facturas disponibles
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    billingCycles.map((cycle) => {
                                        const planName = getPlanName(cycle.plan);
                                        const conceptLabel = cycle.product_type === 'upgrade'
                                            ? `Upgrade a ${planName}`
                                            : cycle.product_type === 'seat_purchase'
                                                ? 'Compra de asientos'
                                                : `Suscripción ${planName}`;

                                        return (
                                            <TableRow key={cycle.id}>
                                                <TableCell className="font-medium">
                                                    {format(new Date(cycle.created_at), "d MMM yyyy", { locale: es })}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{conceptLabel}</span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {cycle.started_at
                                                        ? format(new Date(cycle.started_at), "d MMM yyyy", { locale: es })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {cycle.expires_at
                                                        ? format(new Date(cycle.expires_at), "d MMM yyyy", { locale: es })
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cycle.status === 'active' ? "success" : cycle.status === 'completed' ? "success" : "secondary"}>
                                                        {cycle.status === 'active' ? "Activo"
                                                            : cycle.status === 'completed' ? "Completado"
                                                                : cycle.status === 'cancelled' ? "Cancelado"
                                                                    : cycle.status === 'expired' ? "Expirado"
                                                                        : cycle.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(cycle.amount, cycle.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    {getProviderBadge(getProvider(cycle.payment))}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
        </ContentLayout>
    );
}
