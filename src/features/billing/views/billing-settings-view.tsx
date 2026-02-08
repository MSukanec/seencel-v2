"use client";

import { OrganizationSubscription, OrganizationBillingCycle } from "@/types/organization";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContentLayout } from "@/components/layout";
import { Receipt } from "lucide-react";
import { format, type Locale } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { PlanCardsGrid } from "@/features/billing/components/plan-cards-grid";
import type { Plan } from "@/actions/plans";
import type { PlanPurchaseFlags } from "@/features/billing/components/plan-card";
import { getPlanDisplayName } from "@/lib/plan-utils";

const dateFnsLocales: Record<string, Locale> = { es, en: enUS };

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
    const locale = useLocale();
    const t = useTranslations("BillingSettings");
    const dateLocale = dateFnsLocales[locale] || es;

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (date: string, pattern = "d MMM yyyy") => {
        return format(new Date(date), pattern, { locale: dateLocale });
    };

    // Badge de método de pago
    const getProviderBadge = (provider: string | undefined | null) => {
        const p = provider?.toLowerCase() || '';
        if (p.includes('paypal')) return <Badge variant="outline">{t("provider.paypal")}</Badge>;
        if (p.includes('mercadopago') || p.includes('mercado')) return <Badge variant="outline">{t("provider.mercadopago")}</Badge>;
        if (p.includes('bank') || p.includes('transfer') || !provider) return <Badge variant="outline">{t("provider.transfer")}</Badge>;
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

    const getStatusLabel = (status: string) => {
        const key = status as 'active' | 'completed' | 'cancelled' | 'expired';
        const knownStatuses = ['active', 'completed', 'cancelled', 'expired'];
        return knownStatuses.includes(status) ? t(`status.${key}`) : status;
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
                            <p>{t("planActive", { plan: displayName, date: formatDate(subscription.expires_at, "d 'de' MMMM, yyyy") })}</p>
                        ) : (
                            <p>{t("planExpires", { plan: displayName, date: formatDate(subscription.expires_at, "d 'de' MMMM, yyyy") })}</p>
                        )}
                    </div>
                )}

                {/* Billing History */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">{t("history")}</h3>
                            <p className="text-sm text-muted-foreground">{t("historyDescription")}</p>
                        </div>
                    </div>

                    <Card className="border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead>{t("table.date")}</TableHead>
                                    <TableHead>{t("table.concept")}</TableHead>
                                    <TableHead>{t("table.start")}</TableHead>
                                    <TableHead>{t("table.end")}</TableHead>
                                    <TableHead>{t("table.status")}</TableHead>
                                    <TableHead>{t("table.amount")}</TableHead>
                                    <TableHead>{t("table.method")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {billingCycles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            {t("noInvoices")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    billingCycles.map((cycle) => {
                                        const planName = getPlanName(cycle.plan);
                                        const conceptLabel = cycle.product_type === 'upgrade'
                                            ? t("concept.upgrade", { plan: planName })
                                            : cycle.product_type === 'seat_purchase'
                                                ? t("concept.seats")
                                                : t("concept.subscription", { plan: planName });

                                        return (
                                            <TableRow key={cycle.id}>
                                                <TableCell className="font-medium">
                                                    {formatDate(cycle.created_at)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">{conceptLabel}</span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {cycle.started_at
                                                        ? formatDate(cycle.started_at)
                                                        : cycle.product_type === 'seat_purchase' && subscription?.started_at
                                                            ? formatDate(subscription.started_at)
                                                            : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {cycle.expires_at
                                                        ? formatDate(cycle.expires_at)
                                                        : cycle.product_type === 'seat_purchase' && subscription?.expires_at
                                                            ? formatDate(subscription.expires_at)
                                                            : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={cycle.status === 'active' ? "success" : cycle.status === 'completed' ? "success" : "secondary"}>
                                                        {getStatusLabel(cycle.status)}
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
