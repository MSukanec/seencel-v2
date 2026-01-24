"use client";

import { useState, useMemo } from "react";
import { Box, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskElement } from "../../types";

interface ElementsSidebarProps {
    elements: TaskElement[];
    parameterCounts: Record<string, number>;
    selectedElementId: string | null;
    onSelectElement: (elementId: string | null) => void;
    totalParameters: number;
}

// ============================================================================
// Component
// ============================================================================

export function ElementsSidebar({
    elements,
    parameterCounts,
    selectedElementId,
    onSelectElement,
    totalParameters,
}: ElementsSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Sort and filter elements
    const filteredElements = useMemo(() => {
        let result = [...elements].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
        );

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(el =>
                el.name.toLowerCase().includes(query) ||
                el.code?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [elements, searchQuery]);

    // Toggle select: click again to deselect
    const handleSelect = (elementId: string | null) => {
        if (elementId === selectedElementId) {
            onSelectElement(null); // Deselect → back to "all"
        } else {
            onSelectElement(elementId);
        }
    };

    return (
        <div className="p-2 space-y-0.5 group/sidebar" data-sidebar-content>
            {/* All Parameters option */}
            <ElementItem
                name="Todos"
                count={totalParameters}
                isSelected={selectedElementId === null}
                onClick={() => onSelectElement(null)}
                isAllElements
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

            {/* Element list */}
            <div className="pt-1 space-y-0.5">
                {filteredElements.map((element) => (
                    <ElementItem
                        key={element.id}
                        name={element.name}
                        code={element.code ?? undefined}
                        count={parameterCounts[element.id] || 0}
                        isSelected={selectedElementId === element.id}
                        onClick={() => handleSelect(element.id)}
                    />
                ))}
                {filteredElements.length === 0 && searchQuery && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        Sin resultados
                    </p>
                )}
            </div>
        </div>
    );
}

interface ElementItemProps {
    name: string;
    code?: string;
    count: number;
    isSelected: boolean;
    onClick: () => void;
    isAllElements?: boolean;
}

function ElementItem({ name, code, count, isSelected, onClick, isAllElements }: ElementItemProps) {
    const initials = name.slice(0, 2).toUpperCase();

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
            {isAllElements && <Box className="h-4 w-4 shrink-0" />}

            {code && (
                <span className={cn(
                    "shrink-0 text-muted-foreground font-mono text-xs",
                    "[[data-compact=true]_&]:hidden"
                )}>
                    {code}
                </span>
            )}

            <span className="flex-1 truncate [[data-compact=true]_&]:hidden">
                {name}
            </span>
            <span className="hidden [[data-compact=true]_&]:block text-center flex-1 font-medium">
                {initials}
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
