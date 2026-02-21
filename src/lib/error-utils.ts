/**
 * Error Sanitization & Logging Utilities
 * 
 * Centralizes error handling for all server actions:
 * - sanitizeError(): Converts raw Postgres/Supabase errors to user-friendly messages
 * - logServerError(): Logs errors to system_error_logs for admin visibility
 */

import { createClient } from "@/lib/supabase/server";

const isDev = process.env.NODE_ENV === "development";

// ============================================================================
// ERROR PATTERN MATCHING
// ============================================================================

interface ErrorPattern {
    /** Regex or string to match against error message */
    pattern: RegExp;
    /** User-friendly message in Spanish */
    message: string;
}

const ERROR_PATTERNS: ErrorPattern[] = [
    // Duplicate / unique constraint
    {
        pattern: /duplicate key|unique constraint|already exists/i,
        message: "Ya existe un registro con esos datos.",
    },
    // Foreign key violation (reference doesn't exist)
    {
        pattern: /violates foreign key|foreign key constraint|is not present in table/i,
        message: "No se puede completar porque depende de un registro que no existe.",
    },
    // Column doesn't exist (schema mismatch)
    {
        pattern: /column .+ does not exist|undefined column/i,
        message: "Error interno del sistema. Contactá soporte.",
    },
    // RLS / permission denied
    {
        pattern: /permission denied|row-level security|new row violates row-level security/i,
        message: "No tenés permisos para realizar esta acción.",
    },
    // Check constraint violation
    {
        pattern: /violates check constraint/i,
        message: "Los datos ingresados no son válidos.",
    },
    // Not null violation
    {
        pattern: /null value in column|not-null constraint/i,
        message: "Falta completar un campo obligatorio.",
    },
    // Authentication
    {
        pattern: /not authenticated|jwt expired|invalid token|auth.*required/i,
        message: "Tu sesión expiró. Iniciá sesión nuevamente.",
    },
    // Supabase PGRST errors
    {
        pattern: /PGRST\d+/i,
        message: "Error interno del sistema. Intentá nuevamente.",
    },
    // Network / timeout
    {
        pattern: /fetch failed|network|timeout|ECONNREFUSED|socket hang up/i,
        message: "Error de conexión. Verificá tu internet e intentá nuevamente.",
    },
    // Too many rows / no rows
    {
        pattern: /contains 0 rows|multiple.*rows.*returned/i,
        message: "Error procesando los datos. Intentá nuevamente.",
    },
];

const DEFAULT_MESSAGE = "Ocurrió un error inesperado. Intentá nuevamente.";

// ============================================================================
// sanitizeError
// ============================================================================

/**
 * Converts a raw error (from Postgres, Supabase, or JS) into a user-friendly message.
 * 
 * In development: appends the technical detail in parentheses for debugging.
 * In production: returns only the friendly message.
 * 
 * @param error - Any error (Error, PostgrestError, string, unknown)
 * @returns A sanitized, user-friendly error message in Spanish
 */
export function sanitizeError(error: unknown): string {
    const rawMessage = extractMessage(error);

    // Find matching pattern
    const match = ERROR_PATTERNS.find(p => p.pattern.test(rawMessage));
    const friendlyMessage = match?.message ?? DEFAULT_MESSAGE;

    // In development, append technical detail for debugging
    if (isDev && rawMessage !== friendlyMessage) {
        return `${friendlyMessage} (Dev: ${rawMessage})`;
    }

    return friendlyMessage;
}

/**
 * Extracts a string message from any error type
 */
function extractMessage(error: unknown): string {
    if (error === null || error === undefined) return "Unknown error";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    // Supabase PostgrestError has a .message property
    if (typeof error === "object" && "message" in error) {
        return String((error as { message: unknown }).message);
    }
    return String(error);
}

// ============================================================================
// logServerError
// ============================================================================

/**
 * Logs an error to the system_error_logs table for admin visibility.
 * 
 * Fire-and-forget: does not block the response to the user.
 * If logging itself fails, it only console.errors (never breaks the flow).
 * 
 * @param domain   - High-level system area (e.g., 'projects', 'finance', 'tasks')
 * @param entity   - Specific operation/entity (e.g., 'create', 'update', 'delete')
 * @param functionName - The server action function name for debugging
 * @param error    - The original error
 * @param context  - Optional additional context (IDs, params, etc.)
 */
export async function logServerError(
    domain: string,
    entity: string,
    functionName: string,
    error: unknown,
    context?: Record<string, unknown>
): Promise<void> {
    try {
        const supabase = await createClient();
        const rawMessage = extractMessage(error);

        // Use the SECURITY DEFINER RPC function to bypass RLS
        await supabase.schema('audit').rpc("log_system_error", {
            p_domain: domain,
            p_entity: entity,
            p_function_name: functionName,
            p_error_message: rawMessage,
            p_context: context ?? {},
            p_severity: "error",
        });
    } catch (logError) {
        // Never let logging break the main flow
        console.error("[logServerError] Failed to log error:", logError);
    }
}
