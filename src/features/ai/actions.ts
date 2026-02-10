"use server";

import { chatCompletion } from "./ai-client";
import { IMPORT_ANALYZER_SYSTEM_PROMPT } from "./prompts";
import type { AIAnalysisResult, AIActionResult } from "./types";

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
