"use client";

// ============================================================================
// TASKS RECIPE AI FORM — Panel dedicado de IA para recetas
// ============================================================================
// Se abre DENTRO de la receta (desde el botón Sparkles en el header).
// Permite sugerir materiales y mano de obra con IA, aceptarlos uno a uno
// o en batch, y los inserta directamente en la receta existente.
//
// Footer dinámico:
//   - Sin sugerencia → "Sugerir con IA" (dispara la IA)
//   - Con sugerencia → "Agregar todos a la receta" (agrega matcheados + cierra)
// ============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { usePanel } from "@/stores/panel-store";
import { toast } from "sonner";

import { addRecipeMaterial, addRecipeLabor } from "@/features/tasks/actions";
import { RecipeSuggestionPanel } from "@/features/ai/components/recipe-suggestion-panel";
import type { RecipeSuggestionPanelRef } from "@/features/ai/components/recipe-suggestion-panel";
import type { AIRecipeSuggestion, AIRecipeSuggestedMaterial, AIRecipeSuggestedLabor } from "@/features/ai/types";
import { Sparkles } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

/** Context about the parent task — used to power AI suggestions */
export interface TaskContext {
    name: string;
    unit?: string | null;
    division?: string | null;
    organizationId?: string | null;
    action?: string | null;
    element?: string | null;
    parameterValues?: Record<string, string | number | boolean>;
    catalogMaterials?: {
        id: string;
        name: string;
        unit_symbol?: string | null;
        unit_price?: number | null;
        currency_symbol?: string | null;
    }[];
    catalogLaborTypes?: {
        id: string;
        name: string;
        unit_symbol?: string | null;
        unit_price?: number | null;
        currency_symbol?: string | null;
    }[];
}

interface TasksRecipeAiFormProps {
    recipeId: string;
    taskContext: TaskContext;
    formId?: string;
}

// ============================================================================
// Component
// ============================================================================

