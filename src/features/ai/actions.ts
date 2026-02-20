"use server";

import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "./ai-client";
import { logAIUsage, incrementAIUsage, checkAIUsageLimit } from "./ai-services";
import { IMPORT_ANALYZER_SYSTEM_PROMPT, RECIPE_SUGGESTER_SYSTEM_PROMPT } from "./prompts";
import type { AIAnalysisResult, AIActionResult, AIRecipeSuggestion } from "./types";


// ============================================================================
// AI Server Actions
// ============================================================================

/**
 * Analyze an Excel's raw rows to detect hierarchical structure (tasks + recipes).
 *
 * Takes the raw 2D array from XLSX parsing and sends a subset to OpenAI
 * for structure detection. The AI identifies tasks, materials, and labor
 * from the hierarchical rows.
 *
 * @param rows - Raw 2D array from XLSX (all rows including headers)
 * @param headerRowIndex - 0-based index of the header row (to include as context)
 * @param maxRows - Maximum rows to send to AI (to control cost). Default 500.
 */
export async function analyzeExcelStructure(
    rows: any[][],
    headerRowIndex: number = 0,
    maxRows: number = 500,
): Promise<AIActionResult<AIAnalysisResult>> {
    try {
        if (!rows || rows.length === 0) {
            return { success: false, error: "No hay datos para analizar" };
        }

        // Obtener usuario actual para logs
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Build context: header row + data rows (limited to maxRows for cost control)
        const headerRow = rows[headerRowIndex] || [];
        const dataRows = rows.slice(headerRowIndex + 1, headerRowIndex + 1 + maxRows);

        // Format as a readable table for the AI
        const formattedData = formatRowsForAI(headerRow, dataRows, headerRowIndex);

        const result = await chatCompletion<AIAnalysisResult>({
            systemPrompt: IMPORT_ANALYZER_SYSTEM_PROMPT,
            userPrompt: `Analyze the following Excel data and extract the task+recipe hierarchy.\n\nHeaders (row ${headerRowIndex + 1}): ${JSON.stringify(headerRow)}\n\nData (${dataRows.length} rows):\n${formattedData}`,
            model: "gpt-4o-mini",
            maxTokens: 8192,
            temperature: 0.05, // Very low — we want deterministic structure extraction
            responseFormat: "json",
        });

        // Validate the response has the expected shape
        const analysis = result.data;
        if (!analysis.tasks || !Array.isArray(analysis.tasks)) {
            return { success: false, error: "La IA no pudo detectar tareas en el archivo" };
        }

        // Attach token usage from the response
        analysis.tokensUsed = result.tokensUsed;

        // Loguear uso en DB (fire-and-forget — no bloquea el flujo)
        if (user) {
            void logAIUsage({
                userId: user.id,
                model: result.model,
                inputTokens: result.tokensUsed.input,
                outputTokens: result.tokensUsed.output,
                totalTokens: result.tokensUsed.total,
                contextType: "import_analyzer",
            });
            void incrementAIUsage(user.id);
        }

        return { success: true, data: analysis };
    } catch (error) {
        console.error("[AI] Error analyzing Excel structure:", error);
        const message = error instanceof Error ? error.message : "Error desconocido al analizar";
        return { success: false, error: message };
    }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format rows as a compact text table for the AI prompt.
 * Each row is prefixed with its original Excel row number for reference.
 */
function formatRowsForAI(headerRow: any[], dataRows: any[][], headerRowIndex: number): string {
    const lines: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const excelRowNum = headerRowIndex + 2 + i; // 1-based, after header

        // Skip completely empty rows
        const hasContent = row.some((cell: any) =>
            cell !== null && cell !== undefined && String(cell).trim() !== ""
        );
        if (!hasContent) continue;

        // Format: "Row 5: [CA-122, , Revestimiento de Madera, m², , , $929867]"
        const cells = row.map((cell: any) => {
            if (cell === null || cell === undefined || String(cell).trim() === "") return "";
            return String(cell).trim();
        });

        lines.push(`Row ${excelRowNum}: [${cells.join(", ")}]`);
    }

    return lines.join("\n");
}

// ============================================================================
// suggestRecipe
// ============================================================================

