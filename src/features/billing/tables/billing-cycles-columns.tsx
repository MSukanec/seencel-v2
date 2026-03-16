"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
    createDateColumn, 
    createTextColumn, 
    createMoneyColumn, 
    createStatusColumn 
} from "@/components/shared/data-table/columns";
import { OrganizationBillingCycle } from "@/types/organization";
import { getPlanDisplayName } from "@/lib/plan-utils";

// ── Types and Helpers ──
const getProviderBadge = (provider: string | undefined | null, t: any) => {
    const p = provider?.toLowerCase() || '';
    if (p.includes('paypal')) return <Badge variant="outline">{t("provider.paypal")}</Badge>;
    if (p.includes('mercadopago') || p.includes('mercado')) return <Badge variant="outline">{t("provider.mercadopago")}</Badge>;
    if (p.includes('bank') || p.includes('transfer') || !provider) return <Badge variant="outline">{t("provider.transfer")}</Badge>;
    return <Badge variant="outline">{provider}</Badge>;
};

const getProvider = (payment: { provider: string }[] | { provider: string } | null | undefined): string | undefined => {
    if (!payment) return undefined;
    if (Array.isArray(payment)) return payment[0]?.provider;
    return payment.provider;
};

const getPlanName = (plan: { name: string }[] | { name: string } | null | undefined): string => {
    if (!plan) return '';
    const name = Array.isArray(plan) ? plan[0]?.name : plan.name;
    return getPlanDisplayName(name || '');
};

const getStatusLabel = (status: string, t: any) => {
    const key = status as 'active' | 'completed' | 'cancelled' | 'expired';
    const knownStatuses = ['active', 'completed', 'cancelled', 'expired'];
    return knownStatuses.includes(status) ? t(`status.${key}`) : status;
};

export function getBillingCyclesColumns(t: any): ColumnDef<OrganizationBillingCycle>[] {
    return [
        createDateColumn<OrganizationBillingCycle>({
            accessorKey: "created_at",
            title: t("table.date"),
        }),
        createTextColumn<OrganizationBillingCycle>({
            accessorKey: "product_type",
            title: t("table.concept"),
            customRender: (_, row: OrganizationBillingCycle) => {
                const cycle = row;
                const planName = getPlanName(cycle.plan);
                const conceptLabel = cycle.product_type === 'upgrade'
                    ? t("concept.upgrade", { plan: planName })
                    : cycle.product_type === 'seat_purchase'
                        ? t("concept.seats")
                        : t("concept.subscription", { plan: planName });
                return <span className="text-sm font-medium">{conceptLabel}</span>;
            }
        }),
        createDateColumn<OrganizationBillingCycle>({
            accessorKey: "started_at",
            title: t("table.start"),
        }),
        createDateColumn<OrganizationBillingCycle>({
            accessorKey: "expires_at",
            title: t("table.end"),
        }),
        createStatusColumn<OrganizationBillingCycle>({
            accessorKey: "status",
            title: t("table.status"),
            options: [
                { value: "active", label: t("status.active"), variant: "positive" },
                { value: "completed", label: t("status.completed"), variant: "positive" },
                { value: "cancelled", label: t("status.cancelled"), variant: "neutral" },
                { value: "expired", label: t("status.expired"), variant: "neutral" },
            ],
            showLabel: true,
        }),
        createMoneyColumn<OrganizationBillingCycle>({
            accessorKey: "amount",
            title: t("table.amount"),
            currencyKey: "currency",
        }),
        createTextColumn<OrganizationBillingCycle>({
            accessorKey: "id",
            title: t("table.method"),
            customRender: (_, row: OrganizationBillingCycle) => {
                const cycle = row;
                return getProviderBadge(getProvider(cycle.payment), t);
            }
        }),
    ];
}
