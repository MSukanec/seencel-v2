"use client";

import { useState, useMemo } from "react";
import { Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ============================================================================
// Types
// ============================================================================

export interface LaborCategoryItem {
    id: string;
    name: string;
}

interface LaborCategoriesSidebarProps {
    categories: LaborCategoryItem[];
    laborCounts: Record<string, number>;
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    totalLabor: number;
}

// ============================================================================
// Component
// ============================================================================

export function LaborCategoriesSidebar({
    categories,
    laborCounts,
    selectedCategoryId,
    onSelectCategory,
    totalLabor,
}: LaborCategoriesSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Sort categories alphabetically
    const sortedCategories = useMemo(() =>
        [...categories].sort((a, b) => a.name.localeCompare(b.name)),
        [categories]
    );

    // Filter by search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return sortedCategories;
        const query = searchQuery.toLowerCase();
        return sortedCategories.filter(c => c.name.toLowerCase().includes(query));
    }, [sortedCategories, searchQuery]);

    // Toggle select: click again to deselect
    const handleSelect = (categoryId: string | null) => {
        if (categoryId === selectedCategoryId) {
            onSelectCategory(null);
        } else {
            onSelectCategory(categoryId);
        }
    };

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All option */}
            <CategoryItem
                name="Todos"
                count={totalLabor}
                isSelected={selectedCategoryId === null}
                onClick={() => onSelectCategory(null)}
                isAllItems
            />

            {/* Search */}
            <div className="py-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-7 text-sm"
                    />
                </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Category list */}
            <div className="pt-1 space-y-0.5">
                {filteredCategories.map((category, index) => (
                    <CategoryItem
                        key={category.id}
                        name={category.name}
                        number={`${index + 1}`}
                        count={laborCounts[category.id] || 0}
                        isSelected={selectedCategoryId === category.id}
                        onClick={() => handleSelect(category.id)}
                    />
                ))}

                {/* Sin Categoría */}
                {!searchQuery && (laborCounts["sin-categoria"] || 0) > 0 && (
                    <CategoryItem
                        name="Sin categoría"
                        count={laborCounts["sin-categoria"]}
                        isSelected={selectedCategoryId === "sin-categoria"}
                        onClick={() => handleSelect("sin-categoria")}
                    />
                )}

                {filteredCategories.length === 0 && searchQuery && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Sin resultados
                    </p>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// CategoryItem
// ============================================================================

interface CategoryItemProps {
    name: string;
    number?: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    isAllItems?: boolean;
}

function CategoryItem({ name, number, count, isSelected, onClick, isAllItems }: CategoryItemProps) {
    const compactLabel = name.slice(0, 2).toUpperCase();

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
            {isAllItems && <Layers className="h-4 w-4 shrink-0" />}

            {number && (
                <span className={cn(
                    "shrink-0 text-muted-foreground font-mono text-xs",
                    "[[data-compact=true]_&]:hidden"
                )}>
                    {number}
                </span>
            )}

            <span className="flex-1 truncate [[data-compact=true]_&]:hidden">
                {name}
            </span>
            <span className="hidden [[data-compact=true]_&]:block text-center flex-1 font-medium">
                {compactLabel}
            </span>

            <Badge
                variant="secondary"
                className={cn(
                    "text-xs h-5 min-w-[1.5rem] justify-center [[data-compact=true]_&]:hidden",
                    isSelected && "bg-primary/20"
                )}
            >
                {count}
            </Badge>
        </button>
    );
}
