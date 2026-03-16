"use client";

import { memo, useCallback, useMemo } from "react";
import { ListItem, type ListItemContextMenuAction } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import {
    Pencil,
    Trash2,
    FileText,
    Building2,
    FolderOpen,
    Calendar,
} from "lucide-react";
import { QuoteView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, QUOTE_TYPE_LABELS, QUOTE_TYPE_COLORS } from "@/features/quotes/types";

// ============================================================================
// Types
// ============================================================================

export interface QuoteListItemProps {
    /** The quote data to display */
    quote: QuoteView;
    /** Whether the item is selected (multi-select) */
    selected?: boolean;
    /** Whether edit/delete actions are visible */
    canEdit?: boolean;
    /** Whether we're in project context (hides the project column) */
    isProjectContext?: boolean;
    /** Format a monetary amount — pass useMoney().format */
    formatMoney: (amount: number) => string;
    /** Called when selection checkbox is toggled */
    onToggleSelect?: (id: string) => void;
    /** Called when Edit action is clicked */
    onEdit?: (quote: QuoteView) => void;
    /** Called when Delete action is clicked */
    onDelete?: (quote: QuoteView) => void;
    /** Called when the item row is clicked */
    onClick?: (quote: QuoteView) => void;
}

// ============================================================================
// Component
// ============================================================================

export const QuoteListItem = memo(function QuoteListItem({
    quote,
    selected = false,
    canEdit = false,
    isProjectContext = false,
    formatMoney,
    onToggleSelect,
    onEdit,
    onDelete,
    onClick,
}: QuoteListItemProps) {
    const handleToggle = useCallback(() => {
        onToggleSelect?.(quote.id);
    }, [onToggleSelect, quote.id]);

    const handleClick = useCallback(() => {
        onClick?.(quote);
    }, [onClick, quote]);

    const isChangeOrder = quote.quote_type === "change_order";

    // Build context menu actions
    const contextMenuActions = useMemo((): ListItemContextMenuAction[] | undefined => {
        if (!canEdit || (!onEdit && !onDelete)) return undefined;
        const actions: ListItemContextMenuAction[] = [];
        if (onEdit) {
            actions.push({
                label: "Editar",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => onEdit(quote),
            });
        }
        if (onDelete) {
            actions.push({
                label: "Eliminar",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                onClick: () => onDelete(quote),
                variant: "destructive",
            });
        }
        return actions;
    }, [canEdit, onEdit, onDelete, quote]);

    return (
        <ListItem
            variant="card"
            selected={selected}
            onClick={onClick ? handleClick : undefined}
            className={onClick ? "cursor-pointer" : undefined}
            contextMenuActions={contextMenuActions}
        >
            {/* Multi-select checkbox */}
            {onToggleSelect && (
                <ListItem.Checkbox checked={selected} onChange={handleToggle} />
            )}

            {/* Color strip: type-based — usa paleta de charts */}
            <ListItem.ColorStrip
                color={
                    quote.quote_type === "contract"
                        ? "chart-1"       /* Oliva */
                        : quote.quote_type === "change_order"
                            ? "chart-4"  /* Oro */
                            : "chart-2"  /* Lavanda */
                }
            />

            <ListItem.Content>
                {/* Line 1: Name */}
                <ListItem.Title>
                    {isChangeOrder && quote.parent_contract_name ? (
                        <span className="text-muted-foreground font-normal text-sm mr-1">
                            {quote.parent_contract_name} /
                        </span>
                    ) : null}
                    {quote.name}
                </ListItem.Title>

                {/* Line 2: Badges + meta */}
                <ListItem.Badges>
                    {/* Type */}
                    <Badge
                        variant="outline"
                        className={`text-xs ${QUOTE_TYPE_COLORS[quote.quote_type]}`}
                    >
                        {QUOTE_TYPE_LABELS[quote.quote_type]}
                    </Badge>

                    {/* Status */}
                    <Badge
                        variant="outline"
                        className={`text-xs ${QUOTE_STATUS_COLORS[quote.status]}`}
                    >
                        {QUOTE_STATUS_LABELS[quote.status]}
                    </Badge>

                    {/* Client */}
                    {quote.client_name && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {quote.client_name}
                        </span>
                    )}

                    {/* Project (only in org context) */}
                    {!isProjectContext && quote.project_name && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FolderOpen className="h-3 w-3" />
                            {quote.project_name}
                        </span>
                    )}
                </ListItem.Badges>
            </ListItem.Content>

            {/* Right side: Total + Date */}
            <div className="flex flex-col items-end gap-0.5 mr-2 min-w-[110px]">
                <span className="font-mono font-semibold text-base tabular-nums">
                    {formatMoney(quote.total_with_tax || 0)}
                </span>
                {quote.created_at && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {quote.created_at.split("T")[0]}
                    </span>
                )}
            </div>
        </ListItem>
    );
});
