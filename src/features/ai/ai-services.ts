"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// AI Services — DB Integration
// Conecta las llamadas a OpenAI con las tablas del schema ai.*
// ============================================================================

// Costo por token en USD (precios al Feb 2026)
const COST_PER_TOKEN: Record<string, { input: number; output: number }> = {
    "gpt-4o-mini": { input: 0.00000015, output: 0.0000006 },
    "gpt-4o": { input: 0.000005, output: 0.000015 },
    "gpt-4o-2024-11-20": { input: 0.000005, output: 0.000015 },
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
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    contextType,
}: {
    userId: string;
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
// checkAIUsageLimit
// Verifica el límite diario del usuario.
// Resetea automáticamente si cambió el día.
// ============================================================================
export async function checkAIUsageLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    dailyLimit: number;
}> {
    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const { data: limits } = await supabase
            .schema("ai")
            .from("ai_user_usage_limits")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (!limits) {
            // Sin registro — usuario nuevo. Se permite sin restricción.
            return { allowed: true, remaining: 3, dailyLimit: 3 };
        }

        // Si cambió el día, resetear el contador
        if (limits.last_reset_at !== today) {
            await supabase
                .schema("ai")
                .from("ai_user_usage_limits")
                .update({ prompts_used_today: 0, last_reset_at: today })
                .eq("user_id", userId);

            return { allowed: true, remaining: limits.daily_limit, dailyLimit: limits.daily_limit };
        }

        const remaining = limits.daily_limit - limits.prompts_used_today;
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            dailyLimit: limits.daily_limit,
        };
    } catch {
        // Si falla la verificación, permitir para no bloquear al usuario
        return { allowed: true, remaining: 3, dailyLimit: 3 };
    }
}

// ============================================================================
// incrementAIUsage
// Incrementa el contador de prompts usados hoy.
// Se llama DESPUÉS de una llamada exitosa a OpenAI.
// Falla silenciosamente.
// ============================================================================
export async function incrementAIUsage(userId: string): Promise<void> {
    try {
        const supabase = await createClient();
        const today = new Date().toISOString().split("T")[0];
        const now = new Date().toISOString();

        // Intentar obtener el registro actual
        const { data: existing } = await supabase
            .schema("ai")
            .from("ai_user_usage_limits")
            .select("prompts_used_today")
            .eq("user_id", userId)
            .single();

        if (existing) {
            // Incrementar el contador actual
            await supabase
                .schema("ai")
                .from("ai_user_usage_limits")
                .update({
                    prompts_used_today: existing.prompts_used_today + 1,
                    last_prompt_at: now,
                })
                .eq("user_id", userId);
        } else {
            // Crear registro por primera vez
            await supabase.schema("ai").from("ai_user_usage_limits").insert({
                user_id: userId,
                plan: "free",
                daily_limit: 3,
                prompts_used_today: 1,
                last_prompt_at: now,
                last_reset_at: today,
            });
        }
    } catch (error) {
        console.warn("[AI] Usage increment failed (non-critical):", error);
    }
}
