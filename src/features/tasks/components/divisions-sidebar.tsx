"use client";

import { useState, useMemo } from "react";
import { Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskDivision } from "../types";

interface DivisionsSidebarProps {
    divisions: TaskDivision[];
    taskCounts: Record<string, number>;
    selectedDivisionId: string | null;
    onSelectDivision: (divisionId: string | null) => void;
    totalTasks: number;
}

// ============================================================================
// Build hierarchical tree with numbering
// ============================================================================

interface DivisionNode extends TaskDivision {
    children: DivisionNode[];
    number: string; // "1", "2", "1.1", "1.2", etc.
}

function buildDivisionTree(divisions: TaskDivision[]): DivisionNode[] {
    // Sort by order first
    const sorted = [...divisions].sort((a, b) => {
        const orderA = a.order ?? 999999;
        const orderB = b.order ?? 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || "").localeCompare(b.name || "");
    });

    // Create map for quick lookup
    const nodeMap = new Map<string, DivisionNode>();
    sorted.forEach(d => {
        nodeMap.set(d.id, { ...d, children: [], number: "" });
    });

    // Build tree structure
    const roots: DivisionNode[] = [];
    sorted.forEach(d => {
        const node = nodeMap.get(d.id)!;
        if (d.parent_id && nodeMap.has(d.parent_id)) {
            nodeMap.get(d.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // Assign numbers recursively
    function assignNumbers(nodes: DivisionNode[], prefix: string = "") {
        nodes.forEach((node, index) => {
            node.number = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
            assignNumbers(node.children, node.number);
        });
    }
    assignNumbers(roots);

    return roots;
}

// Flatten tree for rendering
function flattenTree(nodes: DivisionNode[], depth: number = 0): { node: DivisionNode; depth: number }[] {
    const result: { node: DivisionNode; depth: number }[] = [];
    nodes.forEach(node => {
        result.push({ node, depth });
        result.push(...flattenTree(node.children, depth + 1));
    });
    return result;
}

// ============================================================================
// Component
// ============================================================================

export function DivisionsSidebar({
    divisions,
    taskCounts,
    selectedDivisionId,
    onSelectDivision,
    totalTasks,
}: DivisionsSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Build tree with numbering
    const flatList = useMemo(() => {
        const tree = buildDivisionTree(divisions);
        return flattenTree(tree);
    }, [divisions]);

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
    const handleSelect = (divisionId: string | null) => {
        if (divisionId === selectedDivisionId) {
            onSelectDivision(null); // Deselect → back to "all"
        } else {
            onSelectDivision(divisionId);
        }
    };

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All Tasks option */}
            <DivisionItem
                name="Todas"
                count={totalTasks}
                isSelected={selectedDivisionId === null}
                onClick={() => onSelectDivision(null)}
                isAllTasks
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

            {/* Division list with hierarchy */}
            <div className="pt-1 space-y-0.5">
                {filteredList.map(({ node, depth }) => (
                    <DivisionItem
                        key={node.id}
                        name={node.name}
                        code={node.code}
                        number={node.number}
                        count={taskCounts[node.id] || 0}
                        depth={depth}
                        isSelected={selectedDivisionId === node.id}
                        onClick={() => handleSelect(node.id)}
                    />
                ))}

                {/* Sin División */}
                {!searchQuery && taskCounts["sin-division"] > 0 && (
                    <DivisionItem
                        name="Sin rubro"
                        count={taskCounts["sin-division"]}
                        isSelected={selectedDivisionId === "sin-division"}
                        onClick={() => handleSelect("sin-division")}
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

interface DivisionItemProps {
    name: string;
    code?: string | null;
    number?: string;
    count: number;
    depth?: number;
    isSelected: boolean;
    onClick: () => void;
    isAllTasks?: boolean;
}

function DivisionItem({ name, code, number, count, depth = 0, isSelected, onClick, isAllTasks }: DivisionItemProps) {
    // Use code if available, otherwise fallback to first 2 letters of name
    const compactLabel = code || name.slice(0, 2).toUpperCase();
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
            {isAllTasks && <Layers className="h-4 w-4 shrink-0" />}

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
