"use client";

import { OrganizationSubscription, OrganizationBillingCycle } from "@/types/organization";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageIntro } from "@/components/layout";
import { Receipt } from "lucide-react";
import { format, type Locale } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { BillingStatusCards } from "@/features/billing/components/billing-status-cards";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/actions/plans";
import type { PlanPurchaseFlags } from "@/features/billing/components/plan-card";
import { getPlanDisplayName } from "@/lib/plan-utils";
import { getBillingCyclesColumns } from "../tables/billing-cycles-columns";
import { DataTable } from "@/components/shared/data-table/data-table";
import { useMemo } from "react";

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
    const columns = useMemo(() => getBillingCyclesColumns(t), [t]);

    const displayName = getPlanDisplayName(subscription?.plan?.name || '');
    const isFree = displayName === 'Esencial' || subscription?.amount === 0;

    return (
            <div className="space-y-6">
                <PageIntro
                    icon={Receipt}
                    title="Facturación y Planes"
                    description="Gestioná tu suscripción a Seencel, ciclos de facturación y límites de tu plan."
                    action={
                        <Button variant="outline" size="sm" asChild>
                            <Link href={"/settings/billing/plans" as any}>
                                Ver todos los planes
                            </Link>
                        </Button>
                    }
                />
                
                {/* Next/Current Plan Cards (Linear Style) */}
                <BillingStatusCards
                    plans={plans}
                    currentPlanId={currentPlanId}
                    organizationId={organizationId}
                    isAdmin={isAdmin}
                />

                {/* Subscription info */}
                {subscription && !isFree && (
                    <div className="text-sm text-muted-foreground">
                        {subscription.billing_period === 'one-time' ? (
                            <p>{t("planActive", { plan: displayName, date: format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: dateLocale }) })}</p>
                        ) : (
                            <p>{t("planExpires", { plan: displayName, date: format(new Date(subscription.expires_at), "d 'de' MMMM, yyyy", { locale: dateLocale }) })}</p>
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
                        <DataTable
                            columns={columns}
                            data={billingCycles}
                            meta={{ t }}
                        />
                    </Card>
                </div>
            </div>
    );
}
