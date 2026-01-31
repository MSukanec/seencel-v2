"use client";

import { OrganizationSubscription, OrganizationBillingCycle } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentLayout } from "@/components/layout";
import { CreditCard, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BillingSettingsViewProps {
    subscription?: OrganizationSubscription | null;
    billingCycles?: OrganizationBillingCycle[];
}

export function BillingSettingsView({ subscription, billingCycles = [] }: BillingSettingsViewProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Colores por plan - deben coincidir con los del sidebar (plan-button.tsx)
    const getPlanColors = (planSlug?: string | null, planName?: string | null) => {
        const slug = planSlug?.toLowerCase() || planName?.toLowerCase() || '';
        if (slug.includes('pro')) {
            return {
                card: 'bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30',
                text: 'text-indigo-500',
                badge: 'text-indigo-600 border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
            };
        }
        if (slug.includes('team') || slug.includes('enterprise') || slug.includes('empresarial')) {
            return {
                card: 'bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30',
                text: 'text-purple-500',
                badge: 'text-purple-600 border-purple-500 bg-purple-50 dark:bg-purple-950'
            };
        }
        // Default / Free - lime como en sidebar
        return {
            card: 'bg-lime-500/10 dark:bg-lime-500/20 border border-lime-500/30',
            text: 'text-lime-500',
            badge: 'text-lime-600 border-lime-500 bg-lime-50 dark:bg-lime-950'
        };
    };

    const planColors = getPlanColors(subscription?.plan?.slug, subscription?.plan?.name);

    // Badge de método de pago - simple
    const getProviderBadge = (provider: string | undefined | null) => {
        const p = provider?.toLowerCase() || '';
        if (p.includes('paypal')) return <Badge variant="outline">PayPal</Badge>;
        if (p.includes('mercadopago') || p.includes('mercado')) return <Badge variant="outline">MercadoPago</Badge>;
        if (p.includes('bank') || p.includes('transfer')) return <Badge variant="outline">Transferencia</Badge>;
        return <Badge variant="outline">{provider || '-'}</Badge>;
    };

    // Helper para obtener provider del payment (puede venir como array o objeto)
    const getProvider = (payment: { provider: string }[] | { provider: string } | null | undefined): string | undefined => {
        if (!payment) return undefined;
        if (Array.isArray(payment)) return payment[0]?.provider;
        return payment.provider;
    };

    return (
        <ContentLayout variant="wide">
            <div className="space-y-6">
                <h2 className="text-xl font-semibold tracking-tight">Facturación y Planes</h2>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    {/* Plan Details Card */}
                    <Card className={`md:col-span-4 shadow-sm ${planColors.card}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className={`text-2xl ${planColors.text}`}>
                                        {subscription?.plan?.name || "Plan Gratuito"}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {subscription?.plan?.description || "Estás usando la versión básica de Seencel."}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className={planColors.badge}>
                                    {subscription?.status === 'active' ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">
                                    {subscription ? formatCurrency(subscription.amount, subscription.currency) : '$0.00'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    / {subscription?.billing_period === 'annual' ? 'año' : 'mes'}
                                </span>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button className="font-medium" asChild>
                                    <a href="/es/pricing">Cambiar Plan</a>
                                </Button>
                            </div>

                            {subscription && subscription.billing_period !== 'one-time' && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    Tu plan se renovará automáticamente el {format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: es })}.
                                </p>
                            )}
                            {subscription && subscription.billing_period === 'one-time' && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    Tu plan está activo hasta el {format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: es })}.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Method Card - Styled like Untitled UI */}
                    <div className="md:col-span-3">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Método de Pago</CardTitle>
                                <CardDescription>
                                    Administra cómo pagas tu plan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {(() => {
                                    const provider = getProvider(billingCycles[0]?.payment)?.toLowerCase() || '';
                                    const payerEmail = subscription?.payer_email || billingCycles[0]?.payer_email;
                                    const expiresAt = subscription?.expires_at;

                                    if (provider.includes('paypal')) {
                                        return (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center w-16 h-12 bg-white border rounded-xl shadow-sm">
                                                        <img src="/logos/paypal_logo.png" alt="PayPal" className="h-8 w-auto" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">PayPal</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {expiresAt && `Expira ${format(new Date(expiresAt), "MM/yyyy")}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {payerEmail && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <CreditCard className="w-4 h-4" />
                                                        <span>{payerEmail}</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }

                                    if (provider.includes('mercadopago') || provider.includes('mercado')) {
                                        return (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center w-16 h-12 bg-white border rounded-xl shadow-sm">
                                                        <img src="/logos/mp_logo.png" alt="MercadoPago" className="h-8 w-auto" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">MercadoPago</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {expiresAt && `Expira ${format(new Date(expiresAt), "MM/yyyy")}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {payerEmail && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <CreditCard className="w-4 h-4" />
                                                        <span>{payerEmail}</span>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    }

                                    return (
                                        <div className="text-center py-4">
                                            <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                            <p className="text-sm text-muted-foreground">No hay método de pago configurado</p>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                </div>

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
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Método</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billingCycles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No hay facturas disponibles
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    billingCycles.map((cycle) => (
                                        <TableRow key={cycle.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(cycle.created_at), "d MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={cycle.status === 'active' ? "success" : "secondary"}>
                                                    {cycle.status === 'active' ? "Activo" : cycle.status === 'cancelled' ? "Cancelado" : cycle.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(cycle.amount, cycle.currency)}
                                            </TableCell>
                                            <TableCell>
                                                {getProviderBadge(getProvider(cycle.payment))}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </div>
        </ContentLayout>
    );
}
