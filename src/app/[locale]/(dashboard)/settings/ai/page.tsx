import type { Metadata } from "next";
import { requireAuthContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ContentLayout } from "@/components/layout";
import { AiSettingsView } from "@/features/ai/views/ai-settings-view";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Inteligencia Artificial | Configuración | Seencel",
        description: "Configuración y consumo de IA",
        robots: "noindex, nofollow",
    };
}

export default async function AiSettingsPage() {
    const { orgId } = await requireAuthContext();
    const supabase = await createClient();

    // 1. Obtener Límites Actuales de la Organización
    const { data: limits } = await supabase
        .schema("ai")
        .from("ai_organization_usage_limits")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();

    // 2. Obtener Consumo Total Histórico (Por ahora todo en memoria, en un futuro agrupar por mes en SQL)
    const { data: logs } = await supabase
        .schema("ai")
        .from("ai_usage_logs")
        .select("total_tokens, context_type, cost_usd")
        .eq("organization_id", orgId);

    // Calcular métricas
    const totalTokens = (logs || []).reduce((acc, log) => acc + (log.total_tokens || 0), 0);
    const totalCost = (logs || []).reduce((acc, log) => acc + (log.cost_usd || 0), 0);
    const usageByContext = (logs || []).reduce((acc, log) => {
        const type = log.context_type || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <ContentLayout variant="narrow">
            <AiSettingsView
                limits={limits}
                metrics={{
                    totalTokens,
                    totalCost,
                    usageByContext,
                    totalRequests: logs?.length || 0
                }}
            />
        </ContentLayout>
    );
}
