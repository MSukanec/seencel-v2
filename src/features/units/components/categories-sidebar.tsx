"use client";

import { useState, useMemo } from "react";
import { Layers, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { UnitCategory } from "../queries";

// Re-export the type for use in other files
export type { UnitCategory };

interface CategoriesSidebarProps {
    categories: UnitCategory[];
    unitCounts: Record<string, number>;
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    totalUnits: number;
}

// ============================================================================
// Component
// ============================================================================

export function CategoriesSidebar({
    categories,
    unitCounts,
    selectedCategoryId,
    onSelectCategory,
    totalUnits,
}: CategoriesSidebarProps) {
    // Toggle select: click again to deselect
    const handleSelect = (categoryId: string | null) => {
        if (categoryId === selectedCategoryId) {
            onSelectCategory(null); // Deselect → back to "all"
        } else {
            onSelectCategory(categoryId);
        }
    };

    // Sort categories by name
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All Units option */}
            <CategoryItem
                name="Todas"
                count={totalUnits}
                isSelected={selectedCategoryId === null}
                onClick={() => onSelectCategory(null)}
                isAllCategories
            />

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Category list */}
            <div className="space-y-0.5">
                {sortedCategories.map((category) => (
                    <CategoryItem
                        key={category.id}
                        name={category.name}
                        code={category.code}
                        count={unitCounts[category.id] || 0}
                        isSelected={selectedCategoryId === category.id}
                        onClick={() => handleSelect(category.id)}
                    />
                ))}

                {/* Sin Categoría */}
                {unitCounts["sin-categoria"] > 0 && (
                    <CategoryItem
                        name="Sin categoría"
                        count={unitCounts["sin-categoria"]}
                        isSelected={selectedCategoryId === "sin-categoria"}
                        onClick={() => handleSelect("sin-categoria")}
                    />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Category Item Component
// ============================================================================

interface CategoryItemProps {
    name: string;
    code?: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    isAllCategories?: boolean;
}

function CategoryItem({ name, code, count, isSelected, onClick, isAllCategories }: CategoryItemProps) {
    return (
        <button
            onClick={onClick}
            title={name}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-foreground"
            )}
        >
            {isAllCategories && <Layers className="h-4 w-4 shrink-0" />}
            {!isAllCategories && <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />}

            <span className="flex-1 truncate">
                {name}
            </span>

            <Badge
                variant="secondary"
                className={cn(
                    "text-xs h-5 min-w-[1.5rem] justify-center",
                    isSelected && "bg-primary/20"
                )}
            >
                {count}
            </Badge>
        </button>
    );
}
