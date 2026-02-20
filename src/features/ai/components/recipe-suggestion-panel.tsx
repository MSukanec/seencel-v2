"use client";

import { useState, useTransition } from "react";
import {
    Wand2,
    Loader2,
    ChevronDown,
    ChevronUp,
    Package,
    HardHat,
    Sparkles,
    AlertTriangle,
    Check,
    Plus,
    CirclePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { suggestRecipe } from "@/features/ai/actions";
import { quickCreateMaterial, quickCreateLaborType, findUnitBySymbol } from "@/features/ai/ai-catalog-actions";
import type { AIRecipeSuggestion, AIRecipeSuggestedMaterial, AIRecipeSuggestedLabor } from "@/features/ai/types";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface RecipeSuggestionPanelProps {
    /** Nombre de la tarea para dar contexto a la IA */
    taskName: string;
    /** Unidad de medida de la tarea */
    taskUnit?: string | null;
    /** Rubro/división de la tarea */
    taskDivision?: string | null;
    /** Catálogo de materiales disponibles en la org */
    catalogMaterials?: { id: string; name: string; unit_symbol?: string | null }[];
    /** Catálogo de tipos de MO disponibles en la org */
    catalogLaborTypes?: { id: string; name: string; unit_symbol?: string | null }[];
    /** ID de la organización — requerido para crear items faltantes */
    organizationId?: string | null;
    /** Callback cuando el usuario acepta un material sugerido (ya existe en catálogo) */
    onAcceptMaterial?: (material: AIRecipeSuggestedMaterial) => void;
    /** Callback cuando el usuario acepta un tipo de MO sugerido (ya existe en catálogo) */
    onAcceptLabor?: (labor: AIRecipeSuggestedLabor) => void;
    /** Callback cuando el usuario acepta TODA la sugerencia */
    onAcceptAll?: (suggestion: AIRecipeSuggestion) => void;
    /**
     * Callback cuando se creó un material nuevo desde el panel.
     * Recibe el ID y nombre del material recién creado.
     */
    onMaterialCreated?: (id: string, name: string, originalSuggestion: AIRecipeSuggestedMaterial) => void;
    /**
     * Callback cuando se creó un tipo de MO nuevo desde el panel.
     */
    onLaborCreated?: (id: string, name: string, originalSuggestion: AIRecipeSuggestedLabor) => void;
}

const CONFIDENCE_CONFIG = {
    high: { label: "Alta confianza", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    medium: { label: "Confianza media", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    low: { label: "Baja confianza", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

// ============================================================================
// Main Component
// ============================================================================

export function RecipeSuggestionPanel({
    taskName,
    taskUnit,
    taskDivision,
    catalogMaterials,
    catalogLaborTypes,
    organizationId,
    onAcceptMaterial,
    onAcceptLabor,
    onAcceptAll,
    onMaterialCreated,
    onLaborCreated,
}: RecipeSuggestionPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [suggestion, setSuggestion] = useState<AIRecipeSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [acceptedMaterials, setAcceptedMaterials] = useState<Set<number>>(new Set());
    const [acceptedLabor, setAcceptedLabor] = useState<Set<number>>(new Set());

    const handleSuggest = () => {
        setError(null);
        setSuggestion(null);
        setAcceptedMaterials(new Set());
        setAcceptedLabor(new Set());
        setIsExpanded(true);

        startTransition(async () => {
            const result = await suggestRecipe({
                taskName,
                taskUnit,
                taskDivision,
                catalogMaterials,
                catalogLaborTypes,
            });

            if (result.success) {
                setSuggestion(result.data);
            } else {
                setError(result.error);
            }
        });
    };

    const handleAcceptMaterial = (material: AIRecipeSuggestedMaterial, index: number) => {
        setAcceptedMaterials((prev) => new Set([...prev, index]));
        onAcceptMaterial?.(material);
    };

    const handleAcceptLabor = (labor: AIRecipeSuggestedLabor, index: number) => {
        setAcceptedLabor((prev) => new Set([...prev, index]));
        onAcceptLabor?.(labor);
    };

    const handleMaterialCreated = (index: number, id: string, name: string, original: AIRecipeSuggestedMaterial) => {
        setAcceptedMaterials((prev) => new Set([...prev, index]));
        onMaterialCreated?.(id, name, original);
    };

    const handleLaborCreated = (index: number, id: string, name: string, original: AIRecipeSuggestedLabor) => {
        setAcceptedLabor((prev) => new Set([...prev, index]));
        onLaborCreated?.(id, name, original);
    };

    const handleAcceptAll = () => {
        if (!suggestion) return;
        // Solo aceptar los que ya tienen catalogId (los verdes)
        suggestion.materials.forEach((mat, i) => {
            if (mat.catalogId && !acceptedMaterials.has(i)) {
                handleAcceptMaterial(mat, i);
            }
        });
        suggestion.labor.forEach((lab, i) => {
            if (lab.catalogId && !acceptedLabor.has(i)) {
                handleAcceptLabor(lab, i);
            }
        });
        onAcceptAll?.(suggestion);
    };

    const confidenceConfig = suggestion ? CONFIDENCE_CONFIG[suggestion.confidence] : null;

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
                onClick={() => suggestion && setIsExpanded((p) => !p)}
            >
                <div className="flex items-center gap-2 flex-1">
                    <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        Sugerencia IA
                    </span>
                    {confidenceConfig && (
                        <Badge
                            variant="outline"
                            className={cn("text-[10px] h-5 px-1.5 border", confidenceConfig.className)}
                        >
                            {confidenceConfig.label}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!suggestion && !isPending && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSuggest();
                            }}
                            className="h-7 text-xs gap-1.5 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50"
                        >
                            <Wand2 className="h-3 w-3" />
                            Sugerir receta
                        </Button>
                    )}

                    {isPending && (
                        <div className="flex items-center gap-1.5 text-xs text-violet-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Calculando cantidades...</span>
                        </div>
                    )}

                    {suggestion && !isPending && (
                        <>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSuggest();
                                }}
                                className="h-7 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                            >
                                Regenerar
                            </Button>
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 pb-4">
                    <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-xs text-red-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Suggestion content */}
            {suggestion && isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Reasoning */}
                    {suggestion.reasoning && (
                        <p className="text-xs text-[var(--color-text-secondary)] italic leading-relaxed border-t border-[var(--color-border)] pt-3">
                            {suggestion.reasoning}
                        </p>
                    )}

                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                            En tu catálogo
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                            Crear en catálogo
                        </span>
                    </div>

                    {/* Materials */}
                    {suggestion.materials.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                                <Package className="h-3 w-3" />
                                Materiales
                            </div>
                            {suggestion.materials.map((mat, i) => (
                                <MaterialSuggestionItem
                                    key={i}
                                    material={mat}
                                    isAccepted={acceptedMaterials.has(i)}
                                    organizationId={organizationId}
                                    onAccept={() => handleAcceptMaterial(mat, i)}
                                    onCreated={(id, name) => handleMaterialCreated(i, id, name, mat)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Labor */}
                    {suggestion.labor.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                                <HardHat className="h-3 w-3" />
                                Mano de obra
                            </div>
                            {suggestion.labor.map((lab, i) => (
                                <LaborSuggestionItem
                                    key={i}
                                    labor={lab}
                                    isAccepted={acceptedLabor.has(i)}
                                    organizationId={organizationId}
                                    onAccept={() => handleAcceptLabor(lab, i)}
                                    onCreated={(id, name) => handleLaborCreated(i, id, name, lab)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Accept matched items */}
                    {onAcceptAll && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAcceptAll}
                            className="w-full h-8 text-xs gap-1.5 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50 mt-1"
                        >
                            <Plus className="h-3 w-3" />
                            Agregar todos los matcheados a la receta
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MaterialSuggestionItem
// ============================================================================

interface MaterialSuggestionItemProps {
    material: AIRecipeSuggestedMaterial;
    isAccepted: boolean;
    organizationId?: string | null;
    onAccept: () => void;
    onCreated: (id: string, name: string) => void;
}

function MaterialSuggestionItem({
    material,
    isAccepted,
    organizationId,
    onAccept,
    onCreated,
}: MaterialSuggestionItemProps) {
    const isMatched = !!material.catalogId;
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [nameOverride, setNameOverride] = useState(material.catalogName ?? material.name);

    const handleCreate = async () => {
        if (!organizationId) {
            toast.error("No se puede crear sin organización");
            return;
        }
        setIsCreating(true);
        try {
            // Intentar encontrar la unidad por símbolo
            const unitId = await findUnitBySymbol(material.unit);

            const result = await quickCreateMaterial({
                name: nameOverride.trim(),
                organizationId,
                unitId,
            });

            if (result.success && result.id && result.name) {
                toast.success(`Material "${result.name}" creado en el catálogo`);
                setShowCreateForm(false);
                onCreated(result.id, result.name);
            } else {
                toast.error(result.error ?? "Error al crear el material");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const displayName = material.catalogName ?? material.name;

    if (isAccepted) {
        return (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="flex-1 truncate text-emerald-400">{displayName}</span>
                <span className="text-emerald-400/60 shrink-0 tabular-nums">
                    {material.quantity} {material.unit}
                </span>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
            {/* Main row */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-stronger)]">
                <div
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMatched ? "bg-emerald-400" : "bg-amber-400")}
                />
                <span className="flex-1 truncate text-[var(--color-text-primary)]">{displayName}</span>
                {material.wastePercentage > 0 && (
                    <span className="text-[var(--color-text-tertiary)] shrink-0">
                        +{material.wastePercentage}% desp.
                    </span>
                )}
                <span className="text-[var(--color-text-secondary)] shrink-0 font-medium tabular-nums">
                    {material.quantity} {material.unit}
                </span>

                {isMatched ? (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 shrink-0 rounded text-[var(--color-text-tertiary)] hover:text-violet-400 hover:bg-violet-500/10"
                        onClick={onAccept}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "h-5 w-5 shrink-0 rounded",
                            showCreateForm
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-[var(--color-text-tertiary)] hover:text-amber-400 hover:bg-amber-500/10"
                        )}
                        onClick={() => setShowCreateForm((p) => !p)}
                        title="Crear en catálogo"
                    >
                        <CirclePlus className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Inline create form for unmatched items */}
            {!isMatched && showCreateForm && (
                <div className="px-3 py-2.5 bg-amber-500/5 border-t border-amber-500/15 flex items-center gap-2">
                    <Input
                        value={nameOverride}
                        onChange={(e) => setNameOverride(e.target.value)}
                        placeholder="Nombre en el catálogo..."
                        className="h-7 text-xs flex-1 border-amber-500/20 focus-visible:ring-amber-500/30"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-3 gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0"
                        onClick={handleCreate}
                        disabled={isCreating || !nameOverride.trim()}
                    >
                        {isCreating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Plus className="h-3 w-3" />
                        )}
                        Crear
                    </Button>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// LaborSuggestionItem
// ============================================================================

interface LaborSuggestionItemProps {
    labor: AIRecipeSuggestedLabor;
    isAccepted: boolean;
    organizationId?: string | null;
    onAccept: () => void;
    onCreated: (id: string, name: string) => void;
}

function LaborSuggestionItem({
    labor,
    isAccepted,
    organizationId,
    onAccept,
    onCreated,
}: LaborSuggestionItemProps) {
    const isMatched = !!labor.catalogId;
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [nameOverride, setNameOverride] = useState(labor.catalogName ?? labor.name);

    const handleCreate = async () => {
        if (!organizationId) {
            toast.error("No se puede crear sin organización");
            return;
        }
        setIsCreating(true);
        try {
            const unitId = await findUnitBySymbol(labor.unit);

            const result = await quickCreateLaborType({
                name: nameOverride.trim(),
                organizationId,
                unitId,
            });

            if (result.success && result.id && result.name) {
                toast.success(`Tipo de MO "${result.name}" creado en el catálogo`);
                setShowCreateForm(false);
                onCreated(result.id, result.name);
            } else {
                toast.error(result.error ?? "Error al crear el tipo de MO");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const displayName = labor.catalogName ?? labor.name;

    if (isAccepted) {
        return (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs bg-emerald-500/10 border border-emerald-500/20">
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="flex-1 truncate text-emerald-400">{displayName}</span>
                <span className="text-emerald-400/60 shrink-0 tabular-nums">
                    {labor.quantity} {labor.unit}
                </span>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 text-xs bg-[var(--color-bg-elevated)]">
                <div
                    className={cn("h-1.5 w-1.5 rounded-full shrink-0", isMatched ? "bg-emerald-400" : "bg-amber-400")}
                />
                <span className="flex-1 truncate text-[var(--color-text-primary)]">{displayName}</span>
                <span className="text-[var(--color-text-secondary)] shrink-0 font-medium tabular-nums">
                    {labor.quantity} {labor.unit}
                </span>

                {isMatched ? (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 shrink-0 rounded text-[var(--color-text-tertiary)] hover:text-violet-400 hover:bg-violet-500/10"
                        onClick={onAccept}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "h-5 w-5 shrink-0 rounded",
                            showCreateForm
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-[var(--color-text-tertiary)] hover:text-amber-400 hover:bg-amber-500/10"
                        )}
                        onClick={() => setShowCreateForm((p) => !p)}
                        title="Crear en catálogo"
                    >
                        <CirclePlus className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {!isMatched && showCreateForm && (
                <div className="px-3 py-2.5 bg-amber-500/5 border-t border-amber-500/15 flex items-center gap-2">
                    <Input
                        value={nameOverride}
                        onChange={(e) => setNameOverride(e.target.value)}
                        placeholder="Nombre en el catálogo..."
                        className="h-7 text-xs flex-1 border-amber-500/20 focus-visible:ring-amber-500/30"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-3 gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0"
                        onClick={handleCreate}
                        disabled={isCreating || !nameOverride.trim()}
                    >
                        {isCreating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Plus className="h-3 w-3" />
                        )}
                        Crear
                    </Button>
                </div>
            )}
        </div>
    );
}
