"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface CheckboxGridItem {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
}

interface CheckboxGridProps<T extends CheckboxGridItem> {
    items: T[];
    selectedIds: string[];
    onToggle: (id: string, checked: boolean) => Promise<{ error?: string | null }>;
    title?: string;
    description?: string;
    emptyMessage?: string;
    searchPlaceholder?: string;
    showSearch?: boolean;
    columns?: 1 | 2 | 3 | 4;
}

// ============================================================================
// Component
// ============================================================================

export function CheckboxGrid<T extends CheckboxGridItem>({
    items,
    selectedIds,
    onToggle,
    title,
    description,
    emptyMessage = "No hay items disponibles",
    searchPlaceholder = "Buscar...",
    showSearch = true,
    columns = 2,
}: CheckboxGridProps<T>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    // Filter items by search and sort alphabetically
    const filteredItems = items
        .filter(item => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
                item.name.toLowerCase().includes(query) ||
                item.code?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    // Handle toggle with optimistic UI
    const handleToggle = async (id: string, checked: boolean) => {
        // Optimistic loading state
        setLoadingIds(prev => new Set(prev).add(id));

        startTransition(async () => {
            const result = await onToggle(id, checked);

            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });

            if (result.error) {
                toast.error(result.error);
            }
        });
    };

    // Grid columns class
    const gridClass = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    }[columns];

    return (
        <div className="space-y-4">
            {/* Header */}
            {(title || description) && (
                <div>
                    {title && <h3 className="font-semibold">{title}</h3>}
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            )}

            {/* Search (optional) */}
            {showSearch && items.length > 6 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            )}

            {/* Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No se encontraron resultados" : emptyMessage}
                </div>
            ) : (
                <div className={cn("grid gap-2", gridClass)}>
                    {filteredItems.map((item) => {
                        const isChecked = selectedIds.includes(item.id);
                        const isLoading = loadingIds.has(item.id);

                        return (
                            <Card
                                key={item.id}
                                className={cn(
                                    "p-3 cursor-pointer transition-all hover:border-primary/50",
                                    isChecked && "border-primary bg-primary/5"
                                )}
                                onClick={() => !isLoading && handleToggle(item.id, !isChecked)}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Checkbox */}
                                    <div className="shrink-0">
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={(checked) => handleToggle(item.id, !!checked)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {item.code && (
                                                <Badge variant="outline" className="font-mono text-xs shrink-0">
                                                    {item.code}
                                                </Badge>
                                            )}
                                            <span className="font-medium truncate">{item.name}</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Loading overlay indicator */}
            {isPending && loadingIds.size === 0 && (
                <div className="text-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Guardando...
                </div>
            )}
        </div>
    );
}
