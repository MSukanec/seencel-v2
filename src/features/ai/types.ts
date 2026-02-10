// ============================================================================
// AI Feature Types — Shared across all AI integrations
// ============================================================================

/**
 * Result from AI Excel structure analysis.
 * Each detected task includes its associated recipe resources.
 */
export interface AIAnalyzedTask {
    /** Task code as detected from the Excel (e.g., "CA-122") */
    code: string;
    /** Task name/description */
    name: string;
    /** Unit of measurement (e.g., "m²", "ml", "kg") */
    unit?: string;
    /** Row number in the original Excel (1-based) */
    sourceRow: number;
    /** Detected materials for this task's recipe */
    materials: AIAnalyzedMaterial[];
    /** Detected labor items for this task's recipe */
    labor: AIAnalyzedLabor[];
}

export interface AIAnalyzedMaterial {
    /** Material code if present */
    code?: string;
    /** Material name/description */
    name: string;
    /** Unit of measurement */
    unit?: string;
    /** Quantity per unit of task */
    quantity?: number;
    /** Waste percentage if detected */
    wastePercentage?: number;
    /** Unit cost if detected */
    unitCost?: number;
    /** Row number in original Excel */
    sourceRow: number;
}

export interface AIAnalyzedLabor {
    /** Labor description/name */
    name: string;
    /** Unit of measurement */
    unit?: string;
    /** Quantity per unit of task */
    quantity?: number;
    /** Unit cost if detected */
    unitCost?: number;
    /** Row number in original Excel */
    sourceRow: number;
}

/**
 * Full result from AI analysis of an Excel file.
 */
export interface AIAnalysisResult {
    /** Detected tasks with their recipes */
    tasks: AIAnalyzedTask[];
    /** Summary statistics */
    summary: {
        totalTasks: number;
        totalMaterials: number;
        totalLabor: number;
        /** Confidence level: how sure the AI is about the structure */
        confidence: "high" | "medium" | "low";
    };
    /** Token usage for cost tracking */
    tokensUsed: {
        input: number;
        output: number;
        total: number;
    };
}

/**
 * Generic AI operation result wrapper.
 * Used by all AI server actions for consistent error handling.
 */
export type AIActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };
