"use client";

import { KanbanCard, PRIORITY_CONFIG, KanbanMember } from "@/features/kanban/types";
import { cn } from "@/lib/utils";
import {
    Calendar,
    CheckSquare,
    MessageSquare,
    Paperclip,
    Clock,
    AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Archive, Trash2, RotateCcw, Pencil } from "lucide-react";
import { updateCard, deleteCard } from "@/features/kanban/actions";
import { useTransition, useOptimistic } from "react";
import { toast } from "sonner";
import { useModal } from "@/providers/modal-store";

interface KanbanCardItemProps {
    card: KanbanCard;
    members?: KanbanMember[];
    onClick?: () => void;
    isDragging?: boolean;
}

export function KanbanCardItem({ card, members = [], onClick, isDragging }: KanbanCardItemProps) {
    const { openModal, closeModal } = useModal();
    const [isPending, startTransition] = useTransition();

    // 🚀 OPTIMISTIC UI: Instant archive/restore visual feedback
    const [optimisticCard, setOptimisticCard] = useOptimistic(
        card,
        (currentCard, updates: Partial<KanbanCard>) => ({ ...currentCard, ...updates })
    );

    const priorityConfig = PRIORITY_CONFIG[optimisticCard.priority];
    const hasDueDate = !!optimisticCard.due_date;
    const isOverdue = hasDueDate && isPast(new Date(optimisticCard.due_date!)) && !optimisticCard.is_completed;
    const isDueToday = hasDueDate && isToday(new Date(optimisticCard.due_date!));

    // 🚀 OPTIMISTIC ARCHIVE: Visual feedback instantly, server in background
    const handleArchive = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newArchived = !optimisticCard.is_archived;

        startTransition(async () => {
            // Optimistic update - UI changes NOW
            setOptimisticCard({ is_archived: newArchived });

            try {
                await updateCard(card.id, { is_archived: newArchived });
                toast.success(newArchived ? "Tarjeta archivada" : "Tarjeta restaurada");
            } catch (error) {
                toast.error("Error al actualizar la tarjeta");
                // React reverts optimistic update on error
            }
        });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();

        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de eliminar esta tarjeta? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            startTransition(async () => {
                                try {
                                    await deleteCard(card.id);
                                    toast.success("Tarjeta eliminada");
                                    closeModal();
                                } catch (error) {
                                    toast.error("Error al eliminar la tarjeta");
                                }
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Tarjeta",
                description: `Confirmar eliminación de "${card.title}"`
            }
        );
    };
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-background border rounded-lg p-3 cursor-pointer",
                "hover:border-primary/50 transition-all duration-200",
                isDragging && "shadow-lg rotate-2 scale-105 opacity-90",
                (optimisticCard.is_completed || optimisticCard.is_archived) && "opacity-60"
            )}
        >
            {/* Cover Color */}
            {card.cover_color && (
                <div
                    className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
                    style={{ backgroundColor: card.cover_color }}
                />
            )}

            {/* Quick Actions Menu */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm border shadow-sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onClick?.();
                        }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleArchive}>
                            {optimisticCard.is_archived ? (
                                <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Restaurar
                                </>
                            ) : (
                                <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archivar
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Cover Image */}
            {card.cover_image_url && (
                <div className="relative -mx-3 -mt-3 mb-3 h-24 rounded-t-lg overflow-hidden">
                    <img
                        src={card.cover_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {card.labels.map((label) => (
                        <div
                            key={label.id}
                            className="h-2 w-8 rounded-full"
                            style={{ backgroundColor: label.color }}
                            title={label.name}
                        />
                    ))}
                </div>
            )}

            {/* Title */}
            <h4 className={cn(
                "text-sm font-medium leading-tight mb-2",
                card.is_completed && "line-through text-muted-foreground"
            )}>
                {card.title}
            </h4>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {/* Priority */}
                {card.priority !== 'none' && (
                    <Badge
                        variant="outline"
                        className={cn("h-5 px-1.5 text-[10px]", priorityConfig.color)}
                    >
                        {priorityConfig.label}
                    </Badge>
                )}

                {/* Due Date */}
                {hasDueDate && (
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]",
                        isOverdue && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        isDueToday && !isOverdue && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        !isOverdue && !isDueToday && "bg-muted"
                    )}>
                        {isOverdue ? (
                            <AlertCircle className="h-3 w-3" />
                        ) : (
                            <Calendar className="h-3 w-3" />
                        )}
                        {format(new Date(card.due_date!), "d MMM", { locale: es })}
                    </div>
                )}

                {/* Checklist Progress */}
                {card.checklist_progress && card.checklist_progress.total > 0 && (
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted",
                        card.checklist_progress.completed === card.checklist_progress.total
                        && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                        <CheckSquare className="h-3 w-3" />
                        {card.checklist_progress.completed}/{card.checklist_progress.total}
                    </div>
                )}

                {/* Comments */}
                {card.comment_count && card.comment_count > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {card.comment_count}
                    </div>
                )}

                {/* Attachments */}
                {card.attachment_count && card.attachment_count > 0 && (
                    <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {card.attachment_count}
                    </div>
                )}

                {/* Estimated Time */}
                {card.estimated_hours && (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {card.estimated_hours}h
                    </div>
                )}
            </div>

            {/* Assignees */}
            {(card.assigned_to || (card.assignees && card.assignees.length > 0)) && (
                <div className="flex items-center justify-end mt-2 -mr-1">
                    <div className="flex -space-x-2">
                        {card.assigned_to && (() => {
                            const member = members?.find(m => m.id === card.assigned_to);
                            if (!member) return null;
                            return (
                                <Avatar
                                    key={member.id}
                                    className="h-6 w-6 border-2 border-card"
                                >
                                    <AvatarImage src={member.avatar_url || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        {member.full_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                            );
                        })()}
                        {card.assignees?.slice(0, 3).map((assignee) => (
                            <Avatar
                                key={assignee.member_id}
                                className="h-6 w-6 border-2 border-card"
                            >
                                <AvatarImage src={assignee.avatar_url || ""} />
                                <AvatarFallback className="text-[10px]">
                                    {assignee.full_name?.[0] || "?"}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
