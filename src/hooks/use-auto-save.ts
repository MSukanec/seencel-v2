// ============================================================================
// USE AUTO SAVE — Hook Centralizado de Auto-Guardado con Debounce
// ============================================================================
// Encapsula el patrón de debounce + save + toast que se repite en múltiples
// vistas de edición inline (perfil, proyecto, tarea, organización, etc.).
//
// USO:
//   const { triggerAutoSave } = useAutoSave({
//       saveFn: async (data) => { await updateSomething(data); },
//       validate: (data) => !!data.name.trim(),
//   });
//
//   const handleNameChange = (value: string) => {
//       setName(value);
//       triggerAutoSave({ name: value, description });
//   };
//
// REGLA: ver .agent/rules/core/autosave-pattern.md
// ============================================================================

import { useRef, useCallback } from "react";
import { toast } from "sonner";

// ── Types ──

export interface UseAutoSaveOptions<T> {
    /** Función asíncrona que persiste los datos. Debe lanzar error si falla. */
    saveFn: (data: T) => Promise<void>;

    /** Delay del debounce en ms. Default: 1000ms */
    delay?: number;

    /** Mensaje de toast en éxito. Default: "¡Cambios guardados!" */
    successMessage?: string;

    /** Mensaje de toast en error. Default: "Error al guardar los cambios." */
    errorMessage?: string;

    /** Validación pre-save. Si retorna false, no se guarda. */
    validate?: (data: T) => boolean;

    /** Callback opcional post-save exitoso. */
    onSuccess?: (data: T) => void;
}

export interface UseAutoSaveReturn<T> {
    /** Dispara el auto-save con debounce. Llamar en cada cambio de field. */
    triggerAutoSave: (data: T) => void;

    /** Cancela cualquier save pendiente (útil en cleanup o unmount). */
    cancelPending: () => void;
}

// ── Defaults ──

const DEFAULT_DELAY = 1000;
const DEFAULT_SUCCESS_MESSAGE = "¡Cambios guardados!";
const DEFAULT_ERROR_MESSAGE = "Error al guardar los cambios.";

// ── Hook ──

export function useAutoSave<T>(options: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
    const {
        saveFn,
        delay = DEFAULT_DELAY,
        successMessage = DEFAULT_SUCCESS_MESSAGE,
        errorMessage = DEFAULT_ERROR_MESSAGE,
        validate,
        onSuccess,
    } = options;

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelPending = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    }, []);

    const triggerAutoSave = useCallback((data: T) => {
        cancelPending();

        debounceRef.current = setTimeout(async () => {
            // Pre-save validation
            if (validate && !validate(data)) return;

            try {
                await saveFn(data);
                toast.success(successMessage);
                onSuccess?.(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : errorMessage;
                toast.error(message);
            }
        }, delay);
    }, [saveFn, delay, successMessage, errorMessage, validate, onSuccess, cancelPending]);

    return { triggerAutoSave, cancelPending };
}
