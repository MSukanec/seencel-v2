"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    FolderOpen,
    Folder,
    ExternalLink,
    GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
    DraggableProvided,
    DraggableStateSnapshot,
} from "@hello-pangea/dnd";

// ============================================================================
// Types
// ============================================================================

export interface CategoryItem {
    id: string;
    name: string | null;
    parent_id: string | null;
    order?: number | null; // For sorting by explicit order
    [key: string]: any; // Allow extra properties for custom rendering
}

interface CategoryTreeProps {
    items: CategoryItem[];
    /** Called when user clicks "Agregar subcategoría" - parent handles the modal */
    onAddClick?: (parentId: string | null) => void;
    /** Called when user clicks "Editar" - parent handles the modal */
    onEditClick?: (category: CategoryItem) => void;
    /** Called when user clicks "Eliminar" - parent handles the modal */
    onDeleteClick?: (category: CategoryItem) => void;
    /** Called when user clicks the item or "Ver detalles" - for navigation */
    onItemClick?: (category: CategoryItem) => void;
    /** Called when items are reordered via drag & drop */
    onReorder?: (orderedIds: string[]) => void;
    emptyMessage?: string;
    /** Enable drag & drop reordering */
    enableDragDrop?: boolean;
    /** Show hierarchical numbering (1, 1.1, 1.2) instead of folder icons */
    showNumbering?: boolean;
    /** Optional content to render at the end of the row (before actions) */
    renderEndContent?: (item: CategoryItem) => React.ReactNode;
}

// ============================================================================
// Helper: Build tree structure from flat list
// ============================================================================

interface TreeNode extends CategoryItem {
    children: TreeNode[];
    number?: string; // For hierarchical numbering (1, 1.1, etc.)
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

    // Sort by order first, then alphabetically as fallback
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes
            .sort((a, b) => {
                const orderA = a.order ?? 999999;
                const orderB = b.order ?? 999999;
                if (orderA !== orderB) return orderA - orderB;
                return (a.name || "").localeCompare(b.name || "");
            })
            .map(node => ({ ...node, children: sortNodes(node.children) }));
    };

    return sortNodes(roots);
}

// Assign hierarchical numbers to tree nodes
function assignNumbers(nodes: TreeNode[], prefix: string = ""): void {
    nodes.forEach((node, index) => {
        node.number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        assignNumbers(node.children, node.number);
    });
}

// Flatten tree back to ordered list of root IDs (for reorder callback)
function getRootOrder(nodes: TreeNode[]): string[] {
    return nodes.map(node => node.id);
}

// ============================================================================
// CategoryTree Component
// ============================================================================

