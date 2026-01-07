"use client";

import { OrganizationSubscription, OrganizationBillingCycle } from "@/types/organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Download, ExternalLink, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BillingTabProps {
    subscription?: OrganizationSubscription | null;
    billingCycles?: OrganizationBillingCycle[];
}

export function BillingTab({ subscription, billingCycles = [] }: BillingTabProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Facturación y Planes</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Plan Details Card */}
                <Card className="md:col-span-4 border-none shadow-sm bg-primary/5 dark:bg-primary/10">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl text-primary">
                                    {subscription?.plan?.name || "Plan Gratuito"}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    {subscription?.plan?.description || "Estás usando la versión básica de Seencel."}
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-primary border-primary bg-background">
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
                            <Button className="font-medium">
                                Cambiar Plan
                            </Button>
                            <Button variant="outline" className="font-medium">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Método de Pago
                            </Button>
                        </div>

                        {subscription && (
                            <p className="text-xs text-muted-foreground mt-4">
                                Tu plan se renovará automáticamente el {format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: es })}.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Stats Card (Optional / Placeholder) */}
                <div className="md:col-span-3 space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Próxima Factura</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {subscription ? formatCurrency(subscription.amount, subscription.currency) : '$0.00'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {subscription ? format(new Date(subscription.expires_at), "d 'de' MMMM", { locale: es }) : '-'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Ciclos Pagados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{billingCycles.filter(c => c.paid).length}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Historial total
                            </p>
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
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-right">Factura</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billingCycles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        No hay facturas disponibles
                                    </TableCell>
                                </TableRow>
                            ) : (
                                billingCycles.map((cycle) => (
                                    <TableRow key={cycle.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(cycle.period_start), "d MMM yyyy", { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cycle.paid ? "default" : "destructive"} className={cycle.paid ? "bg-green-100 text-green-700 hover:bg-green-200 border-none shadow-none" : ""}>
                                                {cycle.paid ? "Pagado" : "Pendiente"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(cycle.total_amount, cycle.currency_code)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {subscription?.plan?.name || "Plan Base"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                                                <Download className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
