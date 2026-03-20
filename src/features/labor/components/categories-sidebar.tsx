/**
 * CategoriesSidebar — Labor category filter sidebar
 *
 * Shows a filterable list of labor categories (oficios) with counts.
 * Pattern identical to DivisionsSidebar in tasks.
 */

"use client";

import { useState, useMemo } from "react";
import { Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CategoryItem {
    id: string;
    name: string;
}

interface CategoriesSidebarProps {
    categories: CategoryItem[];
    categoryCounts: Record<string, number>;
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    totalItems: number;
}

export function CategoriesSidebar({
    categories,
    categoryCounts,
    selectedCategoryId,
    onSelectCategory,
    totalItems,
}: CategoriesSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Sort alphabetically
    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => a.name.localeCompare(b.name, "es"));
    }, [categories]);

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
            <button
                onClick={() => onSelectCategory(null)}
                className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                    selectedCategoryId === null
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-foreground"
                )}
            >
                <Layers className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">Todos</span>
                <Badge
                    variant="secondary"
                    className={cn(
                        "text-xs h-5 min-w-[1.5rem] justify-center",
                        selectedCategoryId === null && "bg-primary/20"
                    )}
                >
                    {totalItems}
                </Badge>
            </button>

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
                {filteredCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => handleSelect(category.id)}
                        title={category.name}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                            selectedCategoryId === category.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted/50 text-foreground"
                        )}
                    >
                        <span className="flex-1 truncate">{category.name}</span>
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs h-5 min-w-[1.5rem] justify-center",
                                selectedCategoryId === category.id && "bg-primary/20"
                            )}
                        >
                            {categoryCounts[category.id] || 0}
                        </Badge>
                    </button>
                ))}

                {filteredCategories.length === 0 && searchQuery && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Sin resultados
                    </p>
                )}
            </div>
        </div>
    );
}
