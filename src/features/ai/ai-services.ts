"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// AI Services — DB Integration
// Conecta las llamadas a OpenAI con las tablas del schema ai.*
// ============================================================================

// Costo por token en USD (precios oficiales OpenAI – Marzo 2026)
// Fuente: https://openai.com/api/pricing/
// gpt-4o:      $2.50 / 1M input,  $10.00 / 1M output
// gpt-4o-mini: $0.15 / 1M input,  $0.60  / 1M output
const COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
    // ── gpt-4o family ──────────────────────────────────────
    "gpt-4o":              { input: 0.0000025, output: 0.00001 },
    "gpt-4o-2024-05-13":   { input: 0.0000025, output: 0.00001 },
    "gpt-4o-2024-08-06":   { input: 0.0000025, output: 0.00001 },
    "gpt-4o-2024-11-20":   { input: 0.0000025, output: 0.00001 },
    // ── gpt-4o-mini family ─────────────────────────────────
    "gpt-4o-mini":             { input: 0.00000015, output: 0.0000006 },
    "gpt-4o-mini-2024-07-18": { input: 0.00000015, output: 0.0000006 },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = COST_PER_TOKEN[model] ?? COST_PER_TOKEN["gpt-4o-mini"];
    return inputTokens * rates.input + outputTokens * rates.output;
}

// ============================================================================
// logAIUsage
// Registra cada llamada a OpenAI en ai.ai_usage_logs.
// Falla silenciosamente — nunca interrumpe el flujo principal.
// ============================================================================
export async function logAIUsage({
    userId,
    organizationId,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    contextType,
}: {
    userId: string | null;
    organizationId: string | null;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    contextType: string;
}): Promise<void> {
    try {
        const supabase = await createClient();
        const costUsd = calculateCost(model, inputTokens, outputTokens);

        await supabase.schema("ai").from("ai_usage_logs").insert({
            user_id: userId,
            organization_id: organizationId,
            provider: "openai",
            model,
            prompt_tokens: inputTokens,
            completion_tokens: outputTokens,
            total_tokens: totalTokens,
            cost_usd: costUsd,
            context_type: contextType,
        });
    } catch (error) {
        console.warn("[AI] Usage log failed (non-critical):", error);
    }
}

// ============================================================================
// getDefaultAILimitsForOrg
// Busca la suscripción activa de la organización y extrae los límites de su plan.
// ============================================================================
async function getDefaultAILimitsForOrg(supabase: any, organizationId: string) {
    let dailyLimit = 10;
    let monthlyLimit = 50000;
    let planSlug = "free";

    try {
        const { data: subData, error } = await supabase
            .schema("billing")
            .from("organization_subscriptions")
            .select(`
                plans (
                    slug,
                    name,
                    features
                )
            `)
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .maybeSingle();



        if (error) {
            console.warn("[AI] Error fetching subscription:", error.message);
        }

        if (subData && subData.plans) {
            const plan = Array.isArray(subData.plans) ? subData.plans[0] : subData.plans;
            planSlug = plan?.slug || plan?.name?.toLowerCase() || "free";
            
            const features = plan?.features as Record<string, any>;
            
            if (features?.ai_daily_requests_limit !== undefined) {
                const raw = Number(features.ai_daily_requests_limit);
                // -1 = sin límite (Enterprise, etc.)
                dailyLimit = raw === -1 ? 999999 : raw;
            } else if (planSlug.includes('enterprise')) {
                dailyLimit = 999999;
            }

            if (features?.ai_monthly_tokens_limit !== undefined) {
                const raw = Number(features.ai_monthly_tokens_limit);
                monthlyLimit = raw === -1 ? 999999999 : raw;
            } else if (planSlug.includes('enterprise')) {
                monthlyLimit = 999999999;
            }
        }
    } catch (e) {
        console.warn("[AI] Failed to fetch plan limits, defaulting", e);
    }

    return { plan: planSlug, dailyLimit, monthlyLimit };
}

// ============================================================================
// checkAIUsageLimit
// Verifica el límite diario de la organización actual en contexto.
// Resetea automáticamente si cambió el día.
// ============================================================================
export async function checkAIUsageLimit(organizationId: string | null): Promise<{
    allowed: boolean;
    remaining: number;
    dailyLimit: number;
}> {
    if (!organizationId) {
        // Fallback si por algun motivo no hay org en contexto (ej: personal space)
        return { allowed: true, remaining: 3, dailyLimit: 3 };
    }

    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const { data: limits } = await supabase
            .schema("ai")
            .from("ai_organization_usage_limits")
            .select("*")
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (!limits) {
            // Sin registro — se permite consultando sus límites por defecto reales
            const defaultLimits = await getDefaultAILimitsForOrg(supabase, organizationId);
            return { allowed: true, remaining: defaultLimits.dailyLimit, dailyLimit: defaultLimits.dailyLimit };
        }

        // Si cambió el día, resetear el contador diario
        if (limits.last_reset_at !== today) {
            await supabase
                .schema("ai")
                .from("ai_organization_usage_limits")
                .update({ requests_used_today: 0, last_reset_at: today })
                .eq("organization_id", organizationId);

            return { allowed: true, remaining: limits.daily_requests_limit, dailyLimit: limits.daily_requests_limit };
        }

        const remaining = limits.daily_requests_limit - limits.requests_used_today;
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            dailyLimit: limits.daily_requests_limit,
        };
    } catch {
        // En caso de error, siempre dejar pasar (fail open)
        return { allowed: true, remaining: 10, dailyLimit: 10 };
    }
}

// ============================================================================
// incrementAIUsage
// Incrementa el contador de llamadas realizadas hoy por la organización.
// Falla silenciosamente.
// ============================================================================
export async function incrementAIUsage(organizationId: string | null): Promise<void> {
    if (!organizationId) return;

    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0];
        const now = new Date().toISOString();

        const { data: existing } = await supabase
            .schema("ai")
            .from("ai_organization_usage_limits")
            .select("requests_used_today")
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (existing) {
            await supabase
                .schema("ai")
                .from("ai_organization_usage_limits")
                .update({
                    requests_used_today: existing.requests_used_today + 1,
                    last_request_at: now,
                })
                .eq("organization_id", organizationId);
        } else {
            // Si no existe, buscamos los límites de su plan y lo creamos
            const limits = await getDefaultAILimitsForOrg(supabase, organizationId);

            await supabase.schema("ai").from("ai_organization_usage_limits").insert({
                organization_id: organizationId,
                plan: limits.plan,
                daily_requests_limit: limits.dailyLimit,
                monthly_tokens_limit: limits.monthlyLimit,
                requests_used_today: 1,
                last_request_at: now,
                last_reset_at: today,
            });
        }
    } catch (error) {
        console.warn("[AI] Usage org limit increment failed:", error);
    }
}