/**
 * Usa IA para sugerir materiales y mano de obra para una receta de tarea.
 *
 * @param taskName - Nombre de la tarea (ej: "Revoque grueso")
 * @param taskUnit - Unidad de la tarea (ej: "m²")
 * @param taskDivision - Rubro/división de la tarea para dar contexto (ej: "Revoques")
 * @param catalogMaterials - Lista de materiales del catálogo para matching
 * @param catalogLaborTypes - Lista de tipos de MO del catálogo para matching
 */
export async function suggestRecipe({
    taskName,
    taskUnit,
    taskDivision,
    catalogMaterials,
    catalogLaborTypes,
}: {
    taskName: string;
    taskUnit?: string | null;
    taskDivision?: string | null;
    catalogMaterials?: { id: string; name: string; unit_symbol?: string | null }[];
    catalogLaborTypes?: { id: string; name: string; unit_symbol?: string | null }[];
}): Promise<AIActionResult<AIRecipeSuggestion>> {
    try {
        // Obtener usuario actual
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuario no autenticado" };
        }

        // Verificar límite de uso diario
        const usageLimit = await checkAIUsageLimit(user.id);
        if (!usageLimit.allowed) {
            return {
                success: false,
                error: `Alcanzaste el límite de ${usageLimit.dailyLimit} sugerencias diarias. Volvé mañana o actualizá tu plan.`,
            };
        }

        // Construir el user prompt con todo el contexto disponible
        const parts: string[] = [
            `Task name: "${taskName}"`,
            taskUnit ? `Unit of measure: "${taskUnit}"` : "",
            taskDivision ? `Category/rubro: "${taskDivision}"` : "",
        ].filter(Boolean);

        // Incluir catálogo de materiales (hasta 80 para que no explote el contexto)
        if (catalogMaterials && catalogMaterials.length > 0) {
            const sample = catalogMaterials.slice(0, 80);
            const catalogText = sample
                .map((m) => `- ${m.id} | ${m.name}${m.unit_symbol ? ` (${m.unit_symbol})` : ""}`)
                .join("\n");
            parts.push(`\nAvailable catalog materials (try to match by name):\n${catalogText}`);
        }

        // Incluir catálogo de MO (hasta 40)
        if (catalogLaborTypes && catalogLaborTypes.length > 0) {
            const sample = catalogLaborTypes.slice(0, 40);
            const laborText = sample
                .map((l) => `- ${l.id} | ${l.name}${l.unit_symbol ? ` (${l.unit_symbol})` : ""}`)
                .join("\n");
            parts.push(`\nAvailable catalog labor types (try to match by name):\n${laborText}`);
        }

        const userPrompt = parts.join("\n");

        // Llamar a OpenAI — usamos gpt-4o para mayor precisión técnica en cantidades
        const result = await chatCompletion<AIRecipeSuggestion>({
            systemPrompt: RECIPE_SUGGESTER_SYSTEM_PROMPT,
            userPrompt,
            model: "gpt-4o",
            maxTokens: 3000, // Espacio para el chain-of-thought interno
            temperature: 0.1, // Mínima aleatoriedad — queremos consistencia técnica
            responseFormat: "json",
        });

        const suggestion = result.data;

        // Validación mínima
        if (!suggestion.materials && !suggestion.labor) {
            return { success: false, error: "La IA no pudo generar una sugerencia" };
        }

        // Normalizar defaults
        suggestion.materials = (suggestion.materials ?? []).map((m) => ({
            ...m,
            wastePercentage: m.wastePercentage ?? 0,
            catalogId: m.catalogId ?? null,
            catalogName: m.catalogName ?? null,
        }));
        suggestion.labor = (suggestion.labor ?? []).map((l) => ({
            ...l,
            catalogId: l.catalogId ?? null,
            catalogName: l.catalogName ?? null,
        }));

        // Log en DB (fire-and-forget)
        void logAIUsage({
            userId: user.id,
            model: result.model,
            inputTokens: result.tokensUsed.input,
            outputTokens: result.tokensUsed.output,
            totalTokens: result.tokensUsed.total,
            contextType: "recipe_suggester",
        });
        void incrementAIUsage(user.id);

        return { success: true, data: suggestion };
    } catch (error) {
        console.error("[AI] Error suggesting recipe:", error);
        const message = error instanceof Error ? error.message : "Error al generar sugerencia";
        return { success: false, error: message };
    }
}

