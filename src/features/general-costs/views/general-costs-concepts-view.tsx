"use client";

/**
 * General Costs — Concepts View (Accordion)
 *
 * Groups concepts by category in collapsible accordions.
 * Each accordion header shows: category name, concept count, total spent.
 * Each section has a "+" button to create a concept in that category.
 * Concepts without category appear in a "Sin categoría" section at the bottom.
 * Empty categories are shown with a minimal empty state.
 */

import { useMemo, useCallback } from "react";
import { Plus, FileText, FolderOpen, Layers, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { SearchButton } from "@/components/shared/toolbar-controls";
import { useTableFilters } from "@/hooks/use-table-filters";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePanel } from "@/stores/panel-store";
import { useTableActions } from "@/hooks/use-table-actions";
import { deleteGeneralCost, deleteGeneralCostCategory } from "../actions";
import { GeneralCost, GeneralCostCategory } from "../types";
import { GeneralCostListItem } from "@/components/shared/list-item/items/general-cost-list-item";
import type { ConceptPaymentStats } from "@/components/shared/list-item/items/general-cost-list-item";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────

interface GeneralCostsConceptsViewProps {
    data: GeneralCost[];
    conceptStats: Record<string, ConceptPaymentStats>;
    categories: GeneralCostCategory[];
    organizationId: string;
}

// ─── Grouping ────────────────────────────────────────────

interface CategoryGroup {
    id: string;
    name: string;
    isUncategorized: boolean;
    concepts: GeneralCost[];
    totalAmount: number;
}

function buildCategoryGroups(
    concepts: GeneralCost[],
    categories: GeneralCostCategory[],
    stats: Record<string, ConceptPaymentStats>
): CategoryGroup[] {
    // Start with all categories (even empty ones)
    const groups = new Map<string, CategoryGroup>();

    for (const cat of categories) {
        groups.set(cat.id, {
            id: cat.id,
            name: cat.name,
            isUncategorized: false,
            concepts: [],
            totalAmount: 0,
        });
    }

    // Uncategorized bucket
    const uncatId = "__uncategorized__";
    groups.set(uncatId, {
        id: uncatId,
        name: "Sin categoría",
        isUncategorized: true,
        concepts: [],
        totalAmount: 0,
    });

    // Assign concepts to groups
    for (const concept of concepts) {
        const catId = concept.category_id || uncatId;
        const group = groups.get(catId);
        if (group) {
            group.concepts.push(concept);
            group.totalAmount += stats[concept.id]?.total_amount || 0;
        } else {
            // Category deleted? Put in uncategorized
            const uncat = groups.get(uncatId)!;
            uncat.concepts.push(concept);
            uncat.totalAmount += stats[concept.id]?.total_amount || 0;
        }
    }

    // Sort: alphabetical, uncategorized last. Remove uncategorized if empty.
    const result = Array.from(groups.values())
        .filter(g => !g.isUncategorized || g.concepts.length > 0)
        .sort((a, b) => {
            if (a.isUncategorized) return 1;
            if (b.isUncategorized) return -1;
            return a.name.localeCompare(b.name);
        });

    return result;
}

