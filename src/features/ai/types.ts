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

// ============================================================================
// Recipe Suggester Types
// ============================================================================

/** Un material sugerido por la IA para una receta */
export interface AIRecipeSuggestedMaterial {
    /** Nombre del material tal como lo conoce la IA */
    name: string;
    /** ID del item del catálogo si hubo match, null si no existe */
    catalogId: string | null;
    /** Nombre del item del catálogo si hubo match */
    catalogName: string | null;
    /** Cantidad por 1 unidad de la tarea */
    quantity: number;
    /** Símbolo de unidad (m², kg, l, un…) */
    unit: string;
    /** % de desperdicio sugerido (0-20) */
    wastePercentage: number;
}

/** Un tipo de mano de obra sugerido por la IA para una receta */
export interface AIRecipeSuggestedLabor {
    /** Nombre del tipo de MO tal como lo conoce la IA */
    name: string;
    /** ID del item del catálogo si hubo match, null si no existe */
    catalogId: string | null;
    /** Nombre del item del catálogo si hubo match */
    catalogName: string | null;
    /** Cantidad (horas u otra unidad) por 1 unidad de la tarea */
    quantity: number;
    /** Símbolo de unidad */
    unit: string;
}

/** Resultado completo de la sugerencia de receta */
export interface AIRecipeSuggestion {
    /** Nivel de confianza de la IA en la sugerencia */
    confidence: "high" | "medium" | "low";
    /** Explicación breve de la sugerencia (en español) */
    reasoning: string;
    /** Materiales sugeridos */
    materials: AIRecipeSuggestedMaterial[];
    /** Mano de obra sugerida */
    labor: AIRecipeSuggestedLabor[];
}
