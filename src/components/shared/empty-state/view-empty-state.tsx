"use client";

import { LucideIcon, BookOpen, RotateCcw, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface ViewEmptyStateProps {
    /**
     * Mode determines which variant to display:
     * - "empty": No data exists (initial state)
     * - "no-results": Filters applied but no matches
     * - "context-empty": Data exists in org but not in the selected project
     */
    mode: "empty" | "no-results" | "context-empty";

    /** Icon representing the page/feature */
    icon: LucideIcon;

    /** Name of the view (e.g., "Materiales", "Pagos") */
    viewName: string;

    /** 
     * Only for mode="empty": Extensive description of the feature
     * Should explain what this section is for and guide the user
     * Can be a string or JSX for more complex descriptions with links
     */
    featureDescription?: React.ReactNode;

    /**
     * Only for mode="empty" and "context-empty": Primary action callback
     */
    onAction?: () => void;

    /**
     * Only for mode="empty" and "context-empty": Label for the action button
     */
    actionLabel?: string;

    /**
     * Only for mode="empty": Icon for the action button (defaults to Plus)
     */
    actionIcon?: LucideIcon;

    /**
     * Only for mode="empty": Path to documentation page
     * Should be a route defined in i18n/routing.ts (e.g., "/docs/materiales")
     * Opens in a new tab by default
     */
    docsPath?: "/docs/materiales" | "/docs/contactos" | "/docs/finanzas" | "/docs/tareas" | "/docs/mano-de-obra" | "/docs/documentacion/introduccion" | string;

    /**
     * Only for mode="no-results": Callback to reset filters
     */
    onResetFilters?: () => void;

    /**
     * Optional: Custom filter description for no-results mode
     */
    filterContext?: string;

    /**
     * Only for mode="context-empty": Name of the active project
     */
    projectName?: string;

    /**
     * Only for mode="context-empty": Callback to switch to org context (clear project filter)
     */
    onSwitchToOrg?: () => void;

    className?: string;
}

/**
 * ViewEmptyState - Standardized empty state component
 * 
 * Three modes:
 * 1. "empty" - When no data exists in the view (onboarding state)
 * 2. "no-results" - When filters don't find matches
 * 3. "context-empty" - When data exists in org but not in the selected project
 * 
 * @example
 * // Empty view (no data)
 * <ViewEmptyState
 *   mode="empty"
 *   icon={Package}
 *   viewName="Materiales"
 *   featureDescription="Los materiales son los insumos y productos..."
 *   onAction={handleCreate}
 *   actionLabel="Nuevo Material"
 *   docsPath="/docs/materiales"
 * />
 * 
 * @example
 * // No results (filters active)
 * <ViewEmptyState
 *   mode="no-results"
 *   icon={Package}
 *   viewName="Materiales"
 *   onResetFilters={handleReset}
 * />
 * 
 * @example
 * // Context empty (project has no data)
 * <ViewEmptyState
 *   mode="context-empty"
 *   icon={FolderOpen}
 *   viewName="documentos"
 *   projectName="Centro de Día Caldén"
 *   onAction={handleCreate}
 *   actionLabel="Subir Documento"
 *   onSwitchToOrg={() => setActiveProjectId(null)}
 * />
 */
export function ViewEmptyState({
    mode,
    icon: Icon,
    viewName,
    featureDescription,
    onAction,
    actionLabel,
    actionIcon: ActionIcon = Plus,
    docsPath,
    onResetFilters,
    filterContext,
    projectName,
    onSwitchToOrg,
    className,
}: ViewEmptyStateProps) {
    const isEmptyMode = mode === "empty";
    const isContextEmpty = mode === "context-empty";

    // Titles
    const title = isEmptyMode
        ? viewName
        : isContextEmpty
            ? `No hay ${viewName.toLowerCase()} en ${projectName || "este proyecto"}`
            : "Sin resultados";

    // Descriptions
    const description = isEmptyMode
        ? featureDescription
        : isContextEmpty
            ? `Este proyecto aún no tiene ${viewName.toLowerCase()} vinculados. Podés crear uno nuevo o ver todos los ${viewName.toLowerCase()} de la organización.`
            : filterContext
                ? `No se encontraron ${viewName.toLowerCase()} ${filterContext}.`
                : `No se encontraron ${viewName.toLowerCase()} con los filtros aplicados.`;

    return (
        <div
            className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-h-0 h-full p-8 text-center animate-in fade-in-50 zoom-in-95 duration-500 overflow-hidden",
                "border-2 border-dashed border-primary/25 rounded-xl",
                className
            )}
        >
            {/* Background Pattern: Diagonal Hatching */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 10px,
                        currentColor 10px,
                        currentColor 12px
                    )`
                }}
            />

            {/* Accent Gradient Blur */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Icon */}
            <div className="relative mb-6 z-10">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-card to-muted border border-border shadow-sm animate-[bounce_3s_infinite] rotate-3 hover:rotate-6 transition-transform duration-500">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md" />
                    <Icon className="relative h-10 w-10 text-primary/80" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-primary/20 rounded-md animate-[spin_8s_linear_infinite]" />
                </div>
            </div>

            {/* Title */}
            <h3 className="relative z-10 text-xl font-bold tracking-tight text-foreground/90">
                {title}
            </h3>

            {/* Description */}
            <p className="relative z-10 mt-2 mb-6 text-base text-muted-foreground max-w-lg leading-relaxed">
                {description}
            </p>

            {/* Actions */}
            <div className="relative z-10 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-700 delay-150">
                {isEmptyMode ? (
                    <>
                        {/* Primary Action */}
                        {onAction && actionLabel && (
                            <Button onClick={onAction}>
                                <ActionIcon className="mr-2 h-4 w-4" />
                                {actionLabel}
                            </Button>
                        )}

                        {/* Documentation Link - Always opens in new tab */}
                        {docsPath && (
                            <Button variant="outline" asChild>
                                <Link
                                    href={docsPath as any}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Documentación
                                </Link>
                            </Button>
                        )}
                    </>
                ) : isContextEmpty ? (
                    <>
                        {/* Primary Action (create in this project) */}
                        {onAction && actionLabel && (
                            <Button onClick={onAction}>
                                <ActionIcon className="mr-2 h-4 w-4" />
                                {actionLabel}
                            </Button>
                        )}

                        {/* Switch to Org context */}
                        {onSwitchToOrg && (
                            <Button variant="outline" onClick={onSwitchToOrg}>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Ver todos
                            </Button>
                        )}
                    </>
                ) : (
                    /* Reset Filters */
                    onResetFilters && (
                        <Button variant="outline" onClick={onResetFilters}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Limpiar filtros
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}

export default ViewEmptyState;

