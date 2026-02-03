"use client";

import { useState, useMemo } from "react";
import { Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MaterialCategory } from "../types";

interface CategoriesSidebarProps {
    categories: MaterialCategory[];
    materialCounts: Record<string, number>;
    selectedCategoryId: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    totalMaterials: number;
}

// ============================================================================
// Build hierarchical tree with numbering
// ============================================================================

interface CategoryNode extends MaterialCategory {
    children: CategoryNode[];
    number: string; // "1", "2", "1.1", "1.2", etc.
}

function buildCategoryTree(categories: MaterialCategory[]): CategoryNode[] {
    // Sort by name
    const sorted = [...categories].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );

    // Create map for quick lookup
    const nodeMap = new Map<string, CategoryNode>();
    sorted.forEach(c => {
        nodeMap.set(c.id, { ...c, children: [], number: "" });
    });

    // Build tree structure
    const roots: CategoryNode[] = [];
    sorted.forEach(c => {
        const node = nodeMap.get(c.id)!;
        if (c.parent_id && nodeMap.has(c.parent_id)) {
            nodeMap.get(c.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // Assign numbers recursively
    function assignNumbers(nodes: CategoryNode[], prefix: string = "") {
        nodes.forEach((node, index) => {
            node.number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
            assignNumbers(node.children, node.number);
        });
    }
    assignNumbers(roots);

    return roots;
}

// Flatten tree for rendering
function flattenTree(nodes: CategoryNode[], depth: number = 0): { node: CategoryNode; depth: number }[] {
    const result: { node: CategoryNode; depth: number }[] = [];
    nodes.forEach(node => {
        result.push({ node, depth });
        result.push(...flattenTree(node.children, depth + 1));
    });
    return result;
}

// ============================================================================
// Component
// ============================================================================

export function CategoriesSidebar({
    categories,
    materialCounts,
    selectedCategoryId,
    onSelectCategory,
    totalMaterials,
}: CategoriesSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Build tree with numbering
    const flatList = useMemo(() => {
        const tree = buildCategoryTree(categories);
        return flattenTree(tree);
    }, [categories]);

    // Filter by search
    const filteredList = useMemo(() => {
        if (!searchQuery.trim()) return flatList;
        const query = searchQuery.toLowerCase();
        return flatList.filter(({ node }) =>
            node.name.toLowerCase().includes(query) ||
            node.number.includes(query)
        );
    }, [flatList, searchQuery]);

    // Toggle select: click again to deselect
    const handleSelect = (categoryId: string | null) => {
        if (categoryId === selectedCategoryId) {
            onSelectCategory(null); // Deselect → back to "all"
        } else {
            onSelectCategory(categoryId);
        }
    };

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All Materials option */}
            <CategoryItem
                name="Todos"
                count={totalMaterials}
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

            {/* Category list with hierarchy */}
            <div className="pt-1 space-y-0.5">
                {filteredList.map(({ node, depth }) => (
                    <CategoryItem
                        key={node.id}
                        name={node.name}
                        number={node.number}
                        count={materialCounts[node.id] || 0}
                        depth={depth}
                        isSelected={selectedCategoryId === node.id}
                        onClick={() => handleSelect(node.id)}
                    />
                ))}

                {/* Sin Categoría */}
                {!searchQuery && materialCounts["sin-categoria"] > 0 && (
                    <CategoryItem
                        name="Sin categoría"
                        count={materialCounts["sin-categoria"]}
                        isSelected={selectedCategoryId === "sin-categoria"}
                        onClick={() => handleSelect("sin-categoria")}
                    />
                )}

                {filteredList.length === 0 && searchQuery && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Sin resultados
                    </p>
                )}
            </div>
        </div>
    );
}

interface CategoryItemProps {
    name: string;
    number?: string;
    count: number;
    depth?: number;
    isSelected: boolean;
    onClick: () => void;
    isAllItems?: boolean;
}

function CategoryItem({ name, number, count, depth = 0, isSelected, onClick, isAllItems }: CategoryItemProps) {
    const compactLabel = name.slice(0, 2).toUpperCase();
    const isChild = depth > 0;

    return (
        <button
            onClick={onClick}
            title={name}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-foreground",
                isChild && "pl-4"
            )}
        >
            {isAllItems && <Layers className="h-4 w-4 shrink-0" />}

            {number && (
                <span className={cn(
                    "shrink-0 text-muted-foreground font-mono text-xs",
                    isChild && "text-muted-foreground/70",
                    "[[data-compact=true]_&]:hidden"
                )}>
                    {isChild && "└ "}{number}
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
