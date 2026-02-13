"use client";

import { KanbanCard, KanbanList, KanbanMember } from "@/features/planner/types";
import { cn } from "@/lib/utils";
import { KanbanCardItem } from "./kanban-card";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Plus,
    ChevronDown,
    ChevronRight,
    Trash2,
    Pencil,
    Archive,
    Move,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface KanbanColumnProps {
    list: KanbanList;
    cards: KanbanCard[];
    members?: KanbanMember[];
    onAddCard?: () => void;
    onEditList?: () => void;
    onDeleteList?: () => void;
    onMoveList?: () => void;
    onCardClick?: (card: KanbanCard) => void;
    onOptimisticDeleteCard?: (cardId: string) => void;
    isDragOver?: boolean;
    innerRef?: (element: HTMLElement | null) => void;
    draggableProps?: any;
    dragHandleProps?: any;
}

export function KanbanColumn({
    list,
    cards,
    members = [],
    onAddCard,
    onEditList,
    onDeleteList,
    onMoveList,
    onCardClick,
    onOptimisticDeleteCard,
    isDragOver,
    innerRef,
    draggableProps,
    dragHandleProps,
}: KanbanColumnProps) {
    const [isCollapsed, setIsCollapsed] = useState(list.is_collapsed);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);

    const activeCards = cards.filter(c => !c.is_archived);
    const archivedCards = cards.filter(c => c.is_archived);

    const completedCount = activeCards.filter(c => c.is_completed).length;
    const isAtLimit = list.limit_wip && activeCards.length >= list.limit_wip;

    return (
        <div
            ref={innerRef}
            {...draggableProps}
            className={cn(
                "flex flex-col bg-card rounded-xl w-full max-h-full",
                "border shadow-sm",
                isDragOver && "border-primary/50 ring-2 ring-primary/20",
            )}
        >
            {/* Column Header */}
            <div
                {...dragHandleProps}
                className="flex items-center justify-between p-3 gap-2 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Color indicator */}
                    {list.color && (
                        <div
                            className="w-1.5 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: list.color }}
                        />
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-sm truncate">
                        {list.name}
                    </h3>

                    {/* Card Count */}
                    <Badge
                        variant="secondary"
                        className={cn(
                            "h-5 px-1.5 text-xs shrink-0",
                            isAtLimit && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}
                    >
                        {activeCards.length}
                        {list.limit_wip && `/${list.limit_wip}`}
                    </Badge>

                    {/* Completed indicator */}
                    {completedCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            ✓{completedCount}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onAddCard}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEditList}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar columna
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onMoveList}>
                                <Move className="h-4 w-4 mr-2" />
                                Mover a otro tablero
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDeleteList}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar columna
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cards Container */}
            {!isCollapsed && (
                <Droppable droppableId={list.id} type="card">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex-1 overflow-y-auto px-2 pb-2 min-h-[100px]"
                        >
                            <div className="flex flex-col gap-2">
                                {activeCards.map((card, index) => (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{ ...provided.draggableProps.style }}
                                            >
                                                <KanbanCardItem
                                                    card={card}
                                                    members={members}
                                                    onClick={() => onCardClick?.(card)}
                                                    isDragging={snapshot.isDragging}
                                                    onOptimisticDelete={onOptimisticDeleteCard}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>

                            {/* Empty State visual helper if needed, but placeholder handles height */}
                            {activeCards.length === 0 && (
                                <button
                                    onClick={onAddCard}
                                    className="w-full h-12 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar tarjeta
                                </button>
                            )}
                        </div>
                    )}
                </Droppable>
            )}

            {/* Archived Cards Accordion */}
            {!isCollapsed && archivedCards.length > 0 && (
                <div className="mt-auto border-t">
                    <button
                        onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                        className="flex items-center justify-between w-full h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <Archive className="h-3 w-3" />
                            <span>Archivados ({archivedCards.length})</span>
                        </div>
                        {isArchiveOpen ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                    </button>

                    {isArchiveOpen && (
                        <div className="flex flex-col gap-2 p-2 bg-muted/30">
                            {archivedCards.map((card) => (
                                <KanbanCardItem
                                    key={card.id}
                                    card={card}
                                    members={members}
                                    onClick={() => onCardClick?.(card)}
                                    onOptimisticDelete={onOptimisticDeleteCard}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Card Button (bottom) */}
            {!isCollapsed && activeCards.length > 0 && (
                <div className="p-2 pt-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        onClick={onAddCard}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar tarjeta
                    </Button>
                </div>
            )}
        </div>
    );
}