export function TasksRecipeAiForm({ recipeId, taskContext, formId }: TasksRecipeAiFormProps) {
    const router = useRouter();
    const { closePanel, setPanelMeta, setSubmitting } = usePanel();

    // Ref to call suggest() on the panel from the footer
    const panelRef = useRef<RecipeSuggestionPanelRef>(null);

    // Track suggestion state for dynamic footer
    const suggestionRef = useRef<AIRecipeSuggestion | null>(null);
    const [hasSuggestion, setHasSuggestion] = useState(false);

    // User context for AI
    const [userContext, setUserContext] = useState("");

    // Track added items count for feedback
    const [addedCount, setAddedCount] = useState(0);

    // ========================================================================
    // Dynamic footer — changes label based on suggestion state
    // ========================================================================

    useEffect(() => {
        setPanelMeta({
            icon: Sparkles,
            title: "Sugerir con IA",
            description: "Generá sugerencias de materiales y mano de obra para esta receta.",
            size: "lg",
            footer: {
                submitLabel: hasSuggestion ? "Agregar todos a la receta" : "Sugerir con IA",
                hideCreateAnother: true,
            },
        });
    }, [setPanelMeta, hasSuggestion]);

    // ========================================================================
    // Callbacks — add items directly to recipe (one by one from + button)
    // ========================================================================

    const handleAcceptMaterial = useCallback(async (material: AIRecipeSuggestedMaterial) => {
        if (!material.catalogId) return;

        const result = await addRecipeMaterial({
            recipe_id: recipeId,
            material_id: material.catalogId,
            quantity: material.quantity,
            waste_percentage: material.wastePercentage,
            unit_id: null,
            notes: null,
        });

        if (result.success) {
            setAddedCount((c) => c + 1);
            toast.success("Material agregado a la receta");
            router.refresh();
        } else {
            toast.error(result.error || "Error al agregar material");
        }
    }, [recipeId, router]);

    const handleAcceptLabor = useCallback(async (labor: AIRecipeSuggestedLabor) => {
        if (!labor.catalogId) return;

        const result = await addRecipeLabor({
            recipe_id: recipeId,
            labor_type_id: labor.catalogId,
            quantity: labor.quantity,
            unit_id: null,
            notes: null,
        });

        if (result.success) {
            setAddedCount((c) => c + 1);
            toast.success("Mano de obra agregada a la receta");
            router.refresh();
        } else {
            toast.error(result.error || "Error al agregar mano de obra");
        }
    }, [recipeId, router]);

    const handleMaterialCreated = useCallback(async (catalogId: string, _name: string, original: AIRecipeSuggestedMaterial) => {
        const result = await addRecipeMaterial({
            recipe_id: recipeId,
            material_id: catalogId,
            quantity: original.quantity,
            waste_percentage: original.wastePercentage,
            unit_id: null,
            notes: null,
        });

        if (result.success) {
            setAddedCount((c) => c + 1);
            toast.success("Material creado y agregado a la receta");
            router.refresh();
        } else {
            toast.error(result.error || "Error al agregar material");
        }
    }, [recipeId, router]);

    const handleLaborCreated = useCallback(async (catalogId: string, _name: string, original: AIRecipeSuggestedLabor) => {
        const result = await addRecipeLabor({
            recipe_id: recipeId,
            labor_type_id: catalogId,
            quantity: original.quantity,
            unit_id: null,
            notes: null,
        });

        if (result.success) {
            setAddedCount((c) => c + 1);
            toast.success("Tipo de MO creado y agregado a la receta");
            router.refresh();
        } else {
            toast.error(result.error || "Error al agregar mano de obra");
        }
    }, [recipeId, router]);

    // ========================================================================
    // Handle suggestion change from panel
    // ========================================================================

    const handleSuggestionChange = useCallback((suggestion: AIRecipeSuggestion | null) => {
        suggestionRef.current = suggestion;
        setHasSuggestion(!!suggestion);
    }, []);

    // ========================================================================
    // Panel submit handler — dual behavior based on state
    // ========================================================================

    const handleSubmit = useCallback(async () => {
        // State 1: No suggestion yet → trigger the AI
        if (!suggestionRef.current) {
            panelRef.current?.suggest();
            return;
        }

        // State 2: Suggestion exists → add all matched items and close
        const suggestion = suggestionRef.current;

        // Block if there are unmatched items (not created yet)
        const unmatchedMaterials = suggestion.materials.filter(m => !m.catalogId).length;
        const unmatchedLabor = suggestion.labor.filter(l => !l.catalogId).length;
        const totalUnmatched = unmatchedMaterials + unmatchedLabor;

        if (totalUnmatched > 0) {
            toast.warning(
                `Hay ${totalUnmatched} recurso${totalUnmatched > 1 ? "s" : ""} que no existe${totalUnmatched > 1 ? "n" : ""} en tu catálogo. Crealos antes de agregar.`
            );
            return;
        }
        setSubmitting(true);
        let added = 0;

        try {
            for (const mat of suggestion.materials) {
                if (mat.catalogId) {
                    const result = await addRecipeMaterial({
                        recipe_id: recipeId,
                        material_id: mat.catalogId,
                        quantity: mat.quantity,
                        waste_percentage: mat.wastePercentage,
                        unit_id: null,
                        notes: null,
                    });
                    if (result.success) added++;
                }
            }

            for (const lab of suggestion.labor) {
                if (lab.catalogId) {
                    const result = await addRecipeLabor({
                        recipe_id: recipeId,
                        labor_type_id: lab.catalogId,
                        quantity: lab.quantity,
                        unit_id: null,
                        notes: null,
                    });
                    if (result.success) added++;
                }
            }

            if (added > 0) {
                toast.success(`${added} recurso${added > 1 ? "s" : ""} agregado${added > 1 ? "s" : ""} a la receta`);
                router.refresh();
            } else {
                toast.info("No hay recursos matcheados para agregar");
            }

            closePanel();
        } catch {
            toast.error("Error al agregar recursos");
        } finally {
            setSubmitting(false);
        }
    }, [recipeId, router, closePanel, setSubmitting]);


    // ========================================================================
    // Render
    // ========================================================================

    return (
        <form
            id={formId}
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="space-y-4"
        >

            {/* Texto introductorio */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                La IA analiza la tarea, su unidad de medida y tu catálogo de materiales y mano de obra para sugerir una receta completa con cantidades estimadas. Podés agregar contexto como la zona climática, tipo de edificación o especificaciones técnicas para obtener resultados más precisos.
            </p>

            {/* Contexto libre — plain textarea sin label */}
            <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="Contexto adicional (opcional): zona costera, alta humedad, edificio en altura..."
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />

            {/* Info sutil de tokens + link a configuración */}
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Cada sugerencia consume créditos de IA de tu plan.{" "}
                <Link
                    href="/settings/ai"
                    className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
                    onClick={() => closePanel()}
                >
                    Ver consumo y límites
                </Link>
            </p>

            {/* Panel de sugerencia — callbacks conectados directamente a las actions */}
            <RecipeSuggestionPanel
                ref={panelRef}
                taskName={taskContext.name}
                taskUnit={taskContext.unit}
                taskDivision={taskContext.division}
                taskAction={taskContext.action}
                taskElement={taskContext.element}
                parameterValues={taskContext.parameterValues}
                userContext={userContext || null}
                organizationId={taskContext.organizationId}
                catalogMaterials={taskContext.catalogMaterials}
                catalogLaborTypes={taskContext.catalogLaborTypes}
                onAcceptMaterial={handleAcceptMaterial}
                onAcceptLabor={handleAcceptLabor}
                onMaterialCreated={handleMaterialCreated}
                onLaborCreated={handleLaborCreated}
                onSuggestionChange={handleSuggestionChange}
            />

            {/* Feedback counter */}
            {addedCount > 0 && (
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        {addedCount} recurso{addedCount > 1 ? "s" : ""} agregado{addedCount > 1 ? "s" : ""} a la receta
                    </p>
                </div>
            )}
        </form>
    );
}