export function CategoryTree({
    items,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onItemClick,
    onReorder,
    emptyMessage = "No hay categorías",
    enableDragDrop = false,
    showNumbering = false,
    renderEndContent
}: CategoryTreeProps) {
    // Accordion behavior: only one expanded per depth level
    // Key = depth level, Value = expanded node id at that level
    const [expandedByLevel, setExpandedByLevel] = useState<Map<number, string>>(new Map());

    // Local state for drag & drop ordering
    const [localItems, setLocalItems] = useState<CategoryItem[]>(items);

    // Update local items when props change
    useMemo(() => {
        setLocalItems(items);
    }, [items]);

    const tree = useMemo(() => {
        const builtTree = buildTree(localItems);
        if (showNumbering) {
            assignNumbers(builtTree);
        }
        return builtTree;
    }, [localItems, showNumbering]);

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

    // Handle drag end
    const handleDragEnd = (result: DropResult) => {
        const { destination, source, type } = result;

        // Dropped outside or same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        // Determine parent context from droppableId
        const parentId = type === "root" ? null : type;

        // Get siblings at this level
        const siblings = parentId
            ? localItems.filter(item => item.parent_id === parentId)
            : localItems.filter(item => !item.parent_id);
        const otherItems = parentId
            ? localItems.filter(item => item.parent_id !== parentId)
            : localItems.filter(item => item.parent_id);

        // Sort siblings by current order for correct index mapping
        const sortedSiblings = [...siblings].sort((a, b) => {
            const orderA = a.order ?? 999999;
            const orderB = b.order ?? 999999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.name || "").localeCompare(b.name || "");
        });

        // Reorder
        const [movedItem] = sortedSiblings.splice(source.index, 1);
        sortedSiblings.splice(destination.index, 0, movedItem);

        // Update order field
        const updatedSiblings = sortedSiblings.map((item, index) => ({
            ...item,
            order: index + 1
        }));

        setLocalItems([...otherItems, ...updatedSiblings]);

        // Call parent's onReorder with new order
        if (onReorder) {
            onReorder(updatedSiblings.map(item => item.id));
        }
    };

    const renderNode = (
        node: TreeNode,
        depth: number = 0,
        provided?: DraggableProvided,
        snapshot?: DraggableStateSnapshot
    ) => {
        const isExpanded = expandedByLevel.get(depth) === node.id;
        const hasChildren = node.children.length > 0;
        const isDragging = snapshot?.isDragging ?? false;

        return (
            <div
                key={node.id}
                className={cn(depth > 0 && "ml-6")}
                ref={provided?.innerRef}
                {...provided?.draggableProps}
            >
                {/* Category Card */}
                <Card
                    className={cn(
                        "group cursor-pointer hover:shadow-md transition-all mb-2",
                        isExpanded && "border-primary/50 shadow-md",
                        isDragging && "shadow-lg border-primary"
                    )}
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpanded(node.id, depth);
                        } else if (onItemClick) {
                            onItemClick(node);
                        }
                    }}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            {/* Drag Handle (all depths when drag enabled) */}
                            {enableDragDrop && provided?.dragHandleProps && (
                                <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <GripVertical className="h-5 w-5" />
                                </div>
                            )}

                            {/* Expand/Collapse Icon */}
                            <div className="w-5 h-5 flex items-center justify-center text-muted-foreground cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasChildren) toggleExpanded(node.id, depth);
                                }}
                            >
                                {hasChildren ? (
                                    isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />
                                ) : (
                                    <span className="w-5" />
                                )}
                            </div>

                            {/* Number or Folder Icon */}
                            {showNumbering && node.number ? (
                                <span className={cn(
                                    "shrink-0 font-mono text-sm font-medium min-w-[2rem]",
                                    isExpanded ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {node.number}
                                </span>
                            ) : (
                                isExpanded && hasChildren ? (
                                    <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                                ) : (
                                    <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                                )
                            )}

                            {/* Name and Description */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {node.name || "Sin nombre"}
                                        {hasChildren && (
                                            <span className="text-muted-foreground font-normal ml-1">
                                                ({node.children.length})
                                            </span>
                                        )}
                                    </span>
                                    {node.code && (
                                        <Badge variant="outline" className="text-xs font-mono">
                                            {node.code}
                                        </Badge>
                                    )}
                                </div>
                                {node.description && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        {node.description}
                                    </p>
                                )}
                            </div>

                            {/* Render Custom End Content */}
                            {renderEndContent && (
                                <div onClick={(e) => e.stopPropagation()}>
                                    {renderEndContent(node)}
                                </div>
                            )}

                            {/* Actions Dropdown */}
                            {(onAddClick || onEditClick || onDeleteClick || onItemClick) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onAddClick && (
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                onAddClick(node.id);
                                            }}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar subcategoría
                                            </DropdownMenuItem>
                                        )}
                                        {onEditClick && (
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                onEditClick(node);
                                            }}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                        )}
                                        {onItemClick && (
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                onItemClick(node);
                                            }}>
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Configurar
                                            </DropdownMenuItem>
                                        )}
                                        {onDeleteClick && (
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
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Children */}
                {isExpanded && enableDragDrop && onReorder && node.children.length > 0 ? (
                    <Droppable droppableId={`children-${node.id}`} type={node.id}>
                        {(childProvided) => (
                            <div
                                ref={childProvided.innerRef}
                                {...childProvided.droppableProps}
                            >
                                {node.children.map((child, childIndex) => (
                                    <Draggable key={child.id} draggableId={child.id} index={childIndex}>
                                        {(childDragProvided, childSnapshot) => renderNode(child, depth + 1, childDragProvided, childSnapshot)}
                                    </Draggable>
                                ))}
                                {childProvided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ) : (
                    isExpanded && node.children.map(child => renderNode(child, depth + 1))
                )}
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

    // If drag & drop is enabled, wrap with DragDropContext
    if (enableDragDrop && onReorder) {
        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="category-tree" type="root">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-0"
                        >
                            {tree.map((node, index) => (
                                <Draggable key={node.id} draggableId={node.id} index={index}>
                                    {(provided, snapshot) => renderNode(node, 0, provided, snapshot)}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }

    // Standard rendering without drag & drop
    return (
        <div className="space-y-0">
            {tree.map(node => renderNode(node))}
        </div>
    );
}