function formatGroupTotal(amount: number): string {
    if (amount === 0) return "";
    return `$${Math.abs(amount).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Component ───────────────────────────────────────────

export function GeneralCostsConceptsView({ data, conceptStats, categories, organizationId }: GeneralCostsConceptsViewProps) {
    const { openPanel } = usePanel();

    // ─── Filters ─────────────────────────────────────────
    const filters = useTableFilters({});

    // ─── Delete actions (concepts) ──────────────────────
    const { handleDelete, DeleteConfirmDialog } = useTableActions<GeneralCost>({
        onDelete: async (item) => {
            try {
                await deleteGeneralCost(item.id);
                toast.success("Concepto eliminado");
                return { success: true };
            } catch {
                toast.error("Error al eliminar el concepto");
                return { success: false };
            }
        },
        entityName: "concepto",
        entityNamePlural: "conceptos",
    });

    // ─── Delete actions (categories) ──────────────────────
    const {
        handleDelete: handleDeleteCategory,
        DeleteConfirmDialog: DeleteCategoryDialog,
    } = useTableActions<GeneralCostCategory>({
        onDelete: async (cat) => {
            // Guard: prevent deleting categories with concepts
            const conceptsInCategory = data.filter(c => c.category_id === cat.id);
            if (conceptsInCategory.length > 0) {
                toast.error(`No se puede eliminar "${cat.name}" porque tiene ${conceptsInCategory.length} concepto(s) asociados`);
                return { success: false };
            }
            try {
                await deleteGeneralCostCategory(cat.id);
                toast.success("Categoría eliminada");
                return { success: true };
            } catch {
                toast.error("Error al eliminar la categoría");
                return { success: false };
            }
        },
        entityName: "categoría",
        entityNamePlural: "categorías",
    });

    // ─── Handlers ────────────────────────────────────────
    const handleCreate = (preSelectedCategoryId?: string) => {
        openPanel('general-cost-concept-form', {
            organizationId,
            categories,
            ...(preSelectedCategoryId && preSelectedCategoryId !== "__uncategorized__"
                ? { initialData: { category_id: preSelectedCategoryId } }
                : {}
            ),
        });
    };

    const handleEdit = (concept: GeneralCost) => {
        openPanel('general-cost-concept-form', {
            organizationId,
            categories,
            initialData: concept,
        });
    };

    const handleCreateCategory = () => {
        openPanel('general-cost-category-form', {
            organizationId,
        });
    };

    const handleEditCategory = (cat: GeneralCostCategory) => {
        openPanel('general-cost-category-form', {
            organizationId,
            initialData: cat,
        });
    };

    const handleConceptClick = useCallback((concept: GeneralCost) => {
        openPanel('general-cost-concept-detail', {
            concept,
            stats: conceptStats[concept.id],
            organizationId,
        });
    }, [conceptStats, organizationId, openPanel]);

    // ─── Filtered data ───────────────────────────────────
    const filteredData = useMemo(() => {
        if (!filters.searchQuery) return data;
        const q = filters.searchQuery.toLowerCase();
        return data.filter(c => c.name.toLowerCase().includes(q));
    }, [data, filters.searchQuery]);

    // ─── Groups ──────────────────────────────────────────
    const categoryGroups = useMemo(() => {
        const groups = buildCategoryGroups(filteredData, categories, conceptStats);
        // When searching, hide empty categories
        if (filters.searchQuery) return groups.filter(g => g.concepts.length > 0);
        return groups;
    }, [filteredData, categories, conceptStats, filters.searchQuery]);

    // All accordion values (open by default)
    const allGroupIds = useMemo(
        () => categoryGroups.map(g => g.id),
        [categoryGroups]
    );

    // Grand total for percentage calculation
    const grandTotal = useMemo(
        () => categoryGroups.reduce((sum, g) => sum + g.totalAmount, 0),
        [categoryGroups]
    );

    // ─── Toolbar config ───────────────────────────────────
    const toolbarActions = [
        { label: "Nuevo Concepto", icon: Plus, onClick: () => handleCreate() },
        { label: "Nueva Categoría", icon: FolderPlus, onClick: handleCreateCategory },
    ];

    // ─── Empty state ─────────────────────────────────────
    if (data.length === 0 && categories.length === 0) {
        return (
            <>
                <Toolbar portalToHeader actions={toolbarActions} />
                <ViewEmptyState
                    mode="empty"
                    icon={FileText}
                    viewName="Conceptos de Gasto"
                    featureDescription="Definí los tipos de gastos recurrentes o eventuales de tu organización."
                    onAction={() => handleCreate()}
                    actionLabel="Nuevo Concepto"
                />
            </>
        );
    }

    // ─── No results ──────────────────────────────────────
    if (filteredData.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    leftActions={
                        <SearchButton filters={filters} placeholder="Buscar conceptos..." />
                    }
                    actions={toolbarActions}
                />
                <ViewEmptyState
                    mode="no-results"
                    icon={FileText}
                    viewName="Conceptos"
                    onResetFilters={filters.clearAll}
                />
            </>
        );
    }

    // ─── Render ──────────────────────────────────────────
    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <SearchButton filters={filters} placeholder="Buscar conceptos..." />
                }
                actions={toolbarActions}
            />

            <Accordion
                type="multiple"
                defaultValue={allGroupIds}
                className="w-full py-2"
            >
                {categoryGroups.map((group) => (
                    <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="border-b-0 mb-3"
                    >
                        {/* ── Accordion Header ── */}
                        <AccordionTrigger className="hover:no-underline px-4 py-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors [&[data-state=open]]:rounded-b-none [&[data-state=open]]:border-b-0">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {group.isUncategorized ? (
                                    <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <span className="font-medium text-base truncate">{group.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {group.concepts.length} concepto{group.concepts.length !== 1 ? "s" : ""}
                                </span>
                                {group.totalAmount > 0 && (
                                    <span className="ml-auto mr-2 text-base font-mono font-semibold text-foreground shrink-0">
                                        {formatGroupTotal(group.totalAmount)}
                                    </span>
                                )}
                                {group.totalAmount > 0 && grandTotal > 0 && (
                                    <span className="text-base font-mono font-semibold text-foreground shrink-0">
                                        {Math.round((group.totalAmount / grandTotal) * 100)}%
                                    </span>
                                )}
                            </div>
                            {/* Category actions — outside content div, always before chevron */}
                            {!group.isUncategorized && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="inline-flex items-center justify-center h-7 w-7 shrink-0 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Acciones de categoría</span>
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const cat = categories.find(c => c.id === group.id);
                                                if (cat) handleEditCategory(cat);
                                            }}
                                            className="text-xs gap-2"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Editar categoría
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const cat = categories.find(c => c.id === group.id);
                                                if (cat) handleDeleteCategory(cat);
                                            }}
                                            className="text-xs gap-2 text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Eliminar categoría
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </AccordionTrigger>

                        {/* ── Accordion Body ── */}
                        <AccordionContent className="px-0 pb-0 border border-t-0 rounded-b-lg bg-card/50">
                            <div className="p-3 space-y-1.5">
                                {group.concepts.length === 0 ? (
                                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground/60">
                                        <span>Sin conceptos en esta categoría</span>
                                    </div>
                                ) : (
                                    group.concepts.map((concept) => (
                                        <GeneralCostListItem
                                            key={concept.id}
                                            concept={concept}
                                            stats={conceptStats[concept.id]}
                                            onClick={handleConceptClick}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}

                                {/* ── Add concept button per section ── */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreate(group.id);
                                    }}
                                    className="w-full h-9 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 rounded-md mt-1"
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Nuevo Concepto
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <DeleteConfirmDialog />
            <DeleteCategoryDialog />
        </>
    );
}
