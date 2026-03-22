"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, FileText, Landmark, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { PageWrapper } from "@/components/layout/page/page-wrapper";
import { ContentLayout } from "@/components/layout/page/content-layout";
import { MetricCard } from "@/components/cards/presets/metric-card";

export default function AccountantPortalMockPage() {
    return (
        <PageWrapper title="Portal de Contador" icon={<Landmark />}>
            <ContentLayout variant="wide">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard Financiero (MOCK)</h1>
                        <p className="text-muted-foreground">
                            Esta es una vista preliminar del portal exclusivo para el contador externo. 
                            Un contador real no verá los acordeones de "Construcción" ni "Gestión" en su Sidebar, solo verá estos botones financieros.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Ingresos Totales (Mes)"
                            value="$125,000.00"
                            icon={<ArrowDownCircle />}
                        />
                        <MetricCard
                            title="Egresos Totales (Mes)"
                            value="$84,200.00"
                            icon={<ArrowUpCircle />}
                        />
                        <MetricCard
                            title="Balance Pendiente"
                            value="$40,800.00"
                            icon={<Landmark />}
                        />
                    </div>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
