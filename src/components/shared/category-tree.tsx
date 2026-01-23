"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    FolderOpen,
    Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface CategoryItem {
    id: string;
    name: string | null;
    parent_id: string | null;
}

interface CategoryTreeProps {
    items: CategoryItem[];
    /** Called when user clicks "Agregar subcategoría" - parent handles the modal */
    onAddClick: (parentId: string | null) => void;
    /** Called when user clicks "Editar" - parent handles the modal */
    onEditClick: (category: CategoryItem) => void;
    /** Called when user clicks "Eliminar" - parent handles the modal */
    onDeleteClick: (category: CategoryItem) => void;
    emptyMessage?: string;
    /** Show drag handles (for future drag & drop support) */
    showDragHandle?: boolean;
}

// ============================================================================
// Helper: Build tree structure from flat list
// ============================================================================

interface TreeNode extends CategoryItem {
    children: TreeNode[];
}

function buildTree(items: CategoryItem[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create all nodes
    for (const item of items) {
        map.set(item.id, { ...item, children: [] });
    }

    // Second pass: build parent-child relationships
    for (const item of items) {
        const node = map.get(item.id)!;
        if (item.parent_id && map.has(item.parent_id)) {
            map.get(item.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    }

    // Sort children alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
            .map(node => ({ ...node, children: sortNodes(node.children) }));
    };

    return sortNodes(roots);
}

// ============================================================================
// CategoryTree Component
// ============================================================================

export function CategoryTree({
    items,
    onAddClick,
    onEditClick,
    onDeleteClick,
    emptyMessage = "No hay categorías",
    showDragHandle = false
}: CategoryTreeProps) {
    // Accordion behavior: only one expanded per depth level
    // Key = depth level, Value = expanded node id at that level
    const [expandedByLevel, setExpandedByLevel] = useState<Map<number, string>>(new Map());

    const tree = useMemo(() => buildTree(items), [items]);

    const toggleExpanded = (id: string, depth: number) => {
        setExpandedByLevel(prev => {
            const newMap = new Map(prev);
            const currentExpanded = newMap.get(depth);

            if (currentExpanded === id) {
                // Collapsing this node - also collapse all deeper levels
                newMap.delete(depth);
                // Remove all levels deeper than this one
                for (const [level] of newMap) {
                    if (level > depth) {
                        newMap.delete(level);
                    }
                }
            } else {
                // Expanding a different node at this level
                // First, collapse all deeper levels since we're switching parent
                for (const [level] of newMap) {
                    if (level > depth) {
                        newMap.delete(level);
                    }
                }
                // Now expand this node
                newMap.set(depth, id);
            }

            return newMap;
        });
    };

    const renderNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedByLevel.get(depth) === node.id;
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.id} className={cn(depth > 0 && "ml-6")}>
                {/* Category Card */}
                <Card
                    className={cn(
                        "group cursor-pointer hover:shadow-md transition-all mb-2",
                        isExpanded && "border-primary/50 shadow-md"
                    )}
                    onClick={() => hasChildren && toggleExpanded(node.id, depth)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            {/* Expand/Collapse Icon */}
                            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground">
                                {hasChildren ? (
                                    isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                                ) : (
                                    <span className="w-5" />
                                )}
                            </div>

                            {/* Folder Icon - Primary color when expanded */}
                            {isExpanded && hasChildren ? (
                                <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                                <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}

                            {/* Name with count inline */}
                            <span className="flex-1 font-medium">
                                {node.name || "Sin nombre"}
                                {hasChildren && (
                                    <span className="text-muted-foreground font-normal ml-1">
                                        ({node.children.length})
                                    </span>
                                )}
                            </span>

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onAddClick(node.id);
                                    }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar subcategoría
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        onEditClick(node);
                                    }}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteClick(node);
                                        }}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardContent>
                </Card>

                {/* Children */}
                {isExpanded && node.children.map(child => renderNode(child, depth + 1))}
            </div>
        );
    };

    if (tree.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">{emptyMessage}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-0">
            {tree.map(node => renderNode(node))}
        </div>
    );
}

